/**
 * AQUA-SPECTRA — src/apk/qrCode.ts
 *
 * Self-contained QR Code encoder (ISO/IEC 18004) — no dependencies, no network.
 * Supports byte mode, error-correction level M, versions 1–10 (up to 213 bytes),
 * which comfortably covers the app URL plus a caption.
 *
 * Pipeline: data → bit stream → Reed–Solomon ECC (GF(256)) → matrix placement
 * → mask scoring → format/version info → SVG path.
 */

// Format-field EC indicator: L=1, M=0, Q=3, H=2 (ISO 18004 Table 12)
const EC_LEVEL_MASK = 0b00;

/**
 * Total codewords and ECC block structure for versions 1..10 at level M.
 * [totalCodewords, ecCodewordsPerBlock, group1Blocks, group1DataCodewords,
 *  group2Blocks, group2DataCodewords]
 */
const VERSION_M: readonly (readonly [number, number, number, number, number, number])[] = [
  [26, 10, 1, 16, 0, 0], // v1
  [44, 16, 1, 28, 0, 0], // v2
  [70, 26, 1, 44, 0, 0], // v3
  [100, 18, 2, 32, 0, 0], // v4
  [134, 24, 2, 43, 0, 0], // v5
  [172, 16, 4, 27, 0, 0], // v6
  [196, 18, 4, 31, 0, 0], // v7
  [242, 22, 2, 38, 2, 39], // v8
  [292, 22, 3, 36, 2, 37], // v9
  [346, 26, 4, 43, 1, 44], // v10
];

const ALIGNMENT_POSITIONS: readonly (readonly number[])[] = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
];



// ── GF(256) Reed–Solomon ────────────────────────────────────────────────────

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

const gfMul = (a: number, b: number): number => (a === 0 || b === 0 ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]]);

function rsGeneratorPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array<number>(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], GF_EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function rsRemainder(data: number[], degree: number): number[] {
  const gen = rsGeneratorPoly(degree);
  const result = new Array<number>(degree).fill(0);
  for (const byte of data) {
    const factor = byte ^ result[0];
    result.shift();
    result.push(0);
    for (let i = 0; i < degree; i++) result[i] ^= gfMul(gen[i + 1], factor);
  }
  return result;
}

// ── bit stream ──────────────────────────────────────────────────────────────

class BitBuffer {
  bits: number[] = [];
  push(value: number, length: number): void {
    for (let i = length - 1; i >= 0; i--) this.bits.push((value >> i) & 1);
  }
  get length(): number {
    return this.bits.length;
  }
  toBytes(): number[] {
    const out: number[] = [];
    for (let i = 0; i < this.bits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8; j++) byte = (byte << 1) | (this.bits[i + j] ?? 0);
      out.push(byte);
    }
    return out;
  }
}

function chooseVersion(byteLength: number): number {
  for (let v = 1; v <= 10; v++) {
    const [, ecPerBlock, g1Blocks, g1Data, g2Blocks, g2Data] = VERSION_M[v - 1];
    const dataCodewords = g1Blocks * g1Data + g2Blocks * g2Data;
    const headerBits = 4 + (v <= 9 ? 8 : 16);
    if (headerBits + byteLength * 8 <= dataCodewords * 8) return v;
    void ecPerBlock;
  }
  return 10;
}

// ── matrix construction ─────────────────────────────────────────────────────

type Matrix = { size: number; modules: Int8Array; reserved: Uint8Array };

const idx = (size: number, r: number, c: number) => r * size + c;

function buildMatrix(version: number): Matrix {
  const size = version * 4 + 17;
  const modules = new Int8Array(size * size).fill(-1);
  const reserved = new Uint8Array(size * size);

  const set = (r: number, c: number, v: number, res = true) => {
    if (r < 0 || c < 0 || r >= size || c >= size) return;
    modules[idx(size, r, c)] = v;
    if (res) reserved[idx(size, r, c)] = 1;
  };

  // finder patterns + separators
  for (const [r0, c0] of [
    [0, 0],
    [0, size - 7],
    [size - 7, 0],
  ]) {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = r0 + dr;
        const c = c0 + dc;
        if (r < 0 || c < 0 || r >= size || c >= size) continue;
        const inner = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const on = inner && (dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4));
        set(r, c, on ? 1 : 0);
      }
    }
  }

  // timing patterns
  for (let i = 8; i < size - 8; i++) {
    set(6, i, i % 2 === 0 ? 1 : 0);
    set(i, 6, i % 2 === 0 ? 1 : 0);
  }

  // alignment patterns
  const positions = ALIGNMENT_POSITIONS[version - 1];
  for (const r of positions) {
    for (const c of positions) {
      // skip those overlapping finders
      const nearFinder =
        (r <= 8 && c <= 8) || (r <= 8 && c >= size - 9) || (r >= size - 9 && c <= 8);
      if (nearFinder) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const on = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          set(r + dr, c + dc, on ? 1 : 0);
        }
      }
    }
  }

  // reserve format areas
  for (let i = 0; i < 9; i++) {
    if (!reserved[idx(size, 8, i)]) set(8, i, 0);
    if (!reserved[idx(size, i, 8)]) set(i, 8, 0);
  }
  for (let i = 0; i < 8; i++) {
    if (!reserved[idx(size, 8, size - 1 - i)]) set(8, size - 1 - i, 0);
    if (!reserved[idx(size, size - 1 - i, 8)]) set(size - 1 - i, 8, 0);
  }
  set(size - 8, 8, 1); // dark module

  // reserve version info (v ≥ 7)
  if (version >= 7) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        set(size - 11 + j, i, 0);
        set(i, size - 11 + j, 0);
      }
    }
  }

  return { size, modules, reserved };
}

