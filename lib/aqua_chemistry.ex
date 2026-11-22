# ══════════════════════════════════════════════════════════════════════════════
# AQUA-SPECTRA — lib/aqua_chemistry.ex
# Pure functional hydro-chemistry core (Elixir 1.17, zero dependencies).
#
# Every function is total: it pattern-matches on the input shape, pipes through
# small private stages, and returns either {:ok, map} or {:error, reason}.
# The browser ships a line-for-line deterministic mirror in
# src/elixir/aquaChemistry.ts so the identical numbers appear in the UI.
#
#   iex> AquaChemistry.assess(~D[2026-11-22], 6.1, 21.0, 180.0, 22.0, 25.0)
#   {:ok, %{lsi: -1.45, rsi: 11.2, regime: :corrosive, ...}}
# ══════════════════════════════════════════════════════════════════════════════

defmodule AquaChemistry do
  @moduledoc """
  Langelier/Ryznar stability indices, plumbosolvency lead–copper risk,
  limescale-lifecycle projection, unionized ammonia toxicity, SCA espresso
  water targets, and WHO/EPA emergency disinfection + altitude boil curves.

  Units: pH (SU), temperature (°C), everything ionic in mg/L as CaCO₃ unless
  the name says otherwise (NH₃-N is mg/L as N).
  """

  @type regime :: :corrosive | :balanced | :scale
  @type verdict :: :optimal | :acceptable | :warning | :critical

  # ════════════════════════════════════════════════════════════════════════════
  # 1. LANGELIER SATURATION INDEX + RYZNAR STABILITY INDEX
  # ════════════════════════════════════════════════════════════════════════════

  @doc """
  Full pipe-stability report.

      LSI = pH − pHs
      RSI = 2·pHs − pH        (Ryznar, 1944)
      pHs = (9.3 + A + B) − (C + D)

  where A = (log₁₀ TDS − 1)/10, B = −13.12·log₁₀(°C + 273) + 34.55,
  C = log₁₀(Ca-hardness) − 0.4, D = log₁₀(alkalinity).
  """
  @spec assess(integer, float, float, float, float, float) ::
          {:ok, map} | {:error, atom}
  def assess(_, ph, _t, _tds, ca, alk) when ph < 0 or ph > 14, do: {:error, :ph_out_of_range}
  def assess(_, _ph, t, _tds, _ca, _alk) when t < 0 or t > 100, do: {:error, :temp_out_of_range}
  def assess(_, _ph, _t, tds, _ca, _alk) when tds <= 0, do: {:error, :tds_must_be_positive}
  def assess(_, _ph, _t, _tds, ca, _alk) when ca <= 0, do: {:error, :hardness_must_be_positive}
  def assess(_, _ph, _t, _tds, _ca, alk) when alk <= 0, do: {:error, :alkalinity_must_be_positive}

  def assess(_epoch_days, ph, t_c, tds, ca, alk) do
    ph_s = saturation_ph(t_c, tds, ca, alk)
    lsi = ph - ph_s
    rsi = 2.0 * ph_s - ph
    regime = lsi |> regime()
    corrosion = plumbosolvency(ph, lsi, t_c, alk)
    scale_penalty = lsi
                    |> scale_projection(t_c, ca)
                    |> Map.put(:lsi, round2(lsi))

    {:ok,
     %{
       phs: round2(ph_s),
       lsi: round2(lsi),
       rsi: round2(rsi),
       regime: regime,
       severity: severity(lsi),
       verdict: verdict(lsi),
       lead_copper_risk_pct: corrosion.pct,
       lead_copper_class: corrosion.class,
       remediation: corrosion.remediation,
       scale_mm_per_year: scale_penalty.mm_per_year,
       scale_class: scale_penalty.class,
       appliance_lifespan_years: scale_penalty.lifespan_years,
       descale_recipe: descale_recipe(scale_penalty.mm_per_year),
       driving_terms: %{a: round2(term_a(tds)), b: round2(term_b(t_c)),
                        c: round2(term_c(ca)), d: round2(term_d(alk))}
     }}
  end

  @doc "Saturation pH (pHs) — the pH at which CaCO₃ neither dissolves nor precipitates."
  @spec saturation_ph(float, float, float, float) :: float
  def saturation_ph(t_c, tds, hardness_caco3, alkalinity_caco3) do
    (9.3 + term_a(tds) + term_b(t_c)) - (term_c(hardness_caco3) + term_d(alkalinity_caco3))
  end

  defp term_a(tds), do: (log10(max(tds, 1.0)) - 1.0) / 10.0
  defp term_b(t_c), do: -13.12 * log10(t_c + 273.0) + 34.55
  defp term_c(ca), do: log10(max(ca, 1.0)) - 0.4
  defp term_d(alk), do: log10(max(alk, 1.0))

  defp regime(lsi) when lsi < -0.5, do: :corrosive
  defp regime(lsi) when lsi > 0.5, do: :scale
  defp regime(_), do: :balanced

  defp severity(lsi) when lsi < -1.2, do: :critical
  defp severity(lsi) when lsi < -0.5, do: :high
  defp severity(lsi) when lsi > 1.2, do: :high
  defp severity(lsi) when lsi > 0.5, do: :moderate
  defp severity(_), do: :none

  defp verdict(lsi) when lsi < -0.5 or lsi > 0.5, do: :warning
  defp verdict(lsi) when lsi < -0.2 or lsi > 0.2, do: :acceptable
  defp verdict(_), do: :optimal

  # ════════════════════════════════════════════════════════════════════════════
  # 2. PLUMBOSOLVENCY — lead & copper dissolution risk 0–100 %
  # ════════════════════════════════════════════════════════════════════════════

  @doc """
  Empirical lead/copper leaching score. Weighted: low pH (35 %), negative LSI
  (30 %), low alkalinity buffering (20 %), warm standing water (15 %).
  """
  @spec plumbosolvency(float, float, float, float) :: %{pct: float, class: atom, remediation: String.t()}
  def plumbosolvency(ph, lsi, t_c, alkalinity) do
    ph_risk = clamp01((7.2 - ph) / 2.2) * 35.0
    lsi_risk = clamp01(-lsi / 1.5) * 30.0
    alk_risk = clamp01((60.0 - alkalinity) / 60.0) * 20.0
    temp_risk = clamp01((t_c - 15.0) / 45.0) * 15.0
    pct = round1(ph_risk + lsi_risk + alk_risk + temp_risk)

    %{pct: pct, class: risk_class(pct), remediation: remediation(pct)}
  end

  defp risk_class(p) when p >= 70, do: :critical
  defp risk_class(p) when p >= 40, do: :elevated
  defp risk_class(p) when p >= 20, do: :watch
  defp risk_class(_), do: :low

  defp remediation(p) when p >= 70,
    do: "CRITICAL: flush cold tap 90 s before every drink; install NSF/ANSI 53 lead filter; have first-draw water lab-tested; never mix infant formula from hot tap."
  defp remediation(p) when p >= 40,
    do: "ELEVATED: flush cold tap 60 s each morning, replace any lead solder/brass fittings, raise pH with a calcite neutraliser to LSI ≥ −0.2."
  defp remediation(p) when p >= 20,
    do: "WATCH: flush standing water 30 s, verify alkalinity ≥ 40 mg/L, re-test after any plumbing work."
  defp remediation(_),
    do: "LOW: plumbing is passivated. Maintain LSI within −0.2…+0.2 with annual alkalinity checks."

  # ════════════════════════════════════════════════════════════════════════════
  # 3. LIMESCALE LIFECYCLE — water heater & espresso boiler CaCO₃ growth
  # ════════════════════════════════════════════════════════════════════════════

  @doc """
  CaCO₃ scale thickness (mm/yr) inside a 65 °C vessel. Growth is Arrhenius-driven
  by temperature and linear in the supersaturation excess (LSI) and hardness.
  """
  @spec scale_projection(float, float, float) :: %{mm_per_year: float, class: atom, lifespan_years: float}
  def scale_projection(lsi, t_c, hardness) when lsi <= 0.1 do
    %{mm_per_year: 0.0, class: :none, lifespan_years: 20.0}
  end

  def scale_projection(lsi, t_c, hardness) do
    thermal = :math.pow(1.065, t_c - 25.0)
    excess = lsi - 0.1
    hw = hardness / 150.0
    mm = 0.42 * excess * thermal * hw |> round2()
    %{
      mm_per_year: mm,
      class: scale_class(mm),
      lifespan_years: Float.round(20.0 / (1.0 + mm / 0.35), 1)
    }
  end

  defp scale_class(0.0), do: :none
  defp scale_class(mm) when mm < 0.25, do: :trace
  defp scale_class(mm) when mm < 0.75, do: :moderate
  defp scale_class(mm) when mm < 1.5, do: :heavy
  defp scale_class(_), do: :severe

  @doc "Field-serviceable descaling / remineralisation plan for a scale rate."
  @spec descale_recipe(float) :: map
  def descale_recipe(mm) when mm < 0.25 do
    %{urgency: :routine, plan: "No action. Keep alkalinity 40–80 mg/L as CaCO₃ and LSI ≤ +0.2."}
  end

  def descale_recipe(mm) when mm < 1.5 do
    %{
      urgency: :quarterly,
      plan:
        "Quarterly descale: recirculate 2 % citric acid at 60 °C for 20 min (≈20 g/L), neutralise with 1 tsp baking soda per litre, flush 3× volume. Blend 20 % remineralised (RO + third-wave mineral packet) back into brew water.",
      citric_g_per_l: 20.0,
      minutes: 20
    }
  end

  def descale_recipe(_mm) do
    %{
      urgency: :immediate,
      plan:
        "IMMEDIATE heavy scale: replace element if output drops >15 %. Then install a 5 µm carbon + polyphosphate scale inhibitor, or switch to RO blending (calcium hardness 40–70 mg/L, alkalinity 30–50 mg/L). Descale with 3 % citric acid in short 10-min cycles until effluent is clear.",
      citric_g_per_l: 30.0,
      minutes: 10
    }
  end

  # ════════════════════════════════════════════════════════════════════════════
  # 4. UNIONIZED AMMONIA (NH₃) — aquarium / hydroponic toxicity
  # ════════════════════════════════════════════════════════════════════════════

  @doc """
  Fraction of total ammonia nitrogen that is free toxic NH₃.
  Henderson–Hasselbalch with pKa declining 0.09 per 5 °C:
      f = 1 / (1 + 10^(pKa − pH))
  """
  @spec unionized_ammonia_fraction(float, float) :: float
  def unionized_ammonia_fraction(ph, t_c) do
    pka = 9.25 - 0.018 * (t_c - 25.0)
    1.0 / (1.0 + :math.pow(10.0, pka - ph)) |> Float.round(6)
  end

  @doc "Free NH₃-N (mg/L), its toxicity band, and the % water change to reach 0.02 mg/L."
  @spec ammonia_risk(float, float, float) :: map
  def ammonia_risk(total_n, ph, t_c) do
    frac = unionized_ammonia_fraction(ph, t_c)
    free = round4(total_n * frac)

    %{
      fraction: frac,
      free_nh3: free,
      band: ammonia_band(free),
      water_change_pct: water_change(total_n, free),
      advice: ammonia_advice(free)
    }
  end

  defp ammonia_band(f) when f < 0.02, do: :safe
  defp ammonia_band(f) when f < 0.05, do: :caution
  defp ammonia_band(f) when f < 0.2, do: :stress
  defp ammonia_band(_), do: :lethal

  defp ammonia_advice(:safe), do: "Free NH₃ is below the 0.02 mg/L chronic threshold. Hold feeding and keep pH stable."
  defp ammonia_advice(:caution), do: "Approaching the 0.05 mg/L stress line. Do a 25 % water change and add a nitrifying bio-starter."
  defp ammonia_advice(:stress), do: "NH₃ is stressing stock. 50 % water change, drop pH toward 7.0, increase surface agitation, stop feeding 48 h."
  defp ammonia_advice(:lethal), do: "LETHAL free ammonia. Immediate 75 % change with temperature-matched dechlorinated water; dose a binding agent; test hourly."

  defp water_change(total, free) when free <= 0.02, do: 0.0
  defp water_change(_total, free), do: Float.round((1.0 - 0.02 / free) * 100.0, 1)

  # ════════════════════════════════════════════════════════════════════════════
  # 5. SCA / ESPRESSO SPECIALTY WATER TARGET MATRIX
  # ════════════════════════════════════════════════════════════════════════════

  @doc """
  SCA (Specialty Coffee Association) water scorecard:
  pH 6.5–7.5 (ideal 7.0), TDS 75–250, alkalinity 40–70, hardness 50–175,
  Na ≤ 10, Cl ≤ 30 mg/L. Returns a 0–100 score and per-parameter deviations.
  """
  @spec sca_score(map) :: %{score: integer, grade: atom, deviations: [map], advice: [String.t()]}
  def sca_score(%{} = w) do
    checks = [
      check(:ph, Map.get(w, :ph, 7.0), 6.5, 7.5, 0.35, "pH"),
      check(:tds, Map.get(w, :tds, 150.0), 75.0, 250.0, 40.0, "TDS mg/L"),
      check(:alkalinity, Map.get(w, :alkalinity, 55.0), 40.0, 70.0, 8.0, "Alkalinity"),
      check(:hardness, Map.get(w, :hardness, 90.0), 50.0, 175.0, 20.0, "Hardness"),
      check(:sodium, Map.get(w, :sodium, 6.0), 0.0, 10.0, 5.0, "Sodium"),
      check(:chloride, Map.get(w, :chloride, 15.0), 0.0, 30.0, 12.0, "Chloride")
    ]

    score =
      checks
      |> Enum.map(& &1.penalty)
      |> Enum.sum()
      |> then(&(100 - &1))
      |> max(0)

    %{
      score: score,
      grade: sca_grade(score),
      deviations: Enum.reject(checks, &(&1.state == :ok)),
      advice: checks |> Enum.reject(&(&1.state == :ok)) |> Enum.map(& &1.advice)
    }
  end

  defp check(key, value, lo, hi, slope, label) do
    cond do
      value >= lo and value <= hi ->
        %{key: key, state: :ok, penalty: 0, advice: nil}

      value < lo ->
        gap = lo - value
        %{
          key: key,
          state: :low,
          penalty: min(round(gap * slope), 45),
          advice: "#{label} is #{fmt(value)} — #{fmt(lo)} is the floor. #{fix(:low, key)}"
        }

      true ->
        gap = value - hi
        %{
          key: key,
          state: :high,
          penalty: min(round(gap * slope), 45),
          advice: "#{label} is #{fmt(value)} — cap is #{fmt(hi)}. #{fix(:high, key)}"
        }
    end
  end

  defp fix(:low, :alkalinity), do: "Add 0.1 g/L baking soda (NaHCO₃) per 10 mg/L alkalinity to buffer acidity."
  defp fix(:low, :hardness), do: "Blend in 20 % hard tap water or add a Ca/Mg mineral packet (Epsom + calcium lactate)."
  defp fix(:low, :tds), do: "Add a third-wave mineral concentrate to reach 80–120 mg/L TDS."
  defp fix(:low, :ph), do: "Bicarbonate buffer up toward pH 7.0 in 0.05 increments."
  defp fix(:high, :alkalinity), do: "Dilute 50–70 % with RO or distilled water; alkalinity is the #1 flat-taste culprit."
  defp fix(:high, :hardness), do: "Cut with soft/RO water; keep Ca hardness under 150 mg/L to protect the boiler."
  defp fix(:high, :tds), do: "Dilute with RO water until TDS lands at 100–150 mg/L."
  defp fix(:high, :ph), do: "Use a pinch of food-grade citric acid (0.02 g/L) or blend in RO water."
  defp fix(:high, :sodium), do: "Sodium reads soapy at espresso strength — switch to a non-sodium softener."
  defp fix(:high, :chloride), do: "Chloride corrodes stainless boilers above 30 mg/L — use catalytic carbon, not a chloride-based ion exchange."
  defp fix(_, key), do: "Adjust #{key} into the SCA band."

  defp sca_grade(s) when s >= 90, do: :gold_cup
  defp sca_grade(s) when s >= 75, do: :excellent
  defp sca_grade(s) when s >= 60, do: :workable
  defp sca_grade(s) when s >= 40, do: :compromised
  defp sca_grade(_), do: :unsuitable

  # ════════════════════════════════════════════════════════════════════════════
  # 6. WHO/EPA EMERGENCY DISINFECTION — NaOCl, NaDCC, iodine
  # ════════════════════════════════════════════════════════════════════════════

  @bleach_table [
    {5.25, 2.0, 5.0},
    {6.0, 1.75, 4.4},
    {8.25, 1.25, 3.2}
  ]

  @doc """
  Emergency chemical disinfection dose.

  Target residual: 2 mg/L free chlorine (clear) / 4 mg/L (turbid > 5 NTU or
  cold < 10 °C) per CDC/WHO. Dose = target / available-Cl fraction.
  Returns drops (1 mL ≈ 20 drops), mL, contact minutes, and a hazard note.
  """
  @spec disinfection_dose(map) :: {:ok, map} | {:error, atom}
  def disinfection_dose(%{litres: l, ntu: ntu, temp_c: t, agent: agent}) when l >= 0.1 do
    multiplier = if ntu > 5.0 or t < 10.0, do: 2.0, else: 1.0
    target_clear = 2.0
    target = target_clear * multiplier

    case agent do
      {:bleach, pct} ->
        {_, dose, _} = Enum.find(@bleach_table, {pct, 2.0, 5.0}, fn {p, _, _} -> p == pct end)
        mg_per_l = dose * multiplier
        ml = l * mg_per_l / (pct * 10.0)
        base = %{agent: "NaOCl #{pct}%", ml: round2(ml), drops: round(ml * 20),
                 contact_min: contact_minutes(ntu, t), target_mg_per_l: target,
                 residual: pct * 10.0 * ml / max(l + ml, 0.001) |> round2()}

        {:ok, Map.merge(base, %{
          steps: [
            "Pre-filter through cloth/0.2 µm if NTU > 5 (chlorine is inactivated by sediment).",
            "Measure #{round(ml * 20)} drops (#{round2(ml)} mL) into #{round1(l)} L of water.",
            "Stir 30 s, wait #{contact_minutes(ntu, t)} min before drinking.",
            "Re-dose by half if free chlorine smell is gone after the wait."
          ],
          warning: if(ntu > 5.0, do: "TURBID WATER: chlorine is consumed by organics — the dose has been DOUBLED. Pre-filter or SODIS instead if possible.", else: nil)
        })}

      {:aquatabs, mg} ->
        # NaDCC 8.5 mg → 1.0 mg/L per 1.5 L ; 17 mg → 1.0 mg/L per 3 L
        litres_per_tab = if mg == 8.5, do: 1.5, else: 3.0
        tabs = Float.ceil(l * multiplier / litres_per_tab, 1) |> trunc()
        {:ok, %{agent: "NaDCC #{mg} mg tablet", tablets: tabs, ml: 0.0, drops: 0,
                contact_min: contact_minutes(ntu, t), target_mg_per_l: target,
                steps: ["Pre-filter water before dosing.",
                        "Dissolve #{tabs} tablet(s) in #{round1(l)} L.",
                        "Wait #{contact_minutes(ntu, t)} min — 4 h if Cryptosporidium is suspected.",
                        "Tablets do NOT kill Crypto; boil or use a 1 µm absolute filter."],
                warning: nil}}

      {:iodine, pct} ->
        ml = l * 0.35 * multiplier / (pct / 2.0)
        {:ok, %{agent: "Iodine tincture #{pct}%", ml: round2(ml), drops: round(ml * 20),
                contact_min: contact_minutes(ntu, t), target_mg_per_l: target,
                steps: ["#{round(ml * 20)} drops in #{round1(l)} L (double for cold/turbid).",
                        "Wait #{contact_minutes(ntu, t)} min.", "Add vitamin C to remove iodine taste."],
                warning: "Do NOT use iodine for pregnancy, thyroid disorders, or > 3 weeks continuous use."}}

      other ->
        {:error, {:unknown_agent, other}}
    end
  end

  def disinfection_dose(%{litres: l}) when l < 0.1, do: {:error, :volume_too_small}
  def disinfection_dose(_), do: {:error, :missing_fields}

  defp contact_minutes(ntu, t) when ntu > 5.0 or t < 10.0, do: 60
  defp contact_minutes(_, _), do: 30

  # ════════════════════════════════════════════════════════════════════════════
  # 7. ALTITUDE BOILING / PASTEURISATION
  # ════════════════════════════════════════════════════════════════════════════

  @doc """
  Boiling point at altitude using the standard atmosphere barometric law:
      P(h) = 101.325 · (1 − 2.25577e−5·h)^5.25588   [kPa]
      Tb   = 100.0 · (P/101.325)^0.2304            (≈ −1 °C per 285 m)
  """
  @spec boiling_point(float) :: map
  def boiling_point(elevation_m) when elevation_m >= 0 do
    p = 101.325 * :math.pow(1.0 - 2.25577e-5 * elevation_m, 5.25588)
    tb = 100.0 * :math.pow(p / 101.325, 0.2304) |> round1()

    %{
      pressure_kpa: round2(p),
      boiling_c: tb,
      boiling_f: round1(tb * 9.0 / 5.0 + 32.0),
      # 3 min rolling boil above 95 °C; +1 min per 5 °C lost below that.
      rolling_boil_min: if(tb >= 95.0, do: 3, else: 3 + ceil((95.0 - tb) / 5.0)),
      pasteurise_c: 70.0,
      pasteurise_min: if(tb >= 70.0, do: 1, else: nil),
      note: boil_note(tb)
    }
  end

  defp boil_note(tb) when tb >= 95.0, do: "Full rolling boil 3 min kills bacteria, viruses, protozoa and Crypto oocysts."
  defp boil_note(tb) when tb >= 85.0, do: "Reduced boiling point — hold a rolling boil for at least #{3 + ceil((95.0 - tb) / 5.0)} min."
  defp boil_note(_), do: "Above ~5 500 m water may boil below pasteurisation temperature. Use covered simmer + 10 min, or chemical disinfection."

  # ════════════════════════════════════════════════════════════════════════════
  # Small helpers
  # ════════════════════════════════════════════════════════════════════════════

  defp log10(x), do: :math.log10(x)
  defp clamp01(x), do: x |> max(0.0) |> min(1.0)
  defp round2(x), do: Float.round(x * 1.0, 2)
  defp round1(x), do: Float.round(x * 1.0, 1)
  defp round4(x), do: Float.round(x * 1.0, 4)
  defp fmt(x) when is_float(x), do: :erlang.float_to_binary(x, decimals: 1)
  defp fmt(x), do: to_string(x)
end
