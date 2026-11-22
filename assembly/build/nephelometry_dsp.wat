(module
 (type $0 (func (param f64) (result f64)))
 (type $1 (func (param f64 f64) (result f64)))
 (type $2 (func (param f64 f64 f64) (result f64)))
 (type $3 (func (result i32)))
 (type $4 (func))
 (type $5 (func (param i32)))
 (type $6 (func (result f64)))
 (type $7 (func (param i32) (result f64)))
 (type $8 (func (param f64) (result i32)))
 (type $9 (func (param f64 f64 f64 f64 f64 f64) (result f64)))
 (type $10 (func (param i32 i32) (result i32)))
 (type $11 (func (param i32 i32 i32 i32)))
 (type $12 (func (param i64) (result i32)))
 (type $13 (func (param f64 i32) (result f64)))
 (type $14 (func (param f64 f64 f64)))
 (type $15 (func (param i32) (result i32)))
 (type $16 (func (param i32 f64) (result f64)))
 (type $17 (func (param f64 f64 f64 i32) (result f64)))
 (type $18 (func (param f64 f64 f64 f64) (result f64)))
 (type $19 (func (param f64 f64 f64 i32) (result i32)))
 (type $20 (func (param i32 f64 f64 f64) (result f64)))
 (import "env" "abort" (func $~lib/builtins/abort (param i32 i32 i32 i32)))
 (global $assembly/nephelometry_dsp/DSP_ABI_VERSION i32 (i32.const 1))
 (global $~lib/rt/stub/offset (mut i32) (i32.const 0))
 (global $assembly/nephelometry_dsp/SCRATCH_A (mut i32) (i32.const 0))
 (global $assembly/nephelometry_dsp/SCRATCH_B (mut i32) (i32.const 0))
 (global $~lib/math/rempio2_y0 (mut f64) (f64.const 0))
 (global $~lib/math/rempio2_y1 (mut f64) (f64.const 0))
 (global $~lib/math/res128_hi (mut i64) (i64.const 0))
 (global $~lib/memory/__stack_pointer (mut i32) (i32.const 17856))
 (memory $0 2)
 (data $0 (i32.const 1036) ",")
 (data $0.1 (i32.const 1048) "\02\00\00\00\1c\00\00\00I\00n\00v\00a\00l\00i\00d\00 \00l\00e\00n\00g\00t\00h")
 (data $1 (i32.const 1084) "<")
 (data $1.1 (i32.const 1096) "\02\00\00\00&\00\00\00~\00l\00i\00b\00/\00a\00r\00r\00a\00y\00b\00u\00f\00f\00e\00r\00.\00t\00s")
 (data $2 (i32.const 1148) "<")
 (data $2.1 (i32.const 1160) "\02\00\00\00(\00\00\00A\00l\00l\00o\00c\00a\00t\00i\00o\00n\00 \00t\00o\00o\00 \00l\00a\00r\00g\00e")
 (data $3 (i32.const 1212) "<")
 (data $3.1 (i32.const 1224) "\02\00\00\00\1e\00\00\00~\00l\00i\00b\00/\00r\00t\00/\00s\00t\00u\00b\00.\00t\00s")
 (data $4 (i32.const 1280) "n\83\f9\a2\00\00\00\00\d1W\'\fc)\15DN\99\95b\db\c0\dd4\f5\abcQ\feA\90C<:n$\b7a\c5\bb\de\ea.I\06\e0\d2MB\1c\eb\1d\fe\1c\92\d1\t\f55\82\e8>\a7)\b1&p\9c\e9\84D\bb.9\d6\919A~_\b4\8b_\84\9c\f49S\83\ff\97\f8\1f;(\f9\bd\8b\11/\ef\0f\98\05\de\cf~6m\1fm\nZf?FO\b7\t\cb\'\c7\ba\'u-\ea_\9e\f79\07={\f1\e5\eb\b1_\fbk\ea\92R\8aF0\03V\08]\8d\1f \bc\cf\f0\abk{\fca\91\e3\a9\1d6\f4\9a_\85\99e\08\1b\e6^\80\d8\ff\8d@h\a0\14W\15\06\061\'sM")
 (export "DSP_ABI_VERSION" (global $assembly/nephelometry_dsp/DSP_ABI_VERSION))
 (export "scratchA" (func $assembly/nephelometry_dsp/scratchA))
 (export "scratchB" (func $assembly/nephelometry_dsp/scratchB))
 (export "ntuFromScatter" (func $assembly/nephelometry_dsp/ntuFromScatter))
 (export "ntuFromContrast" (func $assembly/nephelometry_dsp/ntuFromContrast))
 (export "tssFromNtu" (func $assembly/nephelometry_dsp/tssFromNtu))
 (export "potabilityClass" (func $assembly/nephelometry_dsp/potabilityClass))
 (export "hazeLossPct" (func $assembly/nephelometry_dsp/hazeLossPct))
 (export "tdsFromEc" (func $assembly/nephelometry_dsp/tdsFromEc))
 (export "deltaE00" (func $assembly/nephelometry_dsp/deltaE00))
 (export "matchBestPad" (func $assembly/nephelometry_dsp/matchBestPad))
 (export "padDeltaE" (func $assembly/nephelometry_dsp/padDeltaE))
 (export "bestDeltaE" (func $assembly/nephelometry_dsp/bestDeltaE))
 (export "deltaEQuality" (func $assembly/nephelometry_dsp/deltaEQuality))
 (export "whiteBalanceGains" (func $assembly/nephelometry_dsp/whiteBalanceGains))
 (export "scratchBAt" (func $assembly/nephelometry_dsp/scratchBAt))
 (export "fillPctFromResonance" (func $assembly/nephelometry_dsp/fillPctFromResonance))
 (export "resonanceFromFill" (func $assembly/nephelometry_dsp/resonanceFromFill))
 (export "speedOfSound" (func $assembly/nephelometry_dsp/speedOfSound))
 (export "flowFromAcoustic" (func $assembly/nephelometry_dsp/flowFromAcoustic))
 (export "rmsForFlow" (func $assembly/nephelometry_dsp/rmsForFlow))
 (export "fft" (func $assembly/nephelometry_dsp/fft))
 (export "hannWindow" (func $assembly/nephelometry_dsp/hannWindow))
 (export "spectrumDb" (func $assembly/nephelometry_dsp/spectrumDb))
 (export "dominantFrequency" (func $assembly/nephelometry_dsp/dominantFrequency))
 (export "rmsDb" (func $assembly/nephelometry_dsp/rmsDb))
 (export "spectralCentroid" (func $assembly/nephelometry_dsp/spectralCentroid))
 (export "selfTest" (func $assembly/nephelometry_dsp/selfTest))
 (export "memory" (memory $0))
 (start $~start)
 (func $~stack_check
  global.get $~lib/memory/__stack_pointer
  i32.const 1472
  i32.lt_s
  if
   i32.const 17888
   i32.const 17936
   i32.const 1
   i32.const 1
   call $~lib/builtins/abort
   unreachable
  end
 )
 (func $~lib/math/NativeMath.cos (param $0 f64) (result f64)
  (local $1 f64)
  (local $2 f64)
  (local $3 i32)
  (local $4 i64)
  (local $5 i32)
  (local $6 f64)
  (local $7 f64)
  (local $8 f64)
  local.get $0
  i64.reinterpret_f64
  local.tee $4
  i64.const 32
  i64.shr_u
  i32.wrap_i64
  local.tee $5
  i32.const 31
  i32.shr_u
  local.set $3
  local.get $5
  i32.const 2147483647
  i32.and
  local.tee $5
  i32.const 1072243195
  i32.le_u
  if
   local.get $5
   i32.const 1044816030
   i32.lt_u
   if
    f64.const 1
    return
   end
   local.get $0
   local.get $0
   f64.mul
   local.tee $1
   local.get $1
   f64.mul
   local.set $2
   f64.const 1
   local.get $1
   f64.const 0.5
   f64.mul
   local.tee $6
   f64.sub
   local.tee $7
   f64.const 1
   local.get $7
   f64.sub
   local.get $6
   f64.sub
   local.get $1
   local.get $1
   local.get $1
   local.get $1
   f64.const 2.480158728947673e-05
   f64.mul
   f64.const -0.001388888888887411
   f64.add
   f64.mul
   f64.const 0.0416666666666666
   f64.add
   f64.mul
   local.get $2
   local.get $2
   f64.mul
   local.get $1
   local.get $1
   f64.const -1.1359647557788195e-11
   f64.mul
   f64.const 2.087572321298175e-09
   f64.add
   f64.mul
   f64.const -2.7557314351390663e-07
   f64.add
   f64.mul
   f64.add
   f64.mul
   local.get $0
   f64.const 0
   f64.mul
   f64.sub
   f64.add
   f64.add
   return
  end
  local.get $5
  i32.const 2146435072
  i32.ge_u
  if
   local.get $0
   local.get $0
   f64.sub
   return
  end
  block $~lib/math/rempio2|inlined.1 (result i32)
   local.get $4
   i64.const 32
   i64.shr_u
   i32.wrap_i64
   i32.const 2147483647
   i32.and
   local.tee $5
   i32.const 1094263291
   i32.lt_u
   if
    local.get $5
    i32.const 20
    i32.shr_u
    local.tee $3
    local.get $0
    local.get $0
    f64.const 0.6366197723675814
    f64.mul
    f64.nearest
    local.tee $6
    f64.const 1.5707963267341256
    f64.mul
    f64.sub
    local.tee $0
    local.get $6
    f64.const 6.077100506506192e-11
    f64.mul
    local.tee $2
    f64.sub
    local.tee $1
    i64.reinterpret_f64
    i64.const 32
    i64.shr_u
    i32.wrap_i64
    i32.const 20
    i32.shr_u
    i32.const 2047
    i32.and
    i32.sub
    i32.const 16
    i32.gt_u
    if
     local.get $6
     f64.const 2.0222662487959506e-21
     f64.mul
     local.get $0
     local.get $0
     local.get $6
     f64.const 6.077100506303966e-11
     f64.mul
     local.tee $1
     f64.sub
     local.tee $0
     f64.sub
     local.get $1
     f64.sub
     f64.sub
     local.set $2
     local.get $3
     local.get $0
     local.get $2
     f64.sub
     local.tee $1
     i64.reinterpret_f64
     i64.const 32
     i64.shr_u
     i32.wrap_i64
     i32.const 20
     i32.shr_u
     i32.const 2047
     i32.and
     i32.sub
     i32.const 49
     i32.gt_u
     if
      local.get $6
      f64.const 8.4784276603689e-32
      f64.mul
      local.get $0
      local.get $0
      local.get $6
      f64.const 2.0222662487111665e-21
      f64.mul
      local.tee $1
      f64.sub
      local.tee $0
      f64.sub
      local.get $1
      f64.sub
      f64.sub
      local.set $2
      local.get $0
      local.get $2
      f64.sub
      local.set $1
     end
    end
    local.get $1
    global.set $~lib/math/rempio2_y0
    local.get $0
    local.get $1
    f64.sub
    local.get $2
    f64.sub
    global.set $~lib/math/rempio2_y1
    local.get $6
    i32.trunc_sat_f64_s
    br $~lib/math/rempio2|inlined.1
   end
   i32.const 0
   local.get $4
   call $~lib/math/pio2_large_quot
   local.tee $5
   i32.sub
   local.get $5
   local.get $3
   select
  end
  local.set $3
  global.get $~lib/math/rempio2_y0
  local.set $1
  global.get $~lib/math/rempio2_y1
  local.set $2
  local.get $3
  i32.const 1
  i32.and
  if (result f64)
   local.get $1
   local.get $1
   f64.mul
   local.tee $0
   local.get $1
   f64.mul
   local.set $6
   local.get $1
   local.get $0
   local.get $2
   f64.const 0.5
   f64.mul
   local.get $6
   local.get $0
   local.get $0
   f64.const 2.7557313707070068e-06
   f64.mul
   f64.const -1.984126982985795e-04
   f64.add
   f64.mul
   f64.const 0.00833333333332249
   f64.add
   local.get $0
   local.get $0
   local.get $0
   f64.mul
   f64.mul
   local.get $0
   f64.const 1.58969099521155e-10
   f64.mul
   f64.const -2.5050760253406863e-08
   f64.add
   f64.mul
   f64.add
   f64.mul
   f64.sub
   f64.mul
   local.get $2
   f64.sub
   local.get $6
   f64.const -0.16666666666666632
   f64.mul
   f64.sub
   f64.sub
  else
   local.get $1
   local.get $1
   f64.mul
   local.tee $0
   local.get $0
   f64.mul
   local.set $6
   f64.const 1
   local.get $0
   f64.const 0.5
   f64.mul
   local.tee $7
   f64.sub
   local.tee $8
   f64.const 1
   local.get $8
   f64.sub
   local.get $7
   f64.sub
   local.get $0
   local.get $0
   local.get $0
   local.get $0
   f64.const 2.480158728947673e-05
   f64.mul
   f64.const -0.001388888888887411
   f64.add
   f64.mul
   f64.const 0.0416666666666666
   f64.add
   f64.mul
   local.get $6
   local.get $6
   f64.mul
   local.get $0
   local.get $0
   f64.const -1.1359647557788195e-11
   f64.mul
   f64.const 2.087572321298175e-09
   f64.add
   f64.mul
   f64.const -2.7557314351390663e-07
   f64.add
   f64.mul
   f64.add
   f64.mul
   local.get $1
   local.get $2
   f64.mul
   f64.sub
   f64.add
   f64.add
  end
  local.tee $0
  f64.neg
  local.get $0
  local.get $3
  i32.const 1
  i32.add
  i32.const 2
  i32.and
  select
 )
 (func $~lib/math/NativeMath.pow (param $0 f64) (param $1 f64) (result f64)
  (local $2 i32)
  (local $3 f64)
  (local $4 i32)
  (local $5 i64)
  (local $6 i32)
  (local $7 i32)
  (local $8 i32)
  (local $9 i32)
  (local $10 f64)
  (local $11 i64)
  (local $12 i32)
  (local $13 i32)
  (local $14 i32)
  (local $15 i32)
  (local $16 f64)
  (local $17 f64)
  (local $18 f64)
  (local $19 f64)
  (local $20 f64)
  (local $21 f64)
  local.get $1
  f64.abs
  f64.const 2
  f64.le
  if
   local.get $1
   f64.const 2
   f64.eq
   if
    local.get $0
    local.get $0
    f64.mul
    return
   end
   local.get $1
   f64.const 0.5
   f64.eq
   if
    local.get $0
    f64.sqrt
    f64.abs
    f64.const inf
    local.get $0
    f64.const -inf
    f64.ne
    select
    return
   end
   local.get $1
   f64.const -1
   f64.eq
   if
    f64.const 1
    local.get $0
    f64.div
    return
   end
   local.get $1
   f64.const 1
   f64.eq
   if
    local.get $0
    return
   end
   local.get $1
   f64.const 0
   f64.eq
   if
    f64.const 1
    return
   end
  end
  local.get $0
  i64.reinterpret_f64
  local.tee $11
  i64.const 32
  i64.shr_u
  i32.wrap_i64
  local.tee $6
  i32.const 2147483647
  i32.and
  local.set $2
  local.get $1
  i64.reinterpret_f64
  local.tee $5
  i64.const 32
  i64.shr_u
  i32.wrap_i64
  local.tee $12
  i32.const 2147483647
  i32.and
  local.tee $13
  local.get $5
  i32.wrap_i64
  local.tee $8
  i32.or
  i32.eqz
  if
   f64.const 1
   return
  end
  local.get $13
  i32.const 2146435072
  i32.eq
  local.get $8
  i32.const 0
  i32.ne
  i32.and
  local.get $2
  i32.const 2146435072
  i32.eq
  local.get $11
  i32.wrap_i64
  local.tee $7
  i32.const 0
  i32.ne
  i32.and
  local.get $2
  i32.const 2146435072
  i32.gt_s
  i32.or
  local.get $13
  i32.const 2146435072
  i32.gt_u
  i32.or
  i32.or
  if
   local.get $0
   local.get $1
   f64.add
   return
  end
  local.get $6
  i32.const 0
  i32.lt_s
  if (result i32)
   local.get $13
   i32.const 1128267776
   i32.ge_u
   if (result i32)
    i32.const 2
   else
    local.get $13
    i32.const 1072693248
    i32.ge_u
    if (result i32)
     i32.const 52
     i32.const 20
     local.get $13
     i32.const 20
     i32.shr_u
     i32.const 1023
     i32.sub
     local.tee $9
     i32.const 20
     i32.gt_s
     local.tee $14
     select
     local.get $9
     i32.sub
     local.set $15
     i32.const 2
     local.get $8
     local.get $13
     local.get $14
     select
     local.tee $14
     local.get $15
     i32.shr_u
     local.tee $9
     i32.const 1
     i32.and
     i32.sub
     i32.const 0
     local.get $9
     local.get $15
     i32.shl
     local.get $14
     i32.eq
     select
    else
     i32.const 0
    end
   end
  else
   i32.const 0
  end
  local.set $9
  local.get $8
  i32.eqz
  if
   local.get $13
   i32.const 2146435072
   i32.eq
   if
    local.get $2
    i32.const 1072693248
    i32.sub
    local.get $7
    i32.or
    if (result f64)
     local.get $1
     f64.const 0
     local.get $12
     i32.const 0
     i32.ge_s
     local.tee $4
     select
     f64.const 0
     local.get $1
     f64.neg
     local.get $4
     select
     local.get $2
     i32.const 1072693248
     i32.ge_s
     select
    else
     f64.const nan:0x8000000000000
    end
    return
   end
   local.get $13
   i32.const 1072693248
   i32.eq
   if
    local.get $12
    i32.const 0
    i32.ge_s
    if
     local.get $0
     return
    end
    f64.const 1
    local.get $0
    f64.div
    return
   end
   local.get $12
   i32.const 1073741824
   i32.eq
   if
    local.get $0
    local.get $0
    f64.mul
    return
   end
   local.get $12
   i32.const 1071644672
   i32.eq
   local.get $6
   i32.const 0
   i32.ge_s
   i32.and
   if
    local.get $0
    f64.sqrt
    return
   end
  end
  local.get $0
  f64.abs
  local.set $3
  local.get $7
  i32.eqz
  local.get $2
  i32.eqz
  local.get $2
  i32.const 2146435072
  i32.eq
  i32.or
  local.get $2
  i32.const 1072693248
  i32.eq
  i32.or
  i32.and
  if
   f64.const 1
   local.get $3
   f64.div
   local.get $3
   local.get $12
   i32.const 0
   i32.lt_s
   select
   local.set $0
   local.get $6
   i32.const 0
   i32.lt_s
   if (result f64)
    local.get $2
    i32.const 1072693248
    i32.sub
    local.get $9
    i32.or
    if (result f64)
     local.get $0
     f64.neg
     local.get $0
     local.get $9
     i32.const 1
     i32.eq
     select
    else
     local.get $0
     local.get $0
     f64.sub
     local.tee $0
     local.get $0
     f64.div
    end
   else
    local.get $0
   end
   return
  end
  local.get $6
  i32.const 0
  i32.lt_s
  if (result f64)
   local.get $9
   i32.eqz
   if
    local.get $0
    local.get $0
    f64.sub
    local.tee $0
    local.get $0
    f64.div
    return
   end
   f64.const -1
   f64.const 1
   local.get $9
   i32.const 1
   i32.eq
   select
  else
   f64.const 1
  end
  local.set $16
  local.get $13
  i32.const 1105199104
  i32.gt_u
  if (result f64)
   local.get $13
   i32.const 1139802112
   i32.gt_u
   if
    local.get $2
    i32.const 1072693247
    i32.le_s
    if
     f64.const inf
     f64.const 0
     local.get $12
     i32.const 0
     i32.lt_s
     select
     return
    end
    local.get $2
    i32.const 1072693248
    i32.ge_s
    if
     f64.const inf
     f64.const 0
     local.get $12
     i32.const 0
     i32.gt_s
     select
     return
    end
   end
   local.get $2
   i32.const 1072693247
   i32.lt_s
   if
    local.get $16
    f64.const 1.e+300
    f64.mul
    f64.const 1.e+300
    f64.mul
    local.get $16
    f64.const 1e-300
    f64.mul
    f64.const 1e-300
    f64.mul
    local.get $12
    i32.const 0
    i32.lt_s
    select
    return
   end
   local.get $2
   i32.const 1072693248
   i32.gt_s
   if
    local.get $16
    f64.const 1.e+300
    f64.mul
    f64.const 1.e+300
    f64.mul
    local.get $16
    f64.const 1e-300
    f64.mul
    f64.const 1e-300
    f64.mul
    local.get $12
    i32.const 0
    i32.gt_s
    select
    return
   end
   local.get $3
   f64.const -1
   f64.add
   local.tee $0
   f64.const 1.4426950216293335
   f64.mul
   local.tee $3
   local.get $0
   f64.const 1.9259629911266175e-08
   f64.mul
   local.get $0
   local.get $0
   f64.mul
   f64.const 0.5
   local.get $0
   f64.const 0.3333333333333333
   local.get $0
   f64.const 0.25
   f64.mul
   f64.sub
   f64.mul
   f64.sub
   f64.mul
   f64.const 1.4426950408889634
   f64.mul
   f64.sub
   local.tee $10
   f64.add
   i64.reinterpret_f64
   i64.const -4294967296
   i64.and
   f64.reinterpret_i64
   local.set $0
   local.get $10
   local.get $0
   local.get $3
   f64.sub
   f64.sub
  else
   local.get $2
   i32.const 1048576
   i32.lt_s
   if
    i32.const -53
    local.set $4
    local.get $3
    f64.const 9007199254740992
    f64.mul
    local.tee $3
    i64.reinterpret_f64
    i64.const 32
    i64.shr_u
    i32.wrap_i64
    local.set $2
   end
   local.get $4
   local.get $2
   i32.const 20
   i32.shr_s
   i32.const 1023
   i32.sub
   i32.add
   local.set $4
   local.get $2
   i32.const 1048575
   i32.and
   local.tee $6
   i32.const 1072693248
   i32.or
   local.set $2
   local.get $6
   i32.const 235662
   i32.le_u
   if (result i32)
    i32.const 0
   else
    local.get $6
    i32.const 767610
    i32.lt_u
    if (result i32)
     i32.const 1
    else
     local.get $4
     i32.const 1
     i32.add
     local.set $4
     local.get $2
     i32.const -1048576
     i32.add
     local.set $2
     i32.const 0
    end
   end
   local.set $6
   local.get $3
   i64.reinterpret_f64
   i64.const 4294967295
   i64.and
   local.get $2
   i64.extend_i32_s
   i64.const 32
   i64.shl
   i64.or
   f64.reinterpret_i64
   local.tee $17
   f64.const 1.5
   f64.const 1
   local.get $6
   select
   local.tee $18
   f64.sub
   local.tee $19
   f64.const 1
   local.get $17
   local.get $18
   f64.add
   f64.div
   local.tee $0
   f64.mul
   local.tee $20
   i64.reinterpret_f64
   i64.const -4294967296
   i64.and
   f64.reinterpret_i64
   local.tee $21
   local.get $21
   f64.mul
   local.set $3
   local.get $21
   local.get $3
   f64.const 3
   f64.add
   local.get $20
   local.get $20
   f64.mul
   local.tee $10
   local.get $10
   f64.mul
   local.get $10
   local.get $10
   local.get $10
   local.get $10
   local.get $10
   f64.const 0.20697501780033842
   f64.mul
   f64.const 0.23066074577556175
   f64.add
   f64.mul
   f64.const 0.272728123808534
   f64.add
   f64.mul
   f64.const 0.33333332981837743
   f64.add
   f64.mul
   f64.const 0.4285714285785502
   f64.add
   f64.mul
   f64.const 0.5999999999999946
   f64.add
   f64.mul
   local.get $0
   local.get $19
   local.get $21
   local.get $2
   i32.const 1
   i32.shr_s
   i32.const 536870912
   i32.or
   i32.const 524288
   i32.add
   local.get $6
   i32.const 18
   i32.shl
   i32.add
   i64.extend_i32_s
   i64.const 32
   i64.shl
   f64.reinterpret_i64
   local.tee $0
   f64.mul
   f64.sub
   local.get $21
   local.get $17
   local.get $0
   local.get $18
   f64.sub
   f64.sub
   f64.mul
   f64.sub
   f64.mul
   local.tee $0
   local.get $21
   local.get $20
   f64.add
   f64.mul
   f64.add
   local.tee $10
   f64.add
   i64.reinterpret_f64
   i64.const -4294967296
   i64.and
   f64.reinterpret_i64
   local.tee $17
   f64.mul
   local.tee $18
   local.get $0
   local.get $17
   f64.mul
   local.get $10
   local.get $17
   f64.const -3
   f64.add
   local.get $3
   f64.sub
   f64.sub
   local.get $20
   f64.mul
   f64.add
   local.tee $0
   f64.add
   i64.reinterpret_f64
   i64.const -4294967296
   i64.and
   f64.reinterpret_i64
   local.tee $3
   f64.const 0.9617967009544373
   f64.mul
   local.set $10
   local.get $3
   f64.const -7.028461650952758e-09
   f64.mul
   local.get $0
   local.get $3
   local.get $18
   f64.sub
   f64.sub
   f64.const 0.9617966939259756
   f64.mul
   f64.add
   f64.const 1.350039202129749e-08
   f64.const 0
   local.get $6
   select
   f64.add
   local.tee $0
   local.get $10
   local.get $0
   f64.add
   f64.const 0.5849624872207642
   f64.const 0
   local.get $6
   select
   local.tee $3
   f64.add
   local.get $4
   f64.convert_i32_s
   local.tee $17
   f64.add
   i64.reinterpret_f64
   i64.const -4294967296
   i64.and
   f64.reinterpret_i64
   local.tee $0
   local.get $17
   f64.sub
   local.get $3
   f64.sub
   local.get $10
   f64.sub
   f64.sub
  end
  local.set $3
  local.get $1
  local.get $1
  i64.reinterpret_f64
  i64.const -4294967296
  i64.and
  f64.reinterpret_i64
  local.tee $10
  f64.sub
  local.get $0
  f64.mul
  local.get $1
  local.get $3
  f64.mul
  f64.add
  local.tee $1
  local.get $10
  local.get $0
  f64.mul
  local.tee $0
  f64.add
  local.tee $3
  i64.reinterpret_f64
  local.tee $5
  i64.const 32
  i64.shr_u
  i32.wrap_i64
  local.set $2
  local.get $5
  i32.wrap_i64
  local.set $4
  block $folding-inner1
   block $folding-inner0
    local.get $2
    i32.const 1083179008
    i32.ge_s
    if
     local.get $2
     i32.const 1083179008
     i32.sub
     local.get $4
     i32.or
     local.get $1
     f64.const 8.008566259537294e-17
     f64.add
     local.get $3
     local.get $0
     f64.sub
     f64.gt
     i32.or
     br_if $folding-inner0
    else
     local.get $2
     i32.const 2147483647
     i32.and
     i32.const 1083231232
     i32.ge_u
     i32.const 0
     local.get $2
     i32.const 1064252416
     i32.add
     local.get $4
     i32.or
     local.get $1
     local.get $3
     local.get $0
     f64.sub
     f64.le
     i32.or
     select
     br_if $folding-inner1
    end
    local.get $2
    i32.const 2147483647
    i32.and
    local.tee $6
    i32.const 20
    i32.shr_u
    i32.const 1023
    i32.sub
    local.set $7
    i32.const 0
    local.set $4
    local.get $6
    i32.const 1071644672
    i32.gt_u
    if
     i32.const 1048575
     local.get $2
     i32.const 1048576
     local.get $7
     i32.const 1
     i32.add
     i32.shr_s
     i32.add
     local.tee $4
     i32.const 2147483647
     i32.and
     i32.const 20
     i32.shr_u
     i32.const 1023
     i32.sub
     local.tee $6
     i32.shr_s
     i32.const -1
     i32.xor
     local.get $4
     i32.and
     i64.extend_i32_s
     i64.const 32
     i64.shl
     f64.reinterpret_i64
     local.set $3
     i32.const 0
     local.get $4
     i32.const 1048575
     i32.and
     i32.const 1048576
     i32.or
     i32.const 20
     local.get $6
     i32.sub
     i32.shr_s
     local.tee $4
     i32.sub
     local.get $4
     local.get $2
     i32.const 0
     i32.lt_s
     select
     local.set $4
     local.get $0
     local.get $3
     f64.sub
     local.set $0
    end
    local.get $1
    local.get $0
    f64.add
    i64.reinterpret_f64
    i64.const -4294967296
    i64.and
    f64.reinterpret_i64
    local.tee $3
    f64.const 0.6931471824645996
    f64.mul
    local.tee $10
    local.get $1
    local.get $3
    local.get $0
    f64.sub
    f64.sub
    f64.const 0.6931471805599453
    f64.mul
    local.get $3
    f64.const -1.904654299957768e-09
    f64.mul
    f64.add
    local.tee $0
    f64.add
    local.tee $1
    local.get $1
    f64.mul
    local.set $3
    local.get $16
    f64.const 1
    local.get $1
    local.get $1
    local.get $3
    local.get $3
    local.get $3
    local.get $3
    local.get $3
    f64.const 4.1381367970572385e-08
    f64.mul
    f64.const -1.6533902205465252e-06
    f64.add
    f64.mul
    f64.const 6.613756321437934e-05
    f64.add
    f64.mul
    f64.const -2.7777777777015593e-03
    f64.add
    f64.mul
    f64.const 0.16666666666666602
    f64.add
    f64.mul
    f64.sub
    local.tee $3
    f64.mul
    local.get $3
    f64.const -2
    f64.add
    f64.div
    local.get $0
    local.get $1
    local.get $10
    f64.sub
    f64.sub
    local.tee $0
    local.get $1
    local.get $0
    f64.mul
    f64.add
    f64.sub
    local.get $1
    f64.sub
    f64.sub
    local.tee $0
    i64.reinterpret_f64
    i64.const 32
    i64.shr_u
    i32.wrap_i64
    local.get $4
    i32.const 20
    i32.shl
    i32.add
    local.tee $2
    i32.const 20
    i32.shr_s
    i32.const 0
    i32.le_s
    if (result f64)
     local.get $0
     local.get $4
     call $~lib/math/NativeMath.scalbn
    else
     local.get $0
     i64.reinterpret_f64
     i64.const 4294967295
     i64.and
     local.get $2
     i64.extend_i32_s
     i64.const 32
     i64.shl
     i64.or
     f64.reinterpret_i64
    end
    f64.mul
    return
   end
   local.get $16
   f64.const 1.e+300
   f64.mul
   f64.const 1.e+300
   f64.mul
   return
  end
  local.get $16
  f64.const 1e-300
  f64.mul
  f64.const 1e-300
  f64.mul
 )
 (func $assembly/nephelometry_dsp/deltaE00 (param $0 f64) (param $1 f64) (param $2 f64) (param $3 f64) (param $4 f64) (param $5 f64) (result f64)
  (local $6 f64)
  (local $7 f64)
  (local $8 f64)
  f64.const 1
  local.get $1
  local.get $1
  f64.mul
  local.get $2
  local.get $2
  f64.mul
  local.tee $6
  f64.add
  f64.sqrt
  local.get $4
  local.get $4
  f64.mul
  local.get $5
  local.get $5
  f64.mul
  local.tee $7
  f64.add
  f64.sqrt
  f64.add
  f64.const 0.5
  f64.mul
  f64.const 7
  call $~lib/math/NativeMath.pow
  local.tee $8
  local.get $8
  f64.const 6103515625
  f64.add
  f64.div
  f64.sqrt
  f64.sub
  f64.const 0.5
  f64.mul
  f64.const 1
  f64.add
  local.tee $8
  local.get $1
  f64.mul
  local.tee $1
  local.get $1
  f64.mul
  local.get $6
  f64.add
  f64.sqrt
  local.set $6
  local.get $8
  local.get $4
  f64.mul
  local.tee $4
  local.get $4
  f64.mul
  local.get $7
  f64.add
  f64.sqrt
  local.set $7
  local.get $1
  f64.abs
  f64.const 1e-12
  f64.lt
  local.get $2
  f64.abs
  f64.const 1e-12
  f64.lt
  i32.and
  if (result f64)
   f64.const 0
  else
   local.get $2
   local.get $1
   call $~lib/math/NativeMath.atan2
   f64.const 57.29577951308232
   f64.mul
   local.tee $1
   f64.const 360
   f64.add
   local.get $1
   local.get $1
   f64.const 0
   f64.lt
   select
  end
  local.tee $2
  local.get $4
  f64.abs
  f64.const 1e-12
  f64.lt
  local.get $5
  f64.abs
  f64.const 1e-12
  f64.lt
  i32.and
  if (result f64)
   f64.const 0
  else
   local.get $5
   local.get $4
   call $~lib/math/NativeMath.atan2
   f64.const 57.29577951308232
   f64.mul
   local.tee $1
   f64.const 360
   f64.add
   local.get $1
   local.get $1
   f64.const 0
   f64.lt
   select
  end
  local.tee $4
  f64.add
  local.set $1
  local.get $3
  local.get $0
  f64.sub
  local.get $0
  local.get $3
  f64.add
  f64.const 0.5
  f64.mul
  f64.const -50
  f64.add
  local.tee $0
  local.get $0
  f64.mul
  local.tee $0
  f64.const 0.015
  f64.mul
  local.get $0
  f64.const 20
  f64.add
  f64.sqrt
  f64.div
  f64.const 1
  f64.add
  f64.div
  local.tee $0
  local.get $0
  f64.mul
  local.get $7
  local.get $6
  f64.sub
  local.get $6
  local.get $7
  f64.add
  f64.const 0.5
  f64.mul
  local.tee $5
  f64.const 0.045
  f64.mul
  f64.const 1
  f64.add
  f64.div
  local.tee $8
  local.get $8
  f64.mul
  f64.add
  local.get $6
  local.get $7
  f64.mul
  local.tee $0
  f64.const 1e-12
  f64.gt
  if (result f64)
   local.get $0
   f64.sqrt
   f64.const 2
   f64.mul
   local.get $4
   local.get $2
   f64.sub
   local.tee $3
   f64.const -360
   f64.add
   local.get $3
   f64.const 360
   f64.add
   local.get $3
   local.get $3
   f64.const -180
   f64.lt
   select
   local.get $3
   f64.const 180
   f64.gt
   select
   f64.const 0.017453292519943295
   f64.mul
   f64.const 0.5
   f64.mul
   call $~lib/math/NativeMath.sin
   f64.mul
  else
   f64.const 0
  end
  local.get $0
  f64.const 1e-12
  f64.gt
  if
   local.get $2
   local.get $4
   f64.sub
   f64.abs
   f64.const 180
   f64.le
   if (result f64)
    local.get $1
    f64.const 0.5
    f64.mul
   else
    local.get $2
    local.get $4
    f64.add
    local.tee $0
    f64.const 360
    f64.add
    f64.const 0.5
    f64.mul
    local.get $0
    f64.const -360
    f64.add
    f64.const 0.5
    f64.mul
    local.get $0
    f64.const 360
    f64.lt
    select
   end
   local.set $1
  end
  local.get $5
  f64.const 0.015
  f64.mul
  f64.const 1
  local.get $1
  f64.const -30
  f64.add
  f64.const 0.017453292519943295
  f64.mul
  call $~lib/math/NativeMath.cos
  f64.const 0.17
  f64.mul
  f64.sub
  local.get $1
  local.get $1
  f64.add
  f64.const 0.017453292519943295
  f64.mul
  call $~lib/math/NativeMath.cos
  f64.const 0.24
  f64.mul
  f64.add
  local.get $1
  f64.const 3
  f64.mul
  f64.const 6
  f64.add
  f64.const 0.017453292519943295
  f64.mul
  call $~lib/math/NativeMath.cos
  f64.const 0.32
  f64.mul
  f64.add
  local.get $1
  f64.const 4
  f64.mul
  f64.const -63
  f64.add
  f64.const 0.017453292519943295
  f64.mul
  call $~lib/math/NativeMath.cos
  f64.const 0.2
  f64.mul
  f64.sub
  f64.mul
  f64.const 1
  f64.add
  f64.div
  local.tee $0
  local.get $0
  f64.mul
  f64.add
  local.get $1
  f64.const -275
  f64.add
  f64.const 25
  f64.div
  local.tee $1
  local.get $1
  f64.mul
  f64.neg
  call $~lib/math/NativeMath.exp
  f64.const 30
  f64.mul
  local.tee $1
  local.get $1
  f64.add
  f64.const 0.017453292519943295
  f64.mul
  call $~lib/math/NativeMath.sin
  f64.neg
  local.get $5
  f64.const 7
  call $~lib/math/NativeMath.pow
  local.tee $1
  local.get $1
  f64.const 6103515625
  f64.add
  f64.div
  f64.sqrt
  f64.const 2
  f64.mul
  f64.mul
  local.get $8
  f64.mul
  local.get $0
  f64.mul
  f64.add
  f64.sqrt
 )
 (func $~lib/rt/stub/__new (param $0 i32) (param $1 i32) (result i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  local.get $0
  i32.const 1073741804
  i32.gt_u
  if
   i32.const 1168
   i32.const 1232
   i32.const 86
   i32.const 30
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  i32.const 16
  i32.add
  local.tee $3
  i32.const 1073741820
  i32.gt_u
  if
   i32.const 1168
   i32.const 1232
   i32.const 33
   i32.const 29
   call $~lib/builtins/abort
   unreachable
  end
  global.get $~lib/rt/stub/offset
  i32.const 4
  i32.add
  local.tee $2
  local.get $3
  i32.const 19
  i32.add
  i32.const -16
  i32.and
  i32.const 4
  i32.sub
  local.tee $3
  i32.add
  local.tee $4
  memory.size
  local.tee $5
  i32.const 16
  i32.shl
  i32.const 15
  i32.add
  i32.const -16
  i32.and
  local.tee $6
  i32.gt_u
  if
   local.get $5
   local.get $4
   local.get $6
   i32.sub
   i32.const 65535
   i32.add
   i32.const -65536
   i32.and
   i32.const 16
   i32.shr_u
   local.tee $6
   local.get $5
   local.get $6
   i32.gt_s
   select
   memory.grow
   i32.const 0
   i32.lt_s
   if
    local.get $6
    memory.grow
    i32.const 0
    i32.lt_s
    if
     unreachable
    end
   end
  end
  global.get $~lib/rt/stub/offset
  local.get $4
  global.set $~lib/rt/stub/offset
  local.get $3
  i32.store
  local.get $2
  i32.const 4
  i32.sub
  local.tee $3
  i32.const 0
  i32.store offset=4
  local.get $3
  i32.const 0
  i32.store offset=8
  local.get $3
  local.get $1
  i32.store offset=12
  local.get $3
  local.get $0
  i32.store offset=16
  local.get $2
  i32.const 16
  i32.add
 )
 (func $~lib/math/NativeMath.sin (param $0 f64) (result f64)
  (local $1 f64)
  (local $2 f64)
  (local $3 i32)
  (local $4 i64)
  (local $5 i32)
  (local $6 f64)
  (local $7 f64)
  (local $8 f64)
  local.get $0
  i64.reinterpret_f64
  local.tee $4
  i64.const 32
  i64.shr_u
  i32.wrap_i64
  local.tee $5
  i32.const 31
  i32.shr_u
  local.set $3
  local.get $5
  i32.const 2147483647
  i32.and
  local.tee $5
  i32.const 1072243195
  i32.le_u
  if
   local.get $5
   i32.const 1045430272
   i32.lt_u
   if
    local.get $0
    return
   end
   local.get $0
   local.get $0
   local.get $0
   f64.mul
   local.tee $1
   local.get $0
   f64.mul
   local.get $1
   local.get $1
   local.get $1
   f64.const 2.7557313707070068e-06
   f64.mul
   f64.const -1.984126982985795e-04
   f64.add
   f64.mul
   f64.const 0.00833333333332249
   f64.add
   local.get $1
   local.get $1
   local.get $1
   f64.mul
   f64.mul
   local.get $1
   f64.const 1.58969099521155e-10
   f64.mul
   f64.const -2.5050760253406863e-08
   f64.add
   f64.mul
   f64.add
   f64.mul
   f64.const -0.16666666666666632
   f64.add
   f64.mul
   f64.add
   return
  end
  local.get $5
  i32.const 2146435072
  i32.ge_u
  if
   local.get $0
   local.get $0
   f64.sub
   return
  end
  block $~lib/math/rempio2|inlined.0 (result i32)
   local.get $4
   i64.const 32
   i64.shr_u
   i32.wrap_i64
   i32.const 2147483647
   i32.and
   local.tee $5
   i32.const 1094263291
   i32.lt_u
   if
    local.get $5
    i32.const 20
    i32.shr_u
    local.tee $3
    local.get $0
    local.get $0
    f64.const 0.6366197723675814
    f64.mul
    f64.nearest
    local.tee $6
    f64.const 1.5707963267341256
    f64.mul
    f64.sub
    local.tee $0
    local.get $6
    f64.const 6.077100506506192e-11
    f64.mul
    local.tee $2
    f64.sub
    local.tee $1
    i64.reinterpret_f64
    i64.const 32
    i64.shr_u
    i32.wrap_i64
    i32.const 20
    i32.shr_u
    i32.const 2047
    i32.and
    i32.sub
    i32.const 16
    i32.gt_u
    if
     local.get $6
     f64.const 2.0222662487959506e-21
     f64.mul
     local.get $0
     local.get $0
     local.get $6
     f64.const 6.077100506303966e-11
     f64.mul
     local.tee $1
     f64.sub
     local.tee $0
     f64.sub
     local.get $1
     f64.sub
     f64.sub
     local.set $2
     local.get $3
     local.get $0
     local.get $2
     f64.sub
     local.tee $1
     i64.reinterpret_f64
     i64.const 32
     i64.shr_u
     i32.wrap_i64
     i32.const 20
     i32.shr_u
     i32.const 2047
     i32.and
     i32.sub
     i32.const 49
     i32.gt_u
     if
      local.get $6
      f64.const 8.4784276603689e-32
      f64.mul
      local.get $0
      local.get $0
      local.get $6
      f64.const 2.0222662487111665e-21
      f64.mul
      local.tee $1
      f64.sub
      local.tee $0
      f64.sub
      local.get $1
      f64.sub
      f64.sub
      local.set $2
      local.get $0
      local.get $2
      f64.sub
      local.set $1
     end
    end
    local.get $1
    global.set $~lib/math/rempio2_y0
    local.get $0
    local.get $1
    f64.sub
    local.get $2
    f64.sub
    global.set $~lib/math/rempio2_y1
    local.get $6
    i32.trunc_sat_f64_s
    br $~lib/math/rempio2|inlined.0
   end
   i32.const 0
   local.get $4
   call $~lib/math/pio2_large_quot
   local.tee $5
   i32.sub
   local.get $5
   local.get $3
   select
  end
  local.set $3
  global.get $~lib/math/rempio2_y0
  local.set $0
  global.get $~lib/math/rempio2_y1
  local.set $2
  local.get $3
  i32.const 1
  i32.and
  if (result f64)
   local.get $0
   local.get $0
   f64.mul
   local.tee $1
   local.get $1
   f64.mul
   local.set $6
   f64.const 1
   local.get $1
   f64.const 0.5
   f64.mul
   local.tee $7
   f64.sub
   local.tee $8
   f64.const 1
   local.get $8
   f64.sub
   local.get $7
   f64.sub
   local.get $1
   local.get $1
   local.get $1
   local.get $1
   f64.const 2.480158728947673e-05
   f64.mul
   f64.const -0.001388888888887411
   f64.add
   f64.mul
   f64.const 0.0416666666666666
   f64.add
   f64.mul
   local.get $6
   local.get $6
   f64.mul
   local.get $1
   local.get $1
   f64.const -1.1359647557788195e-11
   f64.mul
   f64.const 2.087572321298175e-09
   f64.add
   f64.mul
   f64.const -2.7557314351390663e-07
   f64.add
   f64.mul
   f64.add
   f64.mul
   local.get $0
   local.get $2
   f64.mul
   f64.sub
   f64.add
   f64.add
  else
   local.get $0
   local.get $0
   f64.mul
   local.tee $1
   local.get $0
   f64.mul
   local.set $6
   local.get $0
   local.get $1
   local.get $2
   f64.const 0.5
   f64.mul
   local.get $6
   local.get $1
   local.get $1
   f64.const 2.7557313707070068e-06
   f64.mul
   f64.const -1.984126982985795e-04
   f64.add
   f64.mul
   f64.const 0.00833333333332249
   f64.add
   local.get $1
   local.get $1
   local.get $1
   f64.mul
   f64.mul
   local.get $1
   f64.const 1.58969099521155e-10
   f64.mul
   f64.const -2.5050760253406863e-08
   f64.add
   f64.mul
   f64.add
   f64.mul
   f64.sub
   f64.mul
   local.get $2
   f64.sub
   local.get $6
   f64.const -0.16666666666666632
   f64.mul
   f64.sub
   f64.sub
  end
  local.tee $0
  f64.neg
  local.get $0
  local.get $3
  i32.const 2
  i32.and
  select
 )
 (func $~lib/math/NativeMath.log (param $0 f64) (result f64)
  (local $1 i32)
  (local $2 i64)
  (local $3 f64)
  (local $4 i32)
  (local $5 i32)
  (local $6 f64)
  (local $7 f64)
  (local $8 f64)
  local.get $0
  i64.reinterpret_f64
  local.tee $2
  i64.const 32
  i64.shr_u
  i32.wrap_i64
  local.tee $1
  i32.const 31
  i32.shr_u
  local.tee $4
  local.get $1
  i32.const 1048576
  i32.lt_u
  i32.or
  if
   local.get $2
   i64.const 1
   i64.shl
   i64.eqz
   if
    f64.const -1
    local.get $0
    local.get $0
    f64.mul
    f64.div
    return
   end
   local.get $4
   if
    local.get $0
    local.get $0
    f64.sub
    f64.const 0
    f64.div
    return
   end
   i32.const -54
   local.set $5
   local.get $0
   f64.const 18014398509481984
   f64.mul
   i64.reinterpret_f64
   local.tee $2
   i64.const 32
   i64.shr_u
   i32.wrap_i64
   local.set $1
  else
   local.get $1
   i32.const 2146435072
   i32.ge_u
   if
    local.get $0
    return
   else
    local.get $2
    i64.const 32
    i64.shl
    i64.eqz
    local.get $1
    i32.const 1072693248
    i32.eq
    i32.and
    if
     f64.const 0
     return
    end
   end
  end
  local.get $2
  i64.const 4294967295
  i64.and
  local.get $1
  i32.const 614242
  i32.add
  local.tee $1
  i32.const 1048575
  i32.and
  i32.const 1072079006
  i32.add
  i64.extend_i32_u
  i64.const 32
  i64.shl
  i64.or
  f64.reinterpret_i64
  f64.const -1
  f64.add
  local.tee $7
  f64.const 0.5
  f64.mul
  local.get $7
  f64.mul
  local.set $0
  local.get $7
  local.get $7
  f64.const 2
  f64.add
  f64.div
  local.tee $8
  local.get $8
  f64.mul
  local.tee $3
  local.get $3
  f64.mul
  local.set $6
  local.get $8
  local.get $0
  local.get $3
  local.get $6
  local.get $6
  local.get $6
  f64.const 0.14798198605116586
  f64.mul
  f64.const 0.1818357216161805
  f64.add
  f64.mul
  f64.const 0.2857142874366239
  f64.add
  f64.mul
  f64.const 0.6666666666666735
  f64.add
  f64.mul
  local.get $6
  local.get $6
  local.get $6
  f64.const 0.15313837699209373
  f64.mul
  f64.const 0.22222198432149784
  f64.add
  f64.mul
  f64.const 0.3999999999940942
  f64.add
  f64.mul
  f64.add
  f64.add
  f64.mul
  local.get $5
  local.get $1
  i32.const 20
  i32.shr_s
  i32.const 1023
  i32.sub
  i32.add
  f64.convert_i32_s
  local.tee $3
  f64.const 1.9082149292705877e-10
  f64.mul
  f64.add
  local.get $0
  f64.sub
  local.get $7
  f64.add
  local.get $3
  f64.const 0.6931471803691238
  f64.mul
  f64.add
 )
 (func $assembly/nephelometry_dsp/hannWindow (param $0 i32)
  (local $1 f64)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 f64)
  global.get $~lib/memory/__stack_pointer
  i32.const 12
  i32.sub
  global.set $~lib/memory/__stack_pointer
  call $~stack_check
  global.get $~lib/memory/__stack_pointer
  i64.const 0
  i64.store
  global.get $~lib/memory/__stack_pointer
  i32.const 0
  i32.store offset=8
  i32.const 2
  i32.const 8192
  local.get $0
  local.get $0
  i32.const 8192
  i32.gt_s
  select
  local.get $0
  i32.const 2
  i32.lt_s
  select
  local.tee $4
  i32.const 1
  i32.sub
  f64.convert_i32_s
  local.set $1
  i32.const 0
  local.set $0
  loop $for-loop|0
   local.get $0
   local.get $4
   i32.lt_s
   if
    f64.const 1
    local.get $0
    f64.convert_i32_s
    f64.const 6.283185307179586
    f64.mul
    local.get $1
    f64.div
    call $~lib/math/NativeMath.cos
    f64.sub
    f64.const 0.5
    f64.mul
    local.set $6
    global.get $~lib/memory/__stack_pointer
    global.get $assembly/nephelometry_dsp/SCRATCH_A
    local.tee $2
    i32.store
    global.get $~lib/memory/__stack_pointer
    global.get $assembly/nephelometry_dsp/SCRATCH_A
    local.tee $3
    i32.store offset=4
    global.get $~lib/memory/__stack_pointer
    local.get $3
    i32.store offset=8
    local.get $0
    i32.const 3
    i32.shl
    local.tee $5
    local.get $3
    i32.load offset=4
    i32.add
    f64.load
    local.get $6
    f64.mul
    local.set $6
    global.get $~lib/memory/__stack_pointer
    local.get $2
    i32.store offset=8
    local.get $5
    local.get $2
    i32.load offset=4
    i32.add
    local.get $6
    f64.store
    local.get $0
    i32.const 1
    i32.add
    local.set $0
    br $for-loop|0
   end
  end
  global.get $~lib/memory/__stack_pointer
  i32.const 12
  i32.add
  global.set $~lib/memory/__stack_pointer
 )
 (func $assembly/nephelometry_dsp/fft (param $0 i32)
  (local $1 f64)
  (local $2 f64)
  (local $3 i32)
  (local $4 i32)
  (local $5 f64)
  (local $6 i32)
  (local $7 f64)
  (local $8 i32)
  (local $9 i32)
  (local $10 f64)
  (local $11 f64)
  (local $12 f64)
  (local $13 f64)
  (local $14 i32)
  (local $15 i32)
  global.get $~lib/memory/__stack_pointer
  i32.const 76
  i32.sub
  global.set $~lib/memory/__stack_pointer
  call $~stack_check
  global.get $~lib/memory/__stack_pointer
  i32.const 0
  i32.const 76
  memory.fill
  i32.const 2
  i32.const 8192
  local.get $0
  local.get $0
  i32.const 8192
  i32.gt_s
  select
  local.get $0
  i32.const 2
  i32.lt_s
  select
  local.tee $14
  local.get $14
  i32.const 1
  i32.sub
  i32.and
  if
   global.get $~lib/memory/__stack_pointer
   i32.const 76
   i32.add
   global.set $~lib/memory/__stack_pointer
   return
  end
  i32.const 0
  local.set $0
  loop $while-continue|0
   i32.const 1
   local.get $0
   i32.shl
   local.get $14
   i32.lt_s
   if
    local.get $0
    i32.const 1
    i32.add
    local.set $0
    br $while-continue|0
   end
  end
  local.get $0
  local.set $3
  i32.const 0
  local.set $0
  loop $for-loop|1
   local.get $0
   local.get $14
   i32.lt_s
   if
    local.get $0
    local.set $4
    i32.const 0
    local.set $15
    i32.const 0
    local.set $6
    loop $for-loop|2
     local.get $3
     local.get $6
     i32.gt_s
     if
      local.get $4
      i32.const 1
      i32.and
      local.get $15
      i32.const 1
      i32.shl
      i32.or
      local.set $15
      local.get $4
      i32.const 1
      i32.shr_s
      local.set $4
      local.get $6
      i32.const 1
      i32.add
      local.set $6
      br $for-loop|2
     end
    end
    local.get $0
    local.get $15
    i32.lt_s
    if
     global.get $~lib/memory/__stack_pointer
     global.get $assembly/nephelometry_dsp/SCRATCH_A
     local.tee $4
     i32.store
     global.get $~lib/memory/__stack_pointer
     local.get $4
     i32.store offset=4
     local.get $0
     i32.const 3
     i32.shl
     local.tee $9
     local.get $4
     i32.load offset=4
     i32.add
     f64.load
     local.set $2
     global.get $~lib/memory/__stack_pointer
     global.get $assembly/nephelometry_dsp/SCRATCH_A
     local.tee $6
     i32.store offset=8
     global.get $~lib/memory/__stack_pointer
     global.get $assembly/nephelometry_dsp/SCRATCH_A
     local.tee $4
     i32.store offset=12
     global.get $~lib/memory/__stack_pointer
     local.get $4
     i32.store offset=4
     local.get $15
     i32.const 3
     i32.shl
     local.tee $8
     local.get $4
     i32.load offset=4
     i32.add
     f64.load
     local.set $1
     global.get $~lib/memory/__stack_pointer
     local.get $6
     i32.store offset=4
     local.get $9
     local.get $6
     i32.load offset=4
     i32.add
     local.get $1
     f64.store
     global.get $~lib/memory/__stack_pointer
     global.get $assembly/nephelometry_dsp/SCRATCH_A
     local.tee $4
     i32.store offset=16
     global.get $~lib/memory/__stack_pointer
     local.get $4
     i32.store offset=4
     local.get $8
     local.get $4
     i32.load offset=4
     i32.add
     local.get $2
     f64.store
     global.get $~lib/memory/__stack_pointer
     global.get $assembly/nephelometry_dsp/SCRATCH_B
     local.tee $4
     i32.store offset=20
     global.get $~lib/memory/__stack_pointer
     local.get $4
     i32.store offset=4
     local.get $9
     local.get $4
     i32.load offset=4
     i32.add
     f64.load
     local.set $2
     global.get $~lib/memory/__stack_pointer
     global.get $assembly/nephelometry_dsp/SCRATCH_B
     local.tee $6
     i32.store offset=24
     global.get $~lib/memory/__stack_pointer
     global.get $assembly/nephelometry_dsp/SCRATCH_B
     local.tee $4
     i32.store offset=28
     global.get $~lib/memory/__stack_pointer
     local.get $4
     i32.store offset=4
     local.get $8
     local.get $4
     i32.load offset=4
     i32.add
     f64.load
     local.set $1
     global.get $~lib/memory/__stack_pointer
     local.get $6
     i32.store offset=4
     local.get $9
     local.get $6
     i32.load offset=4
     i32.add
     local.get $1
     f64.store
     global.get $~lib/memory/__stack_pointer
     global.get $assembly/nephelometry_dsp/SCRATCH_B
     local.tee $4
     i32.store offset=32
     global.get $~lib/memory/__stack_pointer
     local.get $4
     i32.store offset=4
     local.get $8
     local.get $4
     i32.load offset=4
     i32.add
     local.get $2
     f64.store
    end
    local.get $0
    i32.const 1
    i32.add
    local.set $0
    br $for-loop|1
   end
  end
  i32.const 2
  local.set $15
  loop $while-continue|3
   local.get $14
   local.get $15
   i32.ge_s
   if
    f64.const -6.283185307179586
    local.get $15
    f64.convert_i32_s
    f64.div
    local.tee $1
    call $~lib/math/NativeMath.cos
    local.set $12
    local.get $1
    call $~lib/math/NativeMath.sin
    local.set $11
    i32.const 0
    local.set $0
    loop $while-continue|4
     local.get $0
     local.get $14
     i32.lt_s
     if
      f64.const 1
      local.set $2
      f64.const 0
      local.set $13
      local.get $15
      i32.const 1
      i32.shr_s
      local.set $8
      i32.const 0
      local.set $4
      loop $for-loop|5
       local.get $4
       local.get $8
       i32.lt_s
       if
        global.get $~lib/memory/__stack_pointer
        global.get $assembly/nephelometry_dsp/SCRATCH_A
        local.tee $3
        i32.store offset=36
        global.get $~lib/memory/__stack_pointer
        local.get $3
        i32.store offset=4
        local.get $0
        local.get $4
        i32.add
        local.tee $6
        i32.const 3
        i32.shl
        local.tee $9
        local.get $3
        i32.load offset=4
        i32.add
        f64.load
        local.set $10
        global.get $~lib/memory/__stack_pointer
        global.get $assembly/nephelometry_dsp/SCRATCH_B
        local.tee $3
        i32.store offset=40
        global.get $~lib/memory/__stack_pointer
        local.get $3
        i32.store offset=4
        local.get $9
        local.get $3
        i32.load offset=4
        i32.add
        f64.load
        local.set $7
        global.get $~lib/memory/__stack_pointer
        global.get $assembly/nephelometry_dsp/SCRATCH_A
        local.tee $3
        i32.store offset=44
        global.get $~lib/memory/__stack_pointer
        local.get $3
        i32.store offset=4
        local.get $6
        local.get $8
        i32.add
        i32.const 3
        i32.shl
        local.tee $6
        local.get $3
        i32.load offset=4
        i32.add
        f64.load
        local.get $2
        f64.mul
        global.get $~lib/memory/__stack_pointer
        global.get $assembly/nephelometry_dsp/SCRATCH_B
        local.tee $3
        i32.store offset=48
        global.get $~lib/memory/__stack_pointer
        local.get $3
        i32.store offset=4
        local.get $6
        local.get $3
        i32.load offset=4
        i32.add
        f64.load
        local.get $13
        f64.mul
        f64.sub
        local.set $5
        global.get $~lib/memory/__stack_pointer
        global.get $assembly/nephelometry_dsp/SCRATCH_A
        local.tee $3
        i32.store offset=52
        global.get $~lib/memory/__stack_pointer
        local.get $3
        i32.store offset=4
        local.get $6
        local.get $3
        i32.load offset=4
        i32.add
        f64.load
        local.get $13
        f64.mul
        global.get $~lib/memory/__stack_pointer
        global.get $assembly/nephelometry_dsp/SCRATCH_B
        local.tee $3
        i32.store offset=56
        global.get $~lib/memory/__stack_pointer
        local.get $3
        i32.store offset=4
        local.get $6
        local.get $3
        i32.load offset=4
        i32.add
        f64.load
        local.get $2
        f64.mul
        f64.add
        local.set $1
        global.get $~lib/memory/__stack_pointer
        global.get $assembly/nephelometry_dsp/SCRATCH_A
        local.tee $3
        i32.store offset=60
        global.get $~lib/memory/__stack_pointer
        local.get $3
        i32.store offset=4
        local.get $9
        local.get $3
        i32.load offset=4
        i32.add
        local.get $10
        local.get $5
        f64.add
        f64.store
        global.get $~lib/memory/__stack_pointer
        global.get $assembly/nephelometry_dsp/SCRATCH_B
        local.tee $3
        i32.store offset=64
        global.get $~lib/memory/__stack_pointer
        local.get $3
        i32.store offset=4
        local.get $9
        local.get $3
        i32.load offset=4
        i32.add
        local.get $7
        local.get $1
        f64.add
        f64.store
        global.get $~lib/memory/__stack_pointer
        global.get $assembly/nephelometry_dsp/SCRATCH_A
        local.tee $3
        i32.store offset=68
        global.get $~lib/memory/__stack_pointer
        local.get $3
        i32.store offset=4
        local.get $6
        local.get $3
        i32.load offset=4
        i32.add
        local.get $10
        local.get $5
        f64.sub
        f64.store
        global.get $~lib/memory/__stack_pointer
        global.get $assembly/nephelometry_dsp/SCRATCH_B
        local.tee $3
        i32.store offset=72
        global.get $~lib/memory/__stack_pointer
        local.get $3
        i32.store offset=4
        local.get $6
        local.get $3
        i32.load offset=4
        i32.add
        local.get $7
        local.get $1
        f64.sub
        f64.store
        local.get $2
        local.get $12
        f64.mul
        local.get $13
        local.get $11
        f64.mul
        f64.sub
        local.get $2
        local.get $11
        f64.mul
        local.get $13
        local.get $12
        f64.mul
        f64.add
        local.set $13
        local.set $2
        local.get $4
        i32.const 1
        i32.add
        local.set $4
        br $for-loop|5
       end
      end
      local.get $0
      local.get $15
      i32.add
      local.set $0
      br $while-continue|4
     end
    end
    local.get $15
    i32.const 1
    i32.shl
    local.set $15
    br $while-continue|3
   end
  end
  global.get $~lib/memory/__stack_pointer
  i32.const 76
  i32.add
  global.set $~lib/memory/__stack_pointer
 )
 (func $~lib/typedarray/Float64Array#constructor (result i32)
  (local $0 i32)
  (local $1 i32)
  (local $2 i32)
  global.get $~lib/memory/__stack_pointer
  i32.const 8
  i32.sub
  global.set $~lib/memory/__stack_pointer
  call $~stack_check
  global.get $~lib/memory/__stack_pointer
  i64.const 0
  i64.store
  global.get $~lib/memory/__stack_pointer
  i32.const 12
  i32.const 4
  call $~lib/rt/stub/__new
  local.tee $0
  i32.store
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store offset=4
  global.get $~lib/memory/__stack_pointer
  global.get $~lib/memory/__stack_pointer
  i32.const 16
  i32.sub
  global.set $~lib/memory/__stack_pointer
  call $~stack_check
  global.get $~lib/memory/__stack_pointer
  i64.const 0
  i64.store
  global.get $~lib/memory/__stack_pointer
  i64.const 0
  i64.store offset=8
  local.get $0
  i32.eqz
  if
   global.get $~lib/memory/__stack_pointer
   i32.const 12
   i32.const 3
   call $~lib/rt/stub/__new
   local.tee $0
   i32.store
  end
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store offset=4
  local.get $0
  i32.const 0
  i32.store
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store offset=4
  local.get $0
  i32.const 0
  i32.store offset=4
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store offset=4
  local.get $0
  i32.const 0
  i32.store offset=8
  global.get $~lib/memory/__stack_pointer
  i32.const 65536
  i32.const 1
  call $~lib/rt/stub/__new
  local.tee $1
  i32.store offset=8
  local.get $1
  i32.const 0
  i32.const 65536
  memory.fill
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store offset=4
  global.get $~lib/memory/__stack_pointer
  local.get $1
  i32.store offset=12
  local.get $0
  local.get $1
  i32.store
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store offset=4
  local.get $0
  local.get $1
  i32.store offset=4
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store offset=4
  local.get $0
  i32.const 65536
  i32.store offset=8
  global.get $~lib/memory/__stack_pointer
  i32.const 16
  i32.add
  global.set $~lib/memory/__stack_pointer
  local.get $0
  i32.store
  global.get $~lib/memory/__stack_pointer
  i32.const 8
  i32.add
  global.set $~lib/memory/__stack_pointer
  local.get $0
 )
 (func $~lib/math/pio2_large_quot (param $0 i64) (result i32)
  (local $1 i64)
  (local $2 i64)
  (local $3 i64)
  (local $4 i32)
  (local $5 f64)
  (local $6 i64)
  (local $7 i64)
  (local $8 i64)
  (local $9 i64)
  (local $10 i64)
  (local $11 i64)
  (local $12 i64)
  local.get $0
  i64.const 9223372036854775807
  i64.and
  i64.const 52
  i64.shr_u
  i64.const 1045
  i64.sub
  local.tee $1
  i64.const 63
  i64.and
  local.set $6
  local.get $1
  i64.const 6
  i64.shr_s
  i32.wrap_i64
  i32.const 3
  i32.shl
  i32.const 1280
  i32.add
  local.tee $4
  i64.load
  local.set $3
  local.get $4
  i64.load offset=8
  local.set $2
  local.get $4
  i64.load offset=16
  local.set $1
  local.get $6
  i64.const 0
  i64.ne
  if
   local.get $3
   local.get $6
   i64.shl
   local.get $2
   i64.const 64
   local.get $6
   i64.sub
   local.tee $7
   i64.shr_u
   i64.or
   local.set $3
   local.get $2
   local.get $6
   i64.shl
   local.get $1
   local.get $7
   i64.shr_u
   i64.or
   local.set $2
   local.get $1
   local.get $6
   i64.shl
   local.get $4
   i64.load offset=24
   local.get $7
   i64.shr_u
   i64.or
   local.set $1
  end
  local.get $0
  i64.const 4503599627370495
  i64.and
  i64.const 4503599627370496
  i64.or
  local.tee $6
  i64.const 4294967295
  i64.and
  local.set $7
  local.get $2
  i64.const 4294967295
  i64.and
  local.tee $8
  local.get $6
  i64.const 32
  i64.shr_u
  local.tee $9
  i64.mul
  local.get $2
  i64.const 32
  i64.shr_u
  local.tee $2
  local.get $7
  i64.mul
  local.get $7
  local.get $8
  i64.mul
  local.tee $7
  i64.const 32
  i64.shr_u
  i64.add
  local.tee $8
  i64.const 4294967295
  i64.and
  i64.add
  local.set $10
  local.get $2
  local.get $9
  i64.mul
  local.get $8
  i64.const 32
  i64.shr_u
  i64.add
  local.get $10
  i64.const 32
  i64.shr_u
  i64.add
  global.set $~lib/math/res128_hi
  local.get $9
  local.get $1
  i64.const 32
  i64.shr_u
  i64.mul
  local.tee $1
  local.get $7
  i64.const 4294967295
  i64.and
  local.get $10
  i64.const 32
  i64.shl
  i64.add
  i64.add
  local.tee $2
  local.get $1
  i64.lt_u
  i64.extend_i32_u
  global.get $~lib/math/res128_hi
  local.get $3
  local.get $6
  i64.mul
  i64.add
  i64.add
  local.tee $3
  i64.const 2
  i64.shl
  local.get $2
  i64.const 62
  i64.shr_u
  i64.or
  local.tee $6
  i64.const 63
  i64.shr_s
  local.tee $7
  local.get $2
  i64.const 2
  i64.shl
  i64.xor
  local.set $2
  local.get $6
  local.get $7
  i64.const 1
  i64.shr_s
  i64.xor
  local.tee $1
  i64.clz
  local.set $8
  local.get $1
  local.get $8
  i64.shl
  local.get $2
  i64.const 64
  local.get $8
  i64.sub
  i64.shr_u
  i64.or
  local.tee $9
  i64.const 4294967295
  i64.and
  local.set $1
  local.get $9
  i64.const 32
  i64.shr_u
  local.tee $10
  i64.const 560513588
  i64.mul
  local.get $1
  i64.const 3373259426
  i64.mul
  local.get $1
  i64.const 560513588
  i64.mul
  local.tee $11
  i64.const 32
  i64.shr_u
  i64.add
  local.tee $12
  i64.const 4294967295
  i64.and
  i64.add
  local.set $1
  local.get $10
  i64.const 3373259426
  i64.mul
  local.get $12
  i64.const 32
  i64.shr_u
  i64.add
  local.get $1
  i64.const 32
  i64.shr_u
  i64.add
  global.set $~lib/math/res128_hi
  local.get $9
  f64.convert_i64_u
  f64.const 3.753184150245214e-04
  f64.mul
  local.get $2
  local.get $8
  i64.shl
  f64.convert_i64_u
  f64.const 3.834951969714103e-04
  f64.mul
  f64.add
  i64.trunc_sat_f64_u
  local.tee $2
  local.get $11
  i64.const 4294967295
  i64.and
  local.get $1
  i64.const 32
  i64.shl
  i64.add
  local.tee $1
  i64.gt_u
  i64.extend_i32_u
  global.get $~lib/math/res128_hi
  local.tee $9
  i64.const 11
  i64.shr_u
  i64.add
  f64.convert_i64_u
  global.set $~lib/math/rempio2_y0
  local.get $9
  i64.const 53
  i64.shl
  local.get $1
  i64.const 11
  i64.shr_u
  i64.or
  local.get $2
  i64.add
  f64.convert_i64_u
  f64.const 5.421010862427522e-20
  f64.mul
  global.set $~lib/math/rempio2_y1
  global.get $~lib/math/rempio2_y0
  i64.const 4372995238176751616
  local.get $8
  i64.const 52
  i64.shl
  i64.sub
  local.get $0
  local.get $6
  i64.xor
  i64.const -9223372036854775808
  i64.and
  i64.or
  f64.reinterpret_i64
  local.tee $5
  f64.mul
  global.set $~lib/math/rempio2_y0
  global.get $~lib/math/rempio2_y1
  local.get $5
  f64.mul
  global.set $~lib/math/rempio2_y1
  local.get $3
  i64.const 62
  i64.shr_s
  local.get $7
  i64.sub
  i32.wrap_i64
 )
 (func $~lib/math/NativeMath.scalbn (param $0 f64) (param $1 i32) (result f64)
  local.get $1
  i32.const 1023
  i32.gt_s
  if (result f64)
   local.get $0
   f64.const 8988465674311579538646525e283
   f64.mul
   local.set $0
   local.get $1
   i32.const 1023
   i32.sub
   local.tee $1
   i32.const 1023
   i32.gt_s
   if (result f64)
    i32.const 1023
    local.get $1
    i32.const 1023
    i32.sub
    local.tee $1
    local.get $1
    i32.const 1023
    i32.ge_s
    select
    local.set $1
    local.get $0
    f64.const 8988465674311579538646525e283
    f64.mul
   else
    local.get $0
   end
  else
   local.get $1
   i32.const -1022
   i32.lt_s
   if (result f64)
    local.get $0
    f64.const 2.004168360008973e-292
    f64.mul
    local.set $0
    local.get $1
    i32.const 969
    i32.add
    local.tee $1
    i32.const -1022
    i32.lt_s
    if (result f64)
     i32.const -1022
     local.get $1
     i32.const 969
     i32.add
     local.tee $1
     local.get $1
     i32.const -1022
     i32.le_s
     select
     local.set $1
     local.get $0
     f64.const 2.004168360008973e-292
     f64.mul
    else
     local.get $0
    end
   else
    local.get $0
   end
  end
  local.get $1
  i64.extend_i32_s
  i64.const 1023
  i64.add
  i64.const 52
  i64.shl
  f64.reinterpret_i64
  f64.mul
 )
 (func $~lib/math/NativeMath.exp (param $0 f64) (result f64)
  (local $1 f64)
  (local $2 i32)
  (local $3 f64)
  (local $4 i32)
  (local $5 f64)
  (local $6 f64)
  (local $7 i32)
  local.get $0
  i64.reinterpret_f64
  i64.const 32
  i64.shr_u
  i32.wrap_i64
  local.tee $7
  i32.const 31
  i32.shr_u
  local.set $4
  local.get $7
  i32.const 2147483647
  i32.and
  local.tee $7
  i32.const 1082532651
  i32.ge_u
  if
   local.get $0
   local.get $0
   f64.ne
   if
    local.get $0
    return
   end
   local.get $0
   f64.const 709.782712893384
   f64.gt
   if
    local.get $0
    f64.const 8988465674311579538646525e283
    f64.mul
    return
   end
   local.get $0
   f64.const -745.1332191019411
   f64.lt
   if
    f64.const 0
    return
   end
  end
  local.get $7
  i32.const 1071001154
  i32.gt_u
  if
   local.get $0
   local.get $0
   f64.const 1.4426950408889634
   f64.mul
   f64.const 0.5
   local.get $0
   f64.copysign
   f64.add
   i32.trunc_sat_f64_s
   i32.const 1
   local.get $4
   i32.const 1
   i32.shl
   i32.sub
   local.get $7
   i32.const 1072734898
   i32.ge_u
   select
   local.tee $2
   f64.convert_i32_s
   f64.const 0.6931471803691238
   f64.mul
   f64.sub
   local.tee $1
   local.get $2
   f64.convert_i32_s
   f64.const 1.9082149292705877e-10
   f64.mul
   local.tee $5
   f64.sub
   local.set $0
  else
   local.get $7
   i32.const 1043333120
   i32.gt_u
   if (result f64)
    local.get $0
   else
    local.get $0
    f64.const 1
    f64.add
    return
   end
   local.set $1
  end
  local.get $0
  local.get $0
  f64.mul
  local.tee $6
  local.get $6
  f64.mul
  local.set $3
  local.get $0
  local.get $0
  local.get $6
  f64.const 0.16666666666666602
  f64.mul
  local.get $3
  local.get $6
  f64.const 6.613756321437934e-05
  f64.mul
  f64.const -2.7777777777015593e-03
  f64.add
  local.get $3
  local.get $6
  f64.const 4.1381367970572385e-08
  f64.mul
  f64.const -1.6533902205465252e-06
  f64.add
  f64.mul
  f64.add
  f64.mul
  f64.add
  f64.sub
  local.tee $0
  f64.mul
  f64.const 2
  local.get $0
  f64.sub
  f64.div
  local.get $5
  f64.sub
  local.get $1
  f64.add
  f64.const 1
  f64.add
  local.set $0
  local.get $2
  if (result f64)
   local.get $0
   local.get $2
   call $~lib/math/NativeMath.scalbn
  else
   local.get $0
  end
 )
 (func $~lib/math/NativeMath.atan2 (param $0 f64) (param $1 f64) (result f64)
  (local $2 i32)
  (local $3 i64)
  (local $4 i32)
  (local $5 i64)
  (local $6 i32)
  (local $7 i32)
  local.get $0
  local.get $0
  f64.ne
  local.get $1
  local.get $1
  f64.ne
  i32.or
  if
   local.get $1
   local.get $0
   f64.add
   return
  end
  local.get $0
  i64.reinterpret_f64
  local.tee $3
  i64.const 32
  i64.shr_u
  i32.wrap_i64
  local.set $7
  local.get $1
  i64.reinterpret_f64
  local.tee $5
  i64.const 32
  i64.shr_u
  i32.wrap_i64
  local.tee $6
  i32.const 1072693248
  i32.sub
  local.get $5
  i32.wrap_i64
  local.tee $4
  i32.or
  i32.eqz
  if
   local.get $0
   call $~lib/math/NativeMath.atan
   return
  end
  local.get $6
  i32.const 30
  i32.shr_u
  i32.const 2
  i32.and
  local.get $7
  i32.const 31
  i32.shr_u
  i32.or
  local.set $2
  local.get $7
  i32.const 2147483647
  i32.and
  local.tee $7
  local.get $3
  i32.wrap_i64
  i32.or
  i32.eqz
  if
   block $break|0
    block $case3|0
     block $case2|0
      local.get $2
      i32.eqz
      local.get $2
      i32.const 1
      i32.eq
      i32.or
      i32.eqz
      if
       local.get $2
       i32.const 2
       i32.eq
       br_if $case2|0
       local.get $2
       i32.const 3
       i32.eq
       br_if $case3|0
       br $break|0
      end
      local.get $0
      return
     end
     f64.const 3.141592653589793
     return
    end
    f64.const -3.141592653589793
    return
   end
  end
  block $folding-inner0
   local.get $6
   i32.const 2147483647
   i32.and
   local.tee $6
   local.get $4
   i32.or
   i32.eqz
   br_if $folding-inner0
   local.get $6
   i32.const 2146435072
   i32.eq
   if
    local.get $7
    i32.const 2146435072
    i32.eq
    if (result f64)
     f64.const 2.356194490192345
     f64.const 0.7853981633974483
     local.get $2
     i32.const 2
     i32.and
     select
     local.tee $0
     f64.neg
     local.get $0
     local.get $2
     i32.const 1
     i32.and
     select
    else
     f64.const 3.141592653589793
     f64.const 0
     local.get $2
     i32.const 2
     i32.and
     select
     local.tee $0
     f64.neg
     local.get $0
     local.get $2
     i32.const 1
     i32.and
     select
    end
    return
   end
   local.get $7
   i32.const 2146435072
   i32.eq
   local.get $6
   i32.const 67108864
   i32.add
   local.get $7
   i32.lt_u
   i32.or
   br_if $folding-inner0
   local.get $7
   i32.const 67108864
   i32.add
   local.get $6
   i32.lt_u
   i32.const 0
   local.get $2
   i32.const 2
   i32.and
   select
   if (result f64)
    f64.const 0
   else
    local.get $0
    local.get $1
    f64.div
    f64.abs
    call $~lib/math/NativeMath.atan
   end
   local.set $0
   block $break|1
    block $case3|1
     block $case2|1
      block $case1|1
       block $case0|1
        local.get $2
        br_table $case0|1 $case1|1 $case2|1 $case3|1 $break|1
       end
       local.get $0
       return
      end
      local.get $0
      f64.neg
      return
     end
     f64.const 3.141592653589793
     local.get $0
     f64.const -1.2246467991473532e-16
     f64.add
     f64.sub
     return
    end
    local.get $0
    f64.const -1.2246467991473532e-16
    f64.add
    f64.const -3.141592653589793
    f64.add
    return
   end
   unreachable
  end
  f64.const -1.5707963267948966
  f64.const 1.5707963267948966
  local.get $2
  i32.const 1
  i32.and
  select
 )
 (func $~lib/math/NativeMath.atan (param $0 f64) (result f64)
  (local $1 f64)
  (local $2 i32)
  (local $3 i32)
  (local $4 f64)
  (local $5 f64)
  local.get $0
  local.set $1
  local.get $0
  i64.reinterpret_f64
  i64.const 32
  i64.shr_u
  i32.wrap_i64
  i32.const 2147483647
  i32.and
  local.tee $2
  i32.const 1141899264
  i32.ge_u
  if
   local.get $0
   local.get $0
   f64.ne
   if
    local.get $0
    return
   end
   f64.const 1.5707963267948966
   local.get $1
   f64.copysign
   return
  end
  local.get $2
  i32.const 1071382528
  i32.lt_u
  if
   local.get $2
   i32.const 1044381696
   i32.lt_u
   if
    local.get $0
    return
   end
   i32.const -1
   local.set $3
  else
   local.get $0
   f64.abs
   local.set $0
   local.get $2
   i32.const 1072889856
   i32.lt_u
   if (result f64)
    local.get $2
    i32.const 1072037888
    i32.lt_u
    if (result f64)
     local.get $0
     local.get $0
     f64.add
     f64.const -1
     f64.add
     local.get $0
     f64.const 2
     f64.add
     f64.div
    else
     i32.const 1
     local.set $3
     local.get $0
     f64.const -1
     f64.add
     local.get $0
     f64.const 1
     f64.add
     f64.div
    end
   else
    local.get $2
    i32.const 1073971200
    i32.lt_u
    if (result f64)
     i32.const 2
     local.set $3
     local.get $0
     f64.const -1.5
     f64.add
     local.get $0
     f64.const 1.5
     f64.mul
     f64.const 1
     f64.add
     f64.div
    else
     i32.const 3
     local.set $3
     f64.const -1
     local.get $0
     f64.div
    end
   end
   local.set $0
  end
  local.get $0
  local.get $0
  f64.mul
  local.tee $5
  local.get $5
  f64.mul
  local.set $4
  local.get $0
  local.get $5
  local.get $4
  local.get $4
  local.get $4
  local.get $4
  local.get $4
  f64.const 0.016285820115365782
  f64.mul
  f64.const 0.049768779946159324
  f64.add
  f64.mul
  f64.const 0.06661073137387531
  f64.add
  f64.mul
  f64.const 0.09090887133436507
  f64.add
  f64.mul
  f64.const 0.14285714272503466
  f64.add
  f64.mul
  f64.const 0.3333333333333293
  f64.add
  f64.mul
  local.get $4
  local.get $4
  local.get $4
  local.get $4
  local.get $4
  f64.const -0.036531572744216916
  f64.mul
  f64.const -0.058335701337905735
  f64.add
  f64.mul
  f64.const -0.0769187620504483
  f64.add
  f64.mul
  f64.const -0.11111110405462356
  f64.add
  f64.mul
  f64.const -0.19999999999876483
  f64.add
  f64.mul
  f64.add
  f64.mul
  local.set $4
  local.get $3
  i32.const 0
  i32.lt_s
  if
   local.get $0
   local.get $4
   f64.sub
   return
  end
  block $break|0 (result f64)
   block $case3|0
    block $case2|0
     block $case1|0
      block $case0|0
       block $tablify|0
        local.get $3
        br_table $case0|0 $case1|0 $case2|0 $case3|0 $tablify|0
       end
       unreachable
      end
      f64.const 0.4636476090008061
      local.get $4
      f64.const -2.2698777452961687e-17
      f64.add
      local.get $0
      f64.sub
      f64.sub
      br $break|0
     end
     f64.const 0.7853981633974483
     local.get $4
     f64.const -3.061616997868383e-17
     f64.add
     local.get $0
     f64.sub
     f64.sub
     br $break|0
    end
    f64.const 0.982793723247329
    local.get $4
    f64.const -1.3903311031230998e-17
    f64.add
    local.get $0
    f64.sub
    f64.sub
    br $break|0
   end
   f64.const 1.5707963267948966
   local.get $4
   f64.const -6.123233995736766e-17
   f64.add
   local.get $0
   f64.sub
   f64.sub
  end
  local.get $1
  f64.copysign
 )
 (func $~start
  i32.const 17868
  global.set $~lib/rt/stub/offset
  call $~lib/typedarray/Float64Array#constructor
  global.set $assembly/nephelometry_dsp/SCRATCH_A
  call $~lib/typedarray/Float64Array#constructor
  global.set $assembly/nephelometry_dsp/SCRATCH_B
 )
 (func $assembly/nephelometry_dsp/whiteBalanceGains (param $0 f64) (param $1 f64) (param $2 f64)
  (local $3 i32)
  (local $4 f64)
  global.get $~lib/memory/__stack_pointer
  i32.const 16
  i32.sub
  global.set $~lib/memory/__stack_pointer
  call $~stack_check
  global.get $~lib/memory/__stack_pointer
  i64.const 0
  i64.store
  global.get $~lib/memory/__stack_pointer
  i64.const 0
  i64.store offset=8
  global.get $~lib/memory/__stack_pointer
  global.get $assembly/nephelometry_dsp/SCRATCH_B
  local.tee $3
  i32.store
  global.get $~lib/memory/__stack_pointer
  local.get $3
  i32.store offset=4
  local.get $3
  i32.load offset=4
  local.get $0
  f64.const 1
  f64.max
  local.tee $4
  local.get $1
  f64.const 1
  f64.max
  local.tee $1
  f64.add
  local.get $2
  f64.const 1
  f64.max
  local.tee $2
  f64.add
  f64.const 3
  f64.div
  local.tee $0
  local.get $4
  f64.div
  f64.store
  global.get $~lib/memory/__stack_pointer
  global.get $assembly/nephelometry_dsp/SCRATCH_B
  local.tee $3
  i32.store offset=8
  global.get $~lib/memory/__stack_pointer
  local.get $3
  i32.store offset=4
  local.get $3
  i32.load offset=4
  local.get $0
  local.get $1
  f64.div
  f64.store offset=8
  global.get $~lib/memory/__stack_pointer
  global.get $assembly/nephelometry_dsp/SCRATCH_B
  local.tee $3
  i32.store offset=12
  global.get $~lib/memory/__stack_pointer
  local.get $3
  i32.store offset=4
  local.get $3
  i32.load offset=4
  local.get $0
  local.get $2
  f64.div
  f64.store offset=16
  global.get $~lib/memory/__stack_pointer
  i32.const 16
  i32.add
  global.set $~lib/memory/__stack_pointer
 )
 (func $assembly/nephelometry_dsp/tssFromNtu (param $0 f64) (param $1 f64) (result f64)
  f64.const 0
  f64.const 500
  local.get $0
  local.get $1
  f64.const 2.1
  local.get $1
  f64.const 0.05
  f64.gt
  select
  f64.mul
  local.tee $0
  local.get $0
  f64.const 500
  f64.gt
  select
  local.get $0
  f64.const 0
  f64.lt
  select
 )
 (func $assembly/nephelometry_dsp/tdsFromEc (param $0 f64) (param $1 f64) (result f64)
  f64.const 0
  f64.const 5e3
  local.get $0
  local.get $1
  f64.const -25
  f64.add
  f64.const 0.02
  f64.mul
  f64.const 1
  f64.add
  f64.div
  f64.const 0.55
  f64.mul
  local.tee $0
  local.get $0
  f64.const 5e3
  f64.gt
  select
  local.get $0
  f64.const 0
  f64.lt
  select
 )
 (func $assembly/nephelometry_dsp/speedOfSound (param $0 f64) (result f64)
  local.get $0
  f64.const 273.15
  f64.div
  f64.const 1
  f64.add
  f64.sqrt
  f64.const 331.3
  f64.mul
 )
 (func $assembly/nephelometry_dsp/spectrumDb (param $0 i32) (result i32)
  (local $1 f64)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 f64)
  global.get $~lib/memory/__stack_pointer
  i32.const 24
  i32.sub
  global.set $~lib/memory/__stack_pointer
  call $~stack_check
  global.get $~lib/memory/__stack_pointer
  i32.const 0
  i32.const 24
  memory.fill
  i32.const 2
  i32.const 8192
  local.get $0
  local.get $0
  i32.const 8192
  i32.gt_s
  select
  local.get $0
  i32.const 2
  i32.lt_s
  select
  local.tee $5
  i32.const 1
  i32.shr_s
  local.set $3
  i32.const 0
  local.set $0
  loop $for-loop|0
   local.get $0
   local.get $3
   i32.lt_s
   if
    global.get $~lib/memory/__stack_pointer
    global.get $assembly/nephelometry_dsp/SCRATCH_A
    local.tee $6
    i32.store
    global.get $~lib/memory/__stack_pointer
    local.get $6
    i32.store offset=4
    local.get $0
    i32.const 3
    i32.shl
    local.tee $4
    local.get $6
    i32.load offset=4
    i32.add
    f64.load
    local.set $7
    global.get $~lib/memory/__stack_pointer
    global.get $assembly/nephelometry_dsp/SCRATCH_B
    local.tee $6
    i32.store offset=8
    global.get $~lib/memory/__stack_pointer
    local.get $6
    i32.store offset=4
    local.get $7
    local.get $7
    f64.mul
    local.get $4
    local.get $6
    i32.load offset=4
    i32.add
    f64.load
    local.tee $7
    local.get $7
    f64.mul
    f64.add
    f64.sqrt
    local.get $5
    f64.convert_i32_s
    f64.div
    local.set $7
    global.get $~lib/memory/__stack_pointer
    global.get $assembly/nephelometry_dsp/SCRATCH_B
    local.tee $6
    i32.store offset=12
    global.get $~lib/memory/__stack_pointer
    local.get $6
    i32.store offset=4
    local.get $4
    local.get $6
    i32.load offset=4
    i32.add
    local.get $7
    f64.store
    local.get $1
    local.get $7
    f64.lt
    if
     local.get $0
     local.set $2
     local.get $7
     local.set $1
    end
    local.get $0
    i32.const 1
    i32.add
    local.set $0
    br $for-loop|0
   end
  end
  local.get $1
  f64.const 1e-12
  local.get $1
  f64.const 1e-12
  f64.gt
  select
  local.set $1
  i32.const 0
  local.set $0
  loop $for-loop|1
   local.get $0
   local.get $3
   i32.lt_s
   if
    global.get $~lib/memory/__stack_pointer
    global.get $assembly/nephelometry_dsp/SCRATCH_B
    local.tee $4
    i32.store offset=16
    global.get $~lib/memory/__stack_pointer
    local.get $4
    i32.store offset=4
    local.get $0
    i32.const 3
    i32.shl
    local.tee $5
    local.get $4
    i32.load offset=4
    i32.add
    f64.load
    f64.const 1e-12
    f64.max
    local.set $7
    global.get $~lib/memory/__stack_pointer
    global.get $assembly/nephelometry_dsp/SCRATCH_B
    local.tee $4
    i32.store offset=20
    global.get $~lib/memory/__stack_pointer
    local.get $4
    i32.store offset=4
    local.get $5
    local.get $4
    i32.load offset=4
    i32.add
    local.get $7
    local.get $1
    f64.div
    call $~lib/math/NativeMath.log
    f64.const 20
    f64.mul
    f64.const 2.302585092994046
    f64.div
    f64.store
    local.get $0
    i32.const 1
    i32.add
    local.set $0
    br $for-loop|1
   end
  end
  global.get $~lib/memory/__stack_pointer
  i32.const 24
  i32.add
  global.set $~lib/memory/__stack_pointer
  local.get $2
 )
 (func $assembly/nephelometry_dsp/spectralCentroid (param $0 i32) (param $1 f64) (result f64)
  (local $2 f64)
  (local $3 i32)
  (local $4 f64)
  (local $5 i32)
  (local $6 f64)
  (local $7 f64)
  (local $8 i32)
  global.get $~lib/memory/__stack_pointer
  i32.const 16
  i32.sub
  global.set $~lib/memory/__stack_pointer
  call $~stack_check
  global.get $~lib/memory/__stack_pointer
  i64.const 0
  i64.store
  global.get $~lib/memory/__stack_pointer
  i64.const 0
  i64.store offset=8
  i32.const 8
  i32.const 8192
  local.get $0
  local.get $0
  i32.const 8192
  i32.gt_s
  select
  local.get $0
  i32.const 8
  i32.lt_s
  select
  local.set $0
  loop $for-loop|0
   local.get $0
   local.get $3
   i32.gt_s
   if
    global.get $~lib/memory/__stack_pointer
    global.get $assembly/nephelometry_dsp/SCRATCH_B
    local.tee $5
    i32.store
    global.get $~lib/memory/__stack_pointer
    local.get $5
    i32.store offset=4
    local.get $5
    i32.load offset=4
    local.get $3
    i32.const 3
    i32.shl
    i32.add
    f64.const 0
    f64.store
    local.get $3
    i32.const 1
    i32.add
    local.set $3
    br $for-loop|0
   end
  end
  local.get $0
  call $assembly/nephelometry_dsp/hannWindow
  local.get $0
  call $assembly/nephelometry_dsp/fft
  local.get $0
  i32.const 1
  i32.shr_s
  local.set $3
  local.get $1
  local.get $0
  f64.convert_i32_s
  f64.div
  local.set $6
  i32.const 1
  local.set $0
  loop $for-loop|1
   local.get $0
   local.get $3
   i32.lt_s
   if
    local.get $0
    f64.convert_i32_s
    local.get $6
    f64.mul
    local.tee $7
    f64.const 150
    f64.lt
    local.get $7
    f64.const 6e3
    f64.gt
    i32.or
    i32.eqz
    if
     global.get $~lib/memory/__stack_pointer
     global.get $assembly/nephelometry_dsp/SCRATCH_A
     local.tee $5
     i32.store offset=8
     global.get $~lib/memory/__stack_pointer
     local.get $5
     i32.store offset=4
     local.get $0
     i32.const 3
     i32.shl
     local.tee $8
     local.get $5
     i32.load offset=4
     i32.add
     f64.load
     local.set $1
     global.get $~lib/memory/__stack_pointer
     global.get $assembly/nephelometry_dsp/SCRATCH_B
     local.tee $5
     i32.store offset=12
     global.get $~lib/memory/__stack_pointer
     local.get $5
     i32.store offset=4
     local.get $4
     local.get $7
     local.get $1
     local.get $1
     f64.mul
     local.get $5
     i32.load offset=4
     local.get $8
     i32.add
     f64.load
     local.tee $1
     local.get $1
     f64.mul
     f64.add
     f64.sqrt
     local.tee $1
     f64.mul
     f64.add
     local.set $4
     local.get $2
     local.get $1
     f64.add
     local.set $2
    end
    local.get $0
    i32.const 1
    i32.add
    local.set $0
    br $for-loop|1
   end
  end
  global.get $~lib/memory/__stack_pointer
  i32.const 16
  i32.add
  global.set $~lib/memory/__stack_pointer
  local.get $4
  local.get $2
  f64.div
  f64.const 0
  local.get $2
  f64.const 1e-12
  f64.gt
  select
 )
 (func $assembly/nephelometry_dsp/selfTest (result f64)
  f64.const 0
  f64.const 0
  f64.const 0
  f64.const 100
  f64.const 0
  f64.const 0
  call $assembly/nephelometry_dsp/deltaE00
 )
 (func $assembly/nephelometry_dsp/scratchBAt (param $0 i32) (result f64)
  (local $1 i32)
  (local $2 f64)
  global.get $~lib/memory/__stack_pointer
  i32.const 8
  i32.sub
  global.set $~lib/memory/__stack_pointer
  call $~stack_check
  global.get $~lib/memory/__stack_pointer
  i64.const 0
  i64.store
  global.get $~lib/memory/__stack_pointer
  global.get $assembly/nephelometry_dsp/SCRATCH_B
  local.tee $1
  i32.store
  global.get $~lib/memory/__stack_pointer
  local.get $1
  i32.store offset=4
  local.get $1
  i32.load offset=4
  i32.const 8191
  local.get $0
  local.get $0
  i32.const 8191
  i32.gt_s
  select
  i32.const 0
  local.get $0
  i32.const 0
  i32.ge_s
  select
  i32.const 3
  i32.shl
  i32.add
  f64.load
  global.get $~lib/memory/__stack_pointer
  i32.const 8
  i32.add
  global.set $~lib/memory/__stack_pointer
 )
 (func $assembly/nephelometry_dsp/scratchB (result i32)
  (local $0 i32)
  global.get $~lib/memory/__stack_pointer
  i32.const 4
  i32.sub
  global.set $~lib/memory/__stack_pointer
  call $~stack_check
  global.get $~lib/memory/__stack_pointer
  i32.const 0
  i32.store
  global.get $~lib/memory/__stack_pointer
  global.get $assembly/nephelometry_dsp/SCRATCH_B
  local.tee $0
  i32.store
  local.get $0
  i32.load offset=4
  global.get $~lib/memory/__stack_pointer
  i32.const 4
  i32.add
  global.set $~lib/memory/__stack_pointer
 )
 (func $assembly/nephelometry_dsp/scratchA (result i32)
  (local $0 i32)
  global.get $~lib/memory/__stack_pointer
  i32.const 4
  i32.sub
  global.set $~lib/memory/__stack_pointer
  call $~stack_check
  global.get $~lib/memory/__stack_pointer
  i32.const 0
  i32.store
  global.get $~lib/memory/__stack_pointer
  global.get $assembly/nephelometry_dsp/SCRATCH_A
  local.tee $0
  i32.store
  local.get $0
  i32.load offset=4
  global.get $~lib/memory/__stack_pointer
  i32.const 4
  i32.add
  global.set $~lib/memory/__stack_pointer
 )
 (func $assembly/nephelometry_dsp/rmsForFlow (param $0 f64) (param $1 f64) (result f64)
  f64.const 28
  f64.const 99
  f64.const 0.05
  f64.const 30
  local.get $0
  local.get $0
  f64.const 30
  f64.gt
  select
  local.get $0
  f64.const 0.05
  f64.lt
  select
  local.get $1
  f64.const 0.42
  local.get $1
  f64.const 0.02
  f64.gt
  select
  f64.const 4.2
  f64.mul
  f64.div
  f64.const 0.8695652173913044
  call $~lib/math/NativeMath.pow
  f64.const 10
  f64.mul
  f64.const 28
  f64.add
  local.tee $0
  local.get $0
  f64.const 99
  f64.gt
  select
  local.get $0
  f64.const 28
  f64.lt
  select
 )
 (func $assembly/nephelometry_dsp/rmsDb (param $0 i32) (result f64)
  (local $1 f64)
  (local $2 i32)
  (local $3 i32)
  global.get $~lib/memory/__stack_pointer
  i32.const 8
  i32.sub
  global.set $~lib/memory/__stack_pointer
  call $~stack_check
  global.get $~lib/memory/__stack_pointer
  i64.const 0
  i64.store
  i32.const 2
  i32.const 8192
  local.get $0
  local.get $0
  i32.const 8192
  i32.gt_s
  select
  local.get $0
  i32.const 2
  i32.lt_s
  select
  local.set $2
  i32.const 0
  local.set $0
  loop $for-loop|0
   local.get $0
   local.get $2
   i32.lt_s
   if
    global.get $~lib/memory/__stack_pointer
    global.get $assembly/nephelometry_dsp/SCRATCH_A
    local.tee $3
    i32.store
    global.get $~lib/memory/__stack_pointer
    local.get $3
    i32.store offset=4
    local.get $1
    local.get $3
    i32.load offset=4
    local.get $0
    i32.const 3
    i32.shl
    i32.add
    f64.load
    local.tee $1
    local.get $1
    f64.mul
    f64.add
    local.set $1
    local.get $0
    i32.const 1
    i32.add
    local.set $0
    br $for-loop|0
   end
  end
  local.get $1
  local.get $2
  f64.convert_i32_s
  f64.div
  f64.sqrt
  local.tee $1
  f64.const 1e-06
  f64.lt
  if
   global.get $~lib/memory/__stack_pointer
   i32.const 8
   i32.add
   global.set $~lib/memory/__stack_pointer
   f64.const 0
   return
  end
  global.get $~lib/memory/__stack_pointer
  i32.const 8
  i32.add
  global.set $~lib/memory/__stack_pointer
  f64.const 0
  f64.const 100
  local.get $1
  call $~lib/math/NativeMath.log
  f64.const 20
  f64.mul
  f64.const 2.302585092994046
  f64.div
  f64.const 100
  f64.add
  local.tee $1
  local.get $1
  f64.const 100
  f64.gt
  select
  local.get $1
  f64.const 0
  f64.lt
  select
 )
 (func $assembly/nephelometry_dsp/resonanceFromFill (param $0 f64) (param $1 f64) (param $2 f64) (result f64)
  f64.const 150
  f64.const 4500
  local.get $1
  local.get $2
  f64.const 0
  f64.const 99.5
  local.get $0
  local.get $0
  f64.const 99.5
  f64.gt
  select
  local.get $0
  f64.const 0
  f64.lt
  select
  f64.const 100
  f64.div
  local.get $2
  f64.mul
  f64.sub
  f64.const 0.004
  f64.max
  f64.const 4
  f64.mul
  f64.div
  local.tee $0
  local.get $0
  f64.const 4500
  f64.gt
  select
  local.get $0
  f64.const 150
  f64.lt
  select
 )
 (func $assembly/nephelometry_dsp/potabilityClass (param $0 f64) (result i32)
  local.get $0
  f64.const 1
  f64.lt
  if
   i32.const 0
   return
  end
  local.get $0
  f64.const 5
  f64.le
  if
   i32.const 1
   return
  end
  local.get $0
  f64.const 25
  f64.le
  if
   i32.const 2
   return
  end
  i32.const 3
 )
 (func $assembly/nephelometry_dsp/padDeltaE (param $0 f64) (param $1 f64) (param $2 f64) (param $3 i32) (result f64)
  (local $4 f64)
  (local $5 f64)
  (local $6 i32)
  global.get $~lib/memory/__stack_pointer
  i32.const 16
  i32.sub
  global.set $~lib/memory/__stack_pointer
  call $~stack_check
  global.get $~lib/memory/__stack_pointer
  i64.const 0
  i64.store
  global.get $~lib/memory/__stack_pointer
  i64.const 0
  i64.store offset=8
  global.get $~lib/memory/__stack_pointer
  global.get $assembly/nephelometry_dsp/SCRATCH_A
  local.tee $6
  i32.store
  global.get $~lib/memory/__stack_pointer
  local.get $6
  i32.store offset=4
  local.get $6
  i32.load offset=4
  local.get $3
  i32.const 3
  i32.mul
  local.tee $3
  i32.const 3
  i32.shl
  i32.add
  f64.load
  local.set $4
  global.get $~lib/memory/__stack_pointer
  global.get $assembly/nephelometry_dsp/SCRATCH_A
  local.tee $6
  i32.store offset=8
  global.get $~lib/memory/__stack_pointer
  local.get $6
  i32.store offset=4
  local.get $6
  i32.load offset=4
  local.get $3
  i32.const 1
  i32.add
  i32.const 3
  i32.shl
  i32.add
  f64.load
  local.set $5
  global.get $~lib/memory/__stack_pointer
  global.get $assembly/nephelometry_dsp/SCRATCH_A
  local.tee $6
  i32.store offset=12
  global.get $~lib/memory/__stack_pointer
  local.get $6
  i32.store offset=4
  local.get $0
  local.get $1
  local.get $2
  local.get $4
  local.get $5
  local.get $6
  i32.load offset=4
  local.get $3
  i32.const 2
  i32.add
  i32.const 3
  i32.shl
  i32.add
  f64.load
  call $assembly/nephelometry_dsp/deltaE00
  global.get $~lib/memory/__stack_pointer
  i32.const 16
  i32.add
  global.set $~lib/memory/__stack_pointer
 )
 (func $assembly/nephelometry_dsp/ntuFromScatter (param $0 f64) (param $1 f64) (param $2 f64) (param $3 f64) (result f64)
  local.get $1
  local.get $2
  f64.sub
  local.tee $1
  f64.const 0.001
  f64.lt
  if
   f64.const 100
   return
  end
  local.get $3
  local.get $0
  local.get $2
  f64.sub
  local.get $1
  f64.div
  f64.mul
  f64.const 1e3
  f64.mul
  local.tee $0
  f64.const 0
  f64.le
  if
   f64.const 0.1
   return
  end
  f64.const 0.1
  f64.const 100
  local.get $0
  local.get $0
  f64.const 0.016
  f64.mul
  f64.const 1
  f64.add
  f64.mul
  local.tee $0
  local.get $0
  f64.const 100
  f64.gt
  select
  local.get $0
  f64.const 0.1
  f64.lt
  select
 )
 (func $assembly/nephelometry_dsp/ntuFromContrast (param $0 f64) (param $1 f64) (param $2 f64) (result f64)
  f64.const 0.05
  f64.const 1
  local.get $1
  local.get $1
  f64.const 1
  f64.gt
  select
  local.get $1
  f64.const 0.05
  f64.lt
  select
  f64.const 0.002
  f64.const 0.999
  local.get $0
  local.get $0
  f64.const 0.999
  f64.gt
  select
  local.get $0
  f64.const 0.002
  f64.lt
  select
  f64.div
  local.tee $0
  f64.const 1
  f64.le
  if
   f64.const 0.1
   return
  end
  f64.const 0.1
  f64.const 100
  f64.const 30
  f64.const 5
  f64.const 200
  local.get $2
  local.get $2
  f64.const 200
  f64.gt
  select
  local.get $2
  f64.const 5
  f64.lt
  select
  f64.div
  f64.const 40
  f64.mul
  local.get $0
  call $~lib/math/NativeMath.log
  f64.const 1.05
  call $~lib/math/NativeMath.pow
  f64.mul
  local.tee $0
  local.get $0
  f64.const 100
  f64.gt
  select
  local.get $0
  f64.const 0.1
  f64.lt
  select
 )
 (func $assembly/nephelometry_dsp/matchBestPad (param $0 f64) (param $1 f64) (param $2 f64) (param $3 i32) (result i32)
  (local $4 i32)
  (local $5 f64)
  (local $6 f64)
  (local $7 i32)
  (local $8 i32)
  (local $9 i32)
  (local $10 f64)
  global.get $~lib/memory/__stack_pointer
  i32.const 20
  i32.sub
  global.set $~lib/memory/__stack_pointer
  call $~stack_check
  global.get $~lib/memory/__stack_pointer
  i32.const 0
  i32.const 20
  memory.fill
  i32.const 1
  i32.const 512
  local.get $3
  local.get $3
  i32.const 512
  i32.gt_s
  select
  local.get $3
  i32.const 0
  i32.le_s
  select
  local.set $8
  f64.const 1e9
  local.set $5
  loop $for-loop|0
   local.get $7
   local.get $8
   i32.lt_s
   if
    global.get $~lib/memory/__stack_pointer
    global.get $assembly/nephelometry_dsp/SCRATCH_A
    local.tee $3
    i32.store
    global.get $~lib/memory/__stack_pointer
    local.get $3
    i32.store offset=4
    local.get $3
    i32.load offset=4
    local.get $7
    i32.const 3
    i32.mul
    local.tee $3
    i32.const 3
    i32.shl
    i32.add
    f64.load
    local.set $6
    global.get $~lib/memory/__stack_pointer
    global.get $assembly/nephelometry_dsp/SCRATCH_A
    local.tee $9
    i32.store offset=8
    global.get $~lib/memory/__stack_pointer
    local.get $9
    i32.store offset=4
    local.get $9
    i32.load offset=4
    local.get $3
    i32.const 1
    i32.add
    i32.const 3
    i32.shl
    i32.add
    f64.load
    local.set $10
    global.get $~lib/memory/__stack_pointer
    global.get $assembly/nephelometry_dsp/SCRATCH_A
    local.tee $9
    i32.store offset=12
    global.get $~lib/memory/__stack_pointer
    local.get $9
    i32.store offset=4
    local.get $0
    local.get $1
    local.get $2
    local.get $6
    local.get $10
    local.get $9
    i32.load offset=4
    local.get $3
    i32.const 2
    i32.add
    i32.const 3
    i32.shl
    i32.add
    f64.load
    call $assembly/nephelometry_dsp/deltaE00
    local.set $6
    global.get $~lib/memory/__stack_pointer
    global.get $assembly/nephelometry_dsp/SCRATCH_B
    local.tee $3
    i32.store offset=16
    global.get $~lib/memory/__stack_pointer
    local.get $3
    i32.store offset=4
    local.get $3
    i32.load offset=4
    local.get $7
    i32.const 3
    i32.shl
    i32.add
    local.get $6
    f64.store
    local.get $5
    local.get $6
    f64.gt
    if
     local.get $6
     local.set $5
     local.get $7
     local.set $4
    end
    local.get $7
    i32.const 1
    i32.add
    local.set $7
    br $for-loop|0
   end
  end
  global.get $~lib/memory/__stack_pointer
  i32.const 20
  i32.add
  global.set $~lib/memory/__stack_pointer
  local.get $4
 )
 (func $assembly/nephelometry_dsp/hazeLossPct (param $0 f64) (param $1 f64) (result f64)
  f64.const 0
  f64.const 99.9
  f64.const 1
  local.get $0
  f64.const -0.0125
  f64.mul
  local.get $1
  f64.const 30
  f64.div
  f64.mul
  call $~lib/math/NativeMath.exp
  f64.sub
  f64.const 100
  f64.mul
  local.tee $0
  local.get $0
  f64.const 99.9
  f64.gt
  select
  local.get $0
  f64.const 0
  f64.lt
  select
 )
 (func $assembly/nephelometry_dsp/flowFromAcoustic (param $0 f64) (param $1 f64) (param $2 f64) (result f64)
  local.get $0
  f64.const -28
  f64.add
  local.tee $0
  f64.const 0
  f64.le
  if
   f64.const 0
   return
  end
  f64.const 0
  f64.const 30
  local.get $2
  f64.const 0.42
  local.get $2
  f64.const 0.02
  f64.gt
  select
  f64.const 4.2
  f64.mul
  local.get $0
  f64.const 10
  f64.div
  f64.const 1.15
  call $~lib/math/NativeMath.pow
  f64.mul
  f64.const 0.35
  f64.const 2.2
  local.get $1
  f64.const 1200
  f64.div
  local.tee $0
  local.get $0
  f64.const 2.2
  f64.gt
  select
  local.get $0
  f64.const 0.35
  f64.lt
  select
  f64.mul
  local.tee $0
  local.get $0
  f64.const 30
  f64.gt
  select
  local.get $0
  f64.const 0
  f64.lt
  select
 )
 (func $assembly/nephelometry_dsp/fillPctFromResonance (param $0 f64) (param $1 f64) (param $2 f64) (result f64)
  local.get $0
  f64.const 40
  f64.lt
  if
   f64.const 0
   return
  end
  f64.const 0
  f64.const 100
  local.get $2
  local.get $1
  local.get $0
  f64.const 4
  f64.mul
  f64.div
  f64.sub
  local.get $2
  f64.const 0.0001
  f64.max
  f64.div
  f64.const 100
  f64.mul
  local.tee $0
  local.get $0
  f64.const 100
  f64.gt
  select
  local.get $0
  f64.const 0
  f64.lt
  select
 )
 (func $assembly/nephelometry_dsp/dominantFrequency (param $0 i32) (param $1 f64) (param $2 f64) (param $3 f64) (result f64)
  (local $4 i32)
  (local $5 f64)
  (local $6 i32)
  (local $7 i32)
  (local $8 i32)
  (local $9 i32)
  (local $10 f64)
  global.get $~lib/memory/__stack_pointer
  i32.const 40
  i32.sub
  global.set $~lib/memory/__stack_pointer
  call $~stack_check
  global.get $~lib/memory/__stack_pointer
  i32.const 0
  i32.const 40
  memory.fill
  i32.const 8
  i32.const 8192
  local.get $0
  local.get $0
  i32.const 8192
  i32.gt_s
  select
  local.get $0
  i32.const 8
  i32.lt_s
  select
  local.tee $0
  call $assembly/nephelometry_dsp/hannWindow
  loop $for-loop|0
   local.get $0
   local.get $4
   i32.gt_s
   if
    global.get $~lib/memory/__stack_pointer
    global.get $assembly/nephelometry_dsp/SCRATCH_B
    local.tee $6
    i32.store
    global.get $~lib/memory/__stack_pointer
    local.get $6
    i32.store offset=4
    local.get $6
    i32.load offset=4
    local.get $4
    i32.const 3
    i32.shl
    i32.add
    f64.const 0
    f64.store
    local.get $4
    i32.const 1
    i32.add
    local.set $4
    br $for-loop|0
   end
  end
  local.get $0
  call $assembly/nephelometry_dsp/fft
  i32.const 1
  local.get $0
  i32.const 1
  i32.shr_s
  local.tee $7
  i32.const 1
  i32.sub
  local.tee $4
  local.get $2
  local.get $1
  local.get $0
  f64.convert_i32_s
  f64.div
  local.tee $5
  f64.div
  f64.ceil
  i32.trunc_sat_f64_s
  local.tee $0
  local.get $0
  local.get $4
  i32.gt_s
  select
  local.get $0
  i32.const 0
  i32.le_s
  select
  local.tee $0
  local.get $4
  local.get $3
  local.get $5
  f64.div
  f64.floor
  i32.trunc_sat_f64_s
  local.tee $6
  local.get $4
  local.get $6
  i32.lt_s
  select
  local.get $0
  local.get $6
  i32.gt_s
  select
  local.set $8
  f64.const -1
  local.set $1
  local.get $0
  local.set $4
  loop $for-loop|1
   local.get $4
   local.get $8
   i32.le_s
   if
    global.get $~lib/memory/__stack_pointer
    global.get $assembly/nephelometry_dsp/SCRATCH_A
    local.tee $9
    i32.store offset=8
    global.get $~lib/memory/__stack_pointer
    local.get $9
    i32.store offset=4
    local.get $4
    i32.const 3
    i32.shl
    local.tee $6
    local.get $9
    i32.load offset=4
    i32.add
    f64.load
    local.set $2
    global.get $~lib/memory/__stack_pointer
    global.get $assembly/nephelometry_dsp/SCRATCH_B
    local.tee $9
    i32.store offset=12
    global.get $~lib/memory/__stack_pointer
    local.get $9
    i32.store offset=4
    local.get $2
    local.get $2
    f64.mul
    local.get $9
    i32.load offset=4
    local.get $6
    i32.add
    f64.load
    local.tee $2
    local.get $2
    f64.mul
    f64.add
    local.tee $2
    local.get $1
    f64.gt
    if
     local.get $2
     local.set $1
     local.get $4
     local.set $0
    end
    local.get $4
    i32.const 1
    i32.add
    local.set $4
    br $for-loop|1
   end
  end
  block $folding-inner0 (result f64)
   local.get $0
   local.get $7
   i32.const 1
   i32.sub
   i32.lt_s
   local.get $0
   i32.const 1
   i32.gt_s
   i32.and
   if
    global.get $~lib/memory/__stack_pointer
    global.get $assembly/nephelometry_dsp/SCRATCH_A
    local.tee $4
    i32.store offset=16
    global.get $~lib/memory/__stack_pointer
    local.get $4
    i32.store offset=4
    local.get $0
    i32.const 1
    i32.sub
    i32.const 3
    i32.shl
    local.tee $6
    local.get $4
    i32.load offset=4
    i32.add
    f64.load
    local.set $1
    global.get $~lib/memory/__stack_pointer
    global.get $assembly/nephelometry_dsp/SCRATCH_B
    local.tee $4
    i32.store offset=20
    global.get $~lib/memory/__stack_pointer
    local.get $4
    i32.store offset=4
    local.get $1
    local.get $1
    f64.mul
    local.get $4
    i32.load offset=4
    local.get $6
    i32.add
    f64.load
    local.tee $1
    local.get $1
    f64.mul
    f64.add
    local.set $2
    global.get $~lib/memory/__stack_pointer
    global.get $assembly/nephelometry_dsp/SCRATCH_A
    local.tee $4
    i32.store offset=24
    global.get $~lib/memory/__stack_pointer
    local.get $4
    i32.store offset=4
    local.get $0
    i32.const 3
    i32.shl
    local.tee $6
    local.get $4
    i32.load offset=4
    i32.add
    f64.load
    local.set $3
    global.get $~lib/memory/__stack_pointer
    global.get $assembly/nephelometry_dsp/SCRATCH_B
    local.tee $4
    i32.store offset=28
    global.get $~lib/memory/__stack_pointer
    local.get $4
    i32.store offset=4
    local.get $4
    i32.load offset=4
    local.get $6
    i32.add
    f64.load
    local.set $10
    global.get $~lib/memory/__stack_pointer
    global.get $assembly/nephelometry_dsp/SCRATCH_A
    local.tee $4
    i32.store offset=32
    global.get $~lib/memory/__stack_pointer
    local.get $4
    i32.store offset=4
    local.get $0
    i32.const 1
    i32.add
    i32.const 3
    i32.shl
    local.tee $6
    local.get $4
    i32.load offset=4
    i32.add
    f64.load
    local.set $1
    global.get $~lib/memory/__stack_pointer
    global.get $assembly/nephelometry_dsp/SCRATCH_B
    local.tee $4
    i32.store offset=36
    global.get $~lib/memory/__stack_pointer
    local.get $4
    i32.store offset=4
    local.get $2
    local.get $3
    local.get $3
    f64.mul
    local.get $10
    local.get $10
    f64.mul
    f64.add
    f64.const 2
    f64.mul
    f64.sub
    local.get $1
    local.get $1
    f64.mul
    local.get $4
    i32.load offset=4
    local.get $6
    i32.add
    f64.load
    local.tee $1
    local.get $1
    f64.mul
    f64.add
    local.tee $1
    f64.add
    local.tee $3
    f64.abs
    f64.const 1e-15
    f64.gt
    if
     local.get $0
     f64.convert_i32_s
     f64.const -0.5
     f64.const 0.5
     local.get $2
     local.get $1
     f64.sub
     f64.const 0.5
     f64.mul
     local.get $3
     f64.div
     local.tee $1
     local.get $1
     f64.const 0.5
     f64.gt
     select
     local.get $1
     f64.const -0.5
     f64.lt
     select
     f64.add
     local.get $5
     f64.mul
     br $folding-inner0
    end
   end
   local.get $0
   f64.convert_i32_s
   local.get $5
   f64.mul
  end
  global.get $~lib/memory/__stack_pointer
  i32.const 40
  i32.add
  global.set $~lib/memory/__stack_pointer
 )
 (func $assembly/nephelometry_dsp/deltaEQuality (param $0 f64) (result i32)
  local.get $0
  f64.const 1
  f64.lt
  if
   i32.const 0
   return
  end
  local.get $0
  f64.const 2.3
  f64.lt
  if
   i32.const 1
   return
  end
  local.get $0
  f64.const 5
  f64.lt
  if
   i32.const 2
   return
  end
  i32.const 3
 )
 (func $assembly/nephelometry_dsp/bestDeltaE (result f64)
  (local $0 f64)
  (local $1 f64)
  (local $2 i32)
  (local $3 i32)
  global.get $~lib/memory/__stack_pointer
  i32.const 8
  i32.sub
  global.set $~lib/memory/__stack_pointer
  call $~stack_check
  global.get $~lib/memory/__stack_pointer
  i64.const 0
  i64.store
  f64.const 1e9
  local.set $0
  loop $for-loop|0
   local.get $2
   i32.const 64
   i32.lt_s
   if
    global.get $~lib/memory/__stack_pointer
    global.get $assembly/nephelometry_dsp/SCRATCH_B
    local.tee $3
    i32.store
    global.get $~lib/memory/__stack_pointer
    local.get $3
    i32.store offset=4
    local.get $3
    i32.load offset=4
    local.get $2
    i32.const 3
    i32.shl
    i32.add
    f64.load
    local.tee $1
    local.get $0
    f64.lt
    local.get $1
    f64.const 0
    f64.gt
    i32.and
    if
     local.get $1
     local.set $0
    end
    local.get $2
    i32.const 1
    i32.add
    local.set $2
    br $for-loop|0
   end
  end
  global.get $~lib/memory/__stack_pointer
  i32.const 8
  i32.add
  global.set $~lib/memory/__stack_pointer
  local.get $0
 )
)
