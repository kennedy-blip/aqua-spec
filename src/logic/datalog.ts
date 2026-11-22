/**
 * AQUA-SPECTRA — src/logic/datalog.ts
 * A small, complete Datalog engine: parse → stratify → semi-naive fixpoint.
 *
 * Supports:
 *   fact  p("a", 7.3, 2).          % ground facts
 *   rule  h(X, "txt") :- p(X, Z), Z > 1.0, not q(X).
 *   comparisons  < <= > >= = !=    % evaluated against numeric or string terms
 *   wildcard     _                 % anonymous variable, never joins
 * Terrain: string literals with escapes, numbers (int/float, negative), and
 * variables. Negation is stratified so `not` never participates in recursion.
 */

export type Term =
  | { kind: 'var'; name: string }
  | { kind: 'str'; value: string }
  | { kind: 'num'; value: number }
  | { kind: 'anon' };

export type Atom = { name: string; terms: Term[]; negated: boolean };

export type CompareOp = '<' | '<=' | '>' | '>=' | '=' | '!=';

export type BodyItem =
  | { kind: 'atom'; atom: Atom }
  | { kind: 'cmp'; op: CompareOp; left: Term; right: Term };

export type Rule = {
  head: Atom;
  body: BodyItem[];
  source: string;
  line: number;
};

export type FactTuple = { rel: string; values: (string | number)[] };

export type InferenceStep = {
  rel: string;
  values: (string | number)[];
  rule: string;
  line: number;
  depth: number;
};

export type ParseIssue = { line: number; message: string; severity: 'error' | 'warning' };

export type Program = {
  rules: Rule[];
  facts: Atom[];
  issues: ParseIssue[];
  strata: Map<string, number>;
};

export type QueryAnswer = { substitutions: Map<string, string | number>[]; rows: (string | number)[][][] };