function placeData(matrix: Matrix, codewords: number[]): void {
  const { size, modules, reserved } = matrix;
  const bits: number[] = [];
  for (const cw of codewords) {
    for (let i = 7; i >= 0; i--) bits.push((cw >> i) & 1);
  }
  let bitIndex = 0;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // skip vertical timing column
    for (let vert = 0; vert < size; vert++) {
      const row = upward ? size - 1 - vert : vert;
      for (let k = 0; k < 2; k++) {
        const col = right - k;
        if (reserved[idx(size, row, col)]) continue;
        modules[idx(size, row, col)] = bits[bitIndex++] ?? 0;
      }
    }
    upward = !upward;
  }
}

const MASKS: ((r: number, c: number) => boolean)[] = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

function formatBits(mask: number): number {
  // 5 data bits (ec level + mask) with BCH(15,5) and XOR mask 0x5412
  let data = (EC_LEVEL_MASK << 3) | mask;
  let rem = data << 10;
  for (let i = 14; i >= 10; i--) {
    if ((rem >> i) & 1) rem ^= 0b10100110111 << (i - 10);
  }
  return (((data << 10) | rem) ^ 0b101010000010010) & 0x7fff;
}

function placeFormat(matrix: Matrix, mask: number): void {
  const { size, modules } = matrix;
  const bits = formatBits(mask);
  const bit = (i: number) => (bits >> i) & 1;
  // around top-left finder
  for (let i = 0; i <= 5; i++) modules[idx(size, 8, i)] = bit(i);
  modules[idx(size, 8, 7)] = bit(6);
  modules[idx(size, 8, 8)] = bit(7);
  modules[idx(size, 7, 8)] = bit(8);
  for (let i = 9; i <= 14; i++) modules[idx(size, 14 - i, 8)] = bit(i);
  // second copy
  for (let i = 0; i <= 7; i++) modules[idx(size, size - 1 - i, 8)] = bit(i);
  for (let i = 8; i <= 14; i++) modules[idx(size, 8, size - 15 + i)] = bit(i);
}

function versionBits(version: number): number {
  let rem = version << 12;
  for (let i = 17; i >= 12; i--) {
    if ((rem >> i) & 1) rem ^= 0b1111100100101 << (i - 12);
  }
  return (version << 12) | rem;
}

function placeVersion(matrix: Matrix, version: number): void {
  if (version < 7) return;
  const { size, modules } = matrix;
  const bits = versionBits(version);
  for (let i = 0; i < 18; i++) {
    const bit = (bits >> i) & 1;
    const a = Math.floor(i / 3);
    const b = i % 3;
    modules[idx(size, size - 11 + b, a)] = bit;
    modules[idx(size, a, size - 11 + b)] = bit;
  }
}

function penalty(matrix: Matrix, mask: number): number {
  const { size, modules } = matrix;
  let score = 0;
  const at = (r: number, c: number) => {
    const v = modules[idx(size, r, c)];
    return v === 1 ? 1 : 0;
  };
  // rules 1 & 3 (runs) — horizontal and vertical
  for (let pass = 0; pass < 2; pass++) {
    for (let a = 0; a < size; a++) {
      let run = 1;
      let prev = pass === 0 ? at(a, 0) : at(0, a);
      for (let b = 1; b < size; b++) {
        const cur = pass === 0 ? at(a, b) : at(b, a);
        if (cur === prev) run++;
        else {
          if (run >= 5) score += 3 + (run - 5);
          // detect 1:1:3:1:1 finder-like pattern
          run = 1;
          prev = cur;
          continue;
        }
        if (run >= 5) score += 0;
      }
      if (run >= 5) score += 3 + (run - 5);
    }
  }
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size - 10; c++) {
      const seq = `${at(r, c)}${at(r, c + 1)}${at(r, c + 2)}${at(r, c + 3)}${at(r, c + 4)}${at(r, c + 5)}${at(r, c + 6)}${at(r, c + 7)}${at(r, c + 8)}${at(r, c + 9)}${at(r, c + 10)}`;
      if (seq === '10111010000' || seq === '00001011101') score += 40;
    }
  }
  for (let c = 0; c < size; c++) {
    for (let r = 0; r < size - 10; r++) {
      const seq = `${at(r, c)}${at(r + 1, c)}${at(r + 2, c)}${at(r + 3, c)}${at(r + 4, c)}${at(r + 5, c)}${at(r + 6, c)}${at(r + 7, c)}${at(r + 8, c)}${at(r + 9, c)}${at(r + 10, c)}`;
      if (seq === '10111010000' || seq === '00001011101') score += 40;
    }
  }
  // rule 2 — 2×2 blocks
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = at(r, c);
      if (v === at(r, c + 1) && v === at(r + 1, c) && v === at(r + 1, c + 1)) score += 3;
    }
  }
  // rule 4 — dark ratio
  let dark = 0;
  for (let i = 0; i < modules.length; i++) if (modules[i] === 1) dark++;
  const ratio = (dark / (size * size)) * 100;
  score += Math.floor(Math.abs(ratio - 50) / 5) * 10;
  void mask;
  return score;
}

