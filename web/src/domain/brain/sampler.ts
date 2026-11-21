import type { Rng } from '../random';

/** Tokens that would repeat an n-gram already present in `generated`. */
export function bannedByNgram(generated: readonly number[], n: number): Set<number> {
  const banned = new Set<number>();
  if (n <= 0 || generated.length < n - 1) return banned;
  const prefixStart = generated.length - n + 1;
  for (let i = 0; i <= generated.length - n; i++) {
    let same = true;
    for (let j = 0; j < n - 1 && same; j++) same = generated[i + j] === generated[prefixStart + j];
    if (same) banned.add(generated[i + n - 1] as number);
  }
  return banned;
}

/** Repetition penalty on already generated tokens plus hard n-gram blocking. */
export function penalize(
  logits: Float32Array,
  generated: readonly number[],
  penalty: number,
  noRepeatNgram: number,
): Float32Array {
  const out = Float32Array.from(logits);
  if (penalty !== 1 && generated.length > 0) {
    for (const id of new Set(generated)) {
      const v = out[id] as number;
      out[id] = v > 0 ? v / penalty : v * penalty;
    }
  }
  for (const id of bannedByNgram(generated, noRepeatNgram)) out[id] = -Infinity;
  return out;
}

export interface SampleOptions {
  temperature: number;
  topK: number;
  topP: number;
}

function argmax(values: Float32Array): number {
  let best = 0;
  for (let i = 1; i < values.length; i++)
    if ((values[i] as number) > (values[best] as number)) best = i;
  return best;
}

function kthLargest(values: Float64Array, k: number): number {
  return Float64Array.from(values).sort()[values.length - k] as number;
}

function topPFilter(probs: Float64Array, topP: number): void {
  const order = Array.from(probs.keys()).sort(
    (a, b) => (probs[b] as number) - (probs[a] as number),
  );
  let cumulative = 0;
  const keep = new Set<number>();
  for (const i of order) {
    if (cumulative < topP) keep.add(i);
    cumulative += probs[i] as number;
  }
  let total = 0;
  for (let i = 0; i < probs.length; i++) {
    if (!keep.has(i)) probs[i] = 0;
    total += probs[i] as number;
  }
  for (let i = 0; i < probs.length; i++) probs[i] = (probs[i] as number) / total;
}

function draw(probs: Float64Array, rng: Rng): number {
  const r = rng();
  let cumulative = 0;
  let last = 0;
  for (let i = 0; i < probs.length; i++) {
    const p = probs[i] as number;
    if (p <= 0) continue;
    cumulative += p;
    last = i;
    if (r < cumulative) return i;
  }
  return last;
}

export function sampleNext(logits: Float32Array, rng: Rng, opts: SampleOptions): number {
  if (opts.temperature <= 0) return argmax(logits);
  const scaled = Float64Array.from(logits, (v) => v / opts.temperature);
  if (opts.topK > 0 && opts.topK < scaled.length) {
    const kth = kthLargest(scaled, opts.topK);
    for (let i = 0; i < scaled.length; i++) if ((scaled[i] as number) < kth) scaled[i] = -Infinity;
  }
  let max = -Infinity;
  for (const v of scaled) if (v > max) max = v;
  const probs = scaled.map((v) => Math.exp(v - max));
  const total = probs.reduce((a, b) => a + b, 0);
  for (let i = 0; i < probs.length; i++) probs[i] = (probs[i] as number) / total;
  if (opts.topP > 0 && opts.topP < 1) topPFilter(probs, opts.topP);
  return draw(probs, rng);
}