/** Tokenise a Datalog source string. Newlines are significant (clause ends). */
function tokenize(src: string, issues: ParseIssue[]): string[] {
  const out: string[] = [];
  let i = 0;
  let line = 1;
  const push = (t: string) => out.push(t);
  while (i < src.length) {
    const c = src[i];
    if (c === '\n') {
      line++;
      i++;
      continue;
    }
    if (c === '\r' || c === ' ' || c === '\t') {
      i++;
      continue;
    }
    if (c === '%') {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    if (c === '"') {
      let j = i + 1;
      let s = '';
      while (j < src.length && src[j] !== '"') {
        if (src[j] === '\\' && j + 1 < src.length) {
          const e = src[j + 1];
          s += e === 'n' ? '\n' : e === 't' ? '\t' : e;
          j += 2;
        } else {
          s += src[j++];
        }
      }
      if (j >= src.length) issues.push({ line, message: 'Unterminated string literal', severity: 'error' });
      push(`"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
      i = j + 1;
      continue;
    }
    // number: [-+]?digits[.digits][eE[-+]digits] — a bare '.' is punctuation
    if (/[0-9]/.test(c) || ((c === '-' || c === '+') && /[0-9]/.test(src[i + 1] ?? ''))) {
      let j = i;
      if (src[j] === '-' || src[j] === '+') j++;
      while (j < src.length && /[0-9]/.test(src[j])) j++;
      if (src[j] === '.' && /[0-9]/.test(src[j + 1] ?? '')) {
        j++;
        while (j < src.length && /[0-9]/.test(src[j])) j++;
      }
      if (/[eE]/.test(src[j] ?? '') && /[0-9+-]/.test(src[j + 1] ?? '')) {
        j++;
        if (src[j] === '-' || src[j] === '+') j++;
        while (j < src.length && /[0-9]/.test(src[j])) j++;
      }
      push(src.slice(i, j));
      i = j;
      continue;
    }
    if ('().,:-=!<>'.includes(c)) {
      // two-char operators
      const two = src.slice(i, i + 2);
      if (two === ':-' || two === '<=' || two === '>=' || two === '!=') {
        push(two);
        i += 2;
        continue;
      }
      push(c);
      i++;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i + 1;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
      push(src.slice(i, j));
      i = j;
      continue;
    }
    issues.push({ line, message: `Unexpected character '${c}'`, severity: 'error' });
    i++;
  }
  return out;
}

type RawClause = { tokens: string[]; line: number };

/**
 * Tokenise the whole source once (newlines are insignificant to the grammar),
 * then split on '.' into clauses. Because `tokenize` emits line numbers for
 * diagnostics separately, we track them with a marker token so clause start
 * lines stay accurate across multi-line rules.
 */
function splitClauses(src: string, issues: ParseIssue[]): RawClause[] {
  const clauses: RawClause[] = [];
  const lines = src.split('\n');
  const stream: string[] = [];

  for (let ln = 0; ln < lines.length; ln++) {
    const lineIssues: ParseIssue[] = [];
    const toks = tokenize(lines[ln], lineIssues);
    issues.push(...lineIssues.map((x) => ({ ...x, line: ln + 1 })));
    if (toks.length === 0) continue;
    stream.push(`\u0000${ln + 1}`);
    stream.push(...toks);
  }

  let cur: string[] = [];
  let line = 0;
  let pendingLine = 0;
  for (const t of stream) {
    if (t.startsWith('\u0000')) {
      pendingLine = Number(t.slice(1));
      continue;
    }
    if (t === '.') {
      if (cur.length) clauses.push({ tokens: cur, line: line || pendingLine || 1 });
      cur = [];
      line = 0;
      continue;
    }
    if (cur.length === 0) line = pendingLine || line || 1;
    cur.push(t);
  }
  if (cur.length) {
    issues.push({ line: line || 1, message: 'Clause not terminated with "."', severity: 'error' });
  }
  return clauses;
}

function parseTerm(tok: string): Term {
  if (tok === '_') return { kind: 'anon' };
  if (tok.startsWith('"')) return { kind: 'str', value: tok.slice(1, -1).replace(/\\(.)/g, '$1') };
  if (/^-?\d/.test(tok)) return { kind: 'num', value: Number(tok) };
  // Datalog convention: lower-case initial ⇒ symbolic constant, upper ⇒ variable
  if (/^[A-Z]/.test(tok)) return { kind: 'var', name: tok };
  return { kind: 'str', value: tok };
}

/** Parse an atom of the form name(t1, t2, …), advancing `i`. */
function parseAtom(tokens: string[], i: number, line: number, issues: ParseIssue[]): { atom: Atom; next: number } {
  const name = tokens[i];
  if (!name || !/^[a-z][A-Za-z0-9_]*$/.test(name)) {
    issues.push({ line, message: `Expected relation name, got "${name ?? 'EOF'}"`, severity: 'error' });
    return { atom: { name: 'invalid', terms: [], negated: false }, next: i + 1 };
  }
  if (tokens[i + 1] !== '(') {
    // zero-argument atom is allowed
    return { atom: { name, terms: [], negated: false }, next: i + 1 };
  }
  const terms: Term[] = [];
  let j = i + 2;
  let expectTerm = true;
  while (j < tokens.length) {
    const t = tokens[j];
    if (t === ')') {
      j++;
      break;
    }
    if (t === ',') {
      expectTerm = true;
      j++;
      continue;
    }
    if (expectTerm) {
      terms.push(parseTerm(t));
      expectTerm = false;
    }
    j++;
  }
  return { atom: { name, terms, negated: false }, next: j };
}

export function parseProgram(src: string): Program {
  const issues: ParseIssue[] = [];
  const clauses = splitClauses(src, issues);
  const rules: Rule[] = [];
  const facts: Atom[] = [];

  for (const clause of clauses) {
    const toks = [...clause.tokens];
    let head: Atom | null = null;
    let isFact = false;

    if (toks[0] === 'fact') {
      toks.shift();
      isFact = true;
    } else if (toks[0] === 'rule') {
      toks.shift();
    }

    // find ':-'
    const arrow = toks.indexOf(':-');
    const headTokens = arrow >= 0 ? toks.slice(0, arrow) : toks;
    const bodyTokens = arrow >= 0 ? toks.slice(arrow + 1) : [];

    let negated = false;
    if (headTokens[0] === 'not') {
      negated = true;
      headTokens.shift();
    }
    const parsedHead = parseAtom(headTokens, 0, clause.line, issues);
    head = { ...parsedHead.atom, negated };

    if (isFact || arrow < 0) {
      if (head.terms.some((t) => t.kind === 'var')) {
        issues.push({ line: clause.line, message: `Fact "${head.name}" contains a variable — facts must be ground`, severity: 'error' });
        continue;
      }
      facts.push(head);
      continue;
    }

    // body: split into items on commas that are not inside parentheses
    const body: BodyItem[] = [];
    let depth = 0;
    let item: string[] = [];
    const pushItem = () => {
      if (!item.length) return;
      const cmpIdx = item.findIndex((t) => t === '<' || t === '<=' || t === '>' || t === '>=' || t === '=' || t === '!=');
      if (cmpIdx > 0) {
        body.push({
          kind: 'cmp',
          op: item[cmpIdx] as CompareOp,
          left: parseTerm(item[cmpIdx - 1]),
          right: parseTerm(item[cmpIdx + 1]),
        });
      } else {
        const neg = item[0] === 'not';
        const start = neg ? 1 : 0;
        const { atom } = parseAtom(item, start, clause.line, issues);
        body.push({ kind: 'atom', atom: { ...atom, negated: neg } });
      }
      item = [];
    };

    for (const t of bodyTokens) {
      if (t === '(') depth++;
      if (t === ')') depth--;
      if (t === ',' && depth === 0) {
        pushItem();
        continue;
      }
      item.push(t);
    }
    pushItem();

    rules.push({
      head,
      body,
      source: renderRule(head, body),
      line: clause.line,
    });
  }

  const strata = computeStrata(rules, issues);
  return { rules, facts, issues, strata };
}

function termToString(t: Term): string {
  if (t.kind === 'str') return `"${t.value}"`;
  if (t.kind === 'num') return String(t.value);
  if (t.kind === 'anon') return '_';
  return t.name;
}

function renderRule(head: Atom, body: BodyItem[]): string {
  const h = `${head.name}(${head.terms.map(termToString).join(', ')})`;
  const b = body
    .map((it) =>
      it.kind === 'cmp'
        ? `${termToString(it.left)} ${it.op} ${termToString(it.right)}`
        : `${it.atom.negated ? 'not ' : ''}${it.atom.name}(${it.atom.terms.map(termToString).join(', ')})`,
    )
    .join(', ');
  return `${h} :- ${b}.`;
}

/**
 * Stratification: relation R depends on S through a positive body atom; a
 * negative dependency forces stratum(R) > stratum(S). Iterate until stable;
 * if it does not stabilise, a positive cycle through negation exists.
 */
function computeStrata(rules: Rule[], issues: ParseIssue[]): Map<string, number> {
  // relation → (negatively dependent relation) list
  const negEdges = new Map<string, Set<string>>();
  const posEdges = new Map<string, Set<string>>();
  for (const r of rules) {
    for (const item of r.body) {
      if (item.kind !== 'atom') continue;
      const target = item.atom.negated ? negEdges : posEdges;
      if (!target.has(r.head.name)) target.set(r.head.name, new Set());
      target.get(r.head.name)!.add(item.atom.name);
    }
  }

  const strata = new Map<string, number>();
  for (const name of [...negEdges.keys(), ...posEdges.keys()]) strata.set(name, 0);

  // Bellman-Ford style relaxation: stratum(head) ≥ stratum(body) + 1 for
  // negative edges, ≥ stratum(body) for positive ones. A cycle of negative
  // edges makes the program non-stratifiable.
  for (let round = 0; round < rules.length + 2; round++) {
    let changed = false;
    for (const r of rules) {
      const head = r.head.name;
      let need = strata.get(head) ?? 0;
      for (const body of negEdges.get(head) ?? []) need = Math.max(need, (strata.get(body) ?? 0) + 1);
      for (const body of posEdges.get(head) ?? []) need = Math.max(need, strata.get(body) ?? 0);
      if (need > (strata.get(head) ?? 0)) {
        strata.set(head, need);
        changed = true;
      }
    }
    if (!changed) return strata;
  }
  issues.push({ line: 0, message: 'Program is not stratifiable (negation in a recursive cycle)', severity: 'error' });
  return strata;
}

// ── evaluation ───────────────────────────────────────────────────────────────

type Binding = Map<string, string | number>;

function unify(atom: Atom, values: (string | number)[], binding: Binding): Binding | null {
  const next = new Map(binding);
  for (let i = 0; i < atom.terms.length; i++) {
    const term = atom.terms[i];
    const v = values[i];
    if (term.kind === 'anon') continue;
    if (term.kind === 'var') {
      const existing = next.get(term.name);
      if (existing === undefined) next.set(term.name, v);
      else if (existing !== v) return null;
    } else if (term.kind === 'str') {
      if (String(v) !== term.value) return null;
    } else if (term.kind === 'num') {
      if (typeof v === 'number' ? v !== term.value : Number(v) !== term.value) return null;
    }
  }
  return next;
}

function compare(op: CompareOp, a: string | number | undefined, b: string | number | undefined): boolean {
  if (a === undefined || b === undefined) return false;
  const bothNum = typeof a === 'number' && typeof b === 'number';
  const zeroes = (v: string | number) => String(v).replace(/\.0+$/, '');
  const sa = bothNum ? String(a) : zeroes(a);
  const sb = bothNum ? String(b) : zeroes(b);
  switch (op) {
    case '=':
      return sa === sb;
    case '!=':
      return sa !== sb;
    default: {
      const na = Number(a);
      const nb = Number(b);
      if (Number.isNaN(na) || Number.isNaN(nb)) {
        return false;
      }
      if (op === '<') return na < nb;
      if (op === '<=') return na <= nb;
      if (op === '>') return na > nb;
      return na >= nb;
    }
  }
}

function evalTerm(t: Term, binding: Binding): string | number | undefined {
  if (t.kind === 'str') return t.value;
  if (t.kind === 'num') return t.value;
  if (t.kind === 'anon') return undefined;
  return binding.get(t.name);
}

function instantiate(head: Atom, binding: Binding): (string | number)[] | null {
  const out: (string | number)[] = [];
  for (const t of head.terms) {
    const v = evalTerm(t, binding);
    if (v === undefined) return null;
    out.push(v);
  }
  return out;
}

/** Join one body item against the current bindings. */
function joinItem(
  item: BodyItem,
  bindings: Binding[],
  facts: Map<string, (string | number)[][]>,
): Binding[] {
  const out: Binding[] = [];
  if (item.kind === 'cmp') {
    for (const b of bindings) {
      if (compare(item.op, evalTerm(item.left, b), evalTerm(item.right, b))) out.push(b);
    }
    return out;
  }
  const atom = item.atom;
  const rows = facts.get(atom.name) ?? [];
  if (atom.negated) {
    for (const b of bindings) {
      const hit = rows.some((r) => unify(atom, r, b) !== null);
      if (!hit) out.push(b);
    }
    return out;
  }
  for (const b of bindings) {
    for (const r of rows) {
      const nb = unify(atom, r, b);
      if (nb) out.push(nb);
    }
  }
  return out;
}

export type EngineResult = {
  facts: FactTuple[];
  steps: InferenceStep[];
  hazards: { subject: string; label: string; severity: string; source: string }[];
  actions: { subject: string; action: string }[];
  seals: { subject: string; level: string }[];
  iterations: number;
  derivedCount: number;
  elapsedMs: number;
};

/** Materialise the program to a stratified fixpoint, recording the derivation trace. */
export function evaluate(program: Program): EngineResult {
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const store = new Map<string, Map<string, (string | number)[]>>();
  const steps: InferenceStep[] = [];

  const add = (rel: string, values: (string | number)[]) => {
    let bucket = store.get(rel);
    if (!bucket) {
      bucket = new Map();
      store.set(rel, bucket);
    }
    const k = values.join('\u0001');
    if (bucket.has(k)) return false;
    bucket.set(k, values);
    return true;
  };

  for (const f of program.facts) {
    const values = f.terms.map((t) => (t.kind === 'num' ? t.value : (t as { value: string }).value));
    add(f.name, values);
  }
  const seedCount = [...store.values()].reduce((a, b) => a + b.size, 0);

  const asArrayMap = () => {
    const m = new Map<string, (string | number)[][]>();
    for (const [rel, bucket] of store) m.set(rel, [...bucket.values()]);
    return m;
  };

  const maxStratum = Math.max(0, ...program.strata.values());
  let iterations = 0;

  for (let s = 0; s <= maxStratum; s++) {
    const levelRules = program.rules.filter((r) => (program.strata.get(r.head.name) ?? 0) === s);
    if (!levelRules.length) continue;
    let changed = true;
    let rounds = 0;
    while (changed && rounds++ < 100) {
      changed = false;
      iterations++;
      for (const rule of levelRules) {
        let bindings: Binding[] = [new Map()];
        for (const item of rule.body) {
          bindings = joinItem(item, bindings, asArrayMap());
          if (!bindings.length) break;
        }
        for (const b of bindings) {
          const head = instantiate(rule.head, b);
          if (!head) continue;
          if (add(rule.head.name, head)) {
            changed = true;
            steps.push({ rel: rule.head.name, values: head, rule: rule.source, line: rule.line, depth: s });
          }
        }
      }
    }
  }

  const all: FactTuple[] = [];
  for (const [rel, bucket] of store) {
    for (const values of bucket.values()) all.push({ rel, values });
  }

  const hazards = (store.get('inferred_hazard') ? [...store.get('inferred_hazard')!.values()] : [])
    .map((v) => ({ subject: String(v[0]), label: String(v[1]), severity: String(v[2]), source: 'inferred_hazard' }))
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity));

  const actions = (store.get('action') ? [...store.get('action')!.values()] : []).map((v) => ({
    subject: String(v[0]),
    action: String(v[1]),
  }));

  const seals = (store.get('seal_level') ? [...store.get('seal_level')!.values()] : []).map((v) => ({
    subject: String(v[0]),
    level: String(v[1]),
  }));

  const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  return {
    facts: all,
    steps,
    hazards,
    actions,
    seals,
    iterations,
    derivedCount: all.length - seedCount,
    elapsedMs: Math.round((t1 - t0) * 100) / 100,
  };
}

function severityRank(s: string): number {
  return s === 'CRITICAL' ? 4 : s === 'HIGH' ? 3 : s === 'MODERATE' ? 2 : s === 'LOW' ? 1 : 0;
}

/**
 * Answer a query like `inferred_hazard("alpine", L, S)` against an evaluated
 * store, returning variable substitutions for the table view.
 */
export function query(result: EngineResult, relation: string, args: (string | number | null)[]): QueryAnswer {
  const rows = result.facts.filter((f) => f.rel === relation).map((f) => f.values);
  const matching = rows.filter((r) =>
    args.every((a, i) => a === null || String(r[i]) === String(a)),
  );
  return { substitutions: [], rows: matching.map((r) => [r]) };
}

/** Render the materialised extensional + intensional database as .dl source. */
export function serialize(result: EngineResult): string {
  const byRel = new Map<string, (string | number)[][]>();
  for (const f of result.facts) {
    if (!byRel.has(f.rel)) byRel.set(f.rel, []);
    byRel.get(f.rel)!.push(f.values);
  }
  const lines: string[] = ['% materialised model — generated by AquaSpectra Datalog engine'];
  for (const [rel, rows] of byRel) {
    lines.push('');
    lines.push(`% ${rel} (${rows.length})`);
    for (const r of rows) {
      const args = r.map((v) => (typeof v === 'number' ? v : `"${String(v)}"`)).join(', ');
      lines.push(`fact ${rel}(${args}).`);
    }
  }
  return lines.join('\n');
}