function applyMask(matrix: Matrix, mask: number): void {
  const { size, modules, reserved } = matrix;
  const fn = MASKS[mask];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (reserved[idx(size, r, c)]) continue;
      const i = idx(size, r, c);
      if (modules[i] >= 0 && fn(r, c)) modules[i] ^= 1;
    }
  }
}

// ── public API ──────────────────────────────────────────────────────────────

export type QrMatrix = { size: number; get(r: number, c: number): boolean };

export function encodeQr(text: string): QrMatrix {
  const bytes = [...new TextEncoder().encode(text)];
  const version = chooseVersion(bytes.length);
  const [, ecPerBlock, g1Blocks, g1Data, g2Blocks, g2Data] = VERSION_M[version - 1];
  const totalData = g1Blocks * g1Data + g2Blocks * g2Data;

  const buffer = new BitBuffer();
  buffer.push(0b0100, 4); // byte mode
  buffer.push(bytes.length, version <= 9 ? 8 : 16);
  for (const b of bytes) buffer.push(b, 8);
  const capacityBits = totalData * 8;
  const terminator = Math.min(4, capacityBits - buffer.length);
  buffer.push(0, terminator);
  while (buffer.length % 8 !== 0) buffer.push(0, 1);
  const dataBytes = buffer.toBytes();
  let pad = 0;
  while (dataBytes.length < totalData) {
    dataBytes.push(pad % 2 === 0 ? 0xec : 0x11);
    pad++;
  }

  // split into blocks and compute ECC per block
  const blocks: { data: number[]; ec: number[] }[] = [];
  let cursor = 0;
  for (let i = 0; i < g1Blocks; i++) {
    const data = dataBytes.slice(cursor, cursor + g1Data);
    cursor += g1Data;
    blocks.push({ data, ec: rsRemainder(data, ecPerBlock) });
  }
  for (let i = 0; i < g2Blocks; i++) {
    const data = dataBytes.slice(cursor, cursor + g2Data);
    cursor += g2Data;
    blocks.push({ data, ec: rsRemainder(data, ecPerBlock) });
  }

  // interleave
  const codewords: number[] = [];
  const maxData = Math.max(...blocks.map((b) => b.data.length));
  for (let i = 0; i < maxData; i++) {
    for (const b of blocks) if (i < b.data.length) codewords.push(b.data[i]);
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (const b of blocks) codewords.push(b.ec[i]);
  }

  let best: { matrix: Matrix; mask: number; score: number } | null = null;
  for (let mask = 0; mask < 8; mask++) {
    const matrix = buildMatrix(version);
    placeData(matrix, codewords);
    applyMask(matrix, mask);
    placeFormat(matrix, mask);
    placeVersion(matrix, version);
    const score = penalty(matrix, mask);
    if (!best || score < best.score) best = { matrix, mask, score };
  }

  const finalMatrix = best!.matrix;
  const size = finalMatrix.size;
  return {
    size,
    get: (r, c) => finalMatrix.modules[idx(size, r, c)] === 1,
  };
}

/** Render a QR matrix as a single SVG path (crisp at any size, ~2 KB). */
export function qrToSvgPath(matrix: QrMatrix, moduleSize = 1): string {
  const parts: string[] = [];
  for (let r = 0; r < matrix.size; r++) {
    let runStart = -1;
    for (let c = 0; c <= matrix.size; c++) {
      const on = c < matrix.size && matrix.get(r, c);
      if (on && runStart < 0) runStart = c;
      if (!on && runStart >= 0) {
        parts.push(`M${runStart * moduleSize} ${r * moduleSize}h${(c - runStart) * moduleSize}v${moduleSize}h-${(c - runStart) * moduleSize}z`);
        runStart = -1;
      }
    }
  }
  return parts.join('');
}
