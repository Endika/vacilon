export function pitchUp(x: Float32Array, factor: number): Float32Array {
  if (x.length === 0) return new Float32Array(0);
  const n = Math.ceil((x.length - 1) / factor);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const pos = i * factor;
    const k = Math.floor(pos);
    const frac = pos - k;
    out[i] = k + 1 < x.length ? x[k] * (1 - frac) + x[k + 1] * frac : x[x.length - 1];
  }
  return out;
}

/** Amplitude modulation; `offset` keeps the phase continuous across chunks. */
export function robotize(
  x: Float32Array,
  sampleRate: number,
  depth: number,
  rateHz: number,
  offset = 0,
): void {
  for (let i = 0; i < x.length; i++) {
    const t = (offset + i) / sampleRate;
    x[i] *= 1 - depth + depth * Math.sin(2 * Math.PI * rateHz * t);
  }
}

export function normalize(x: Float32Array, peak: number): void {
  let max = 1e-9;
  for (let i = 0; i < x.length; i++) max = Math.max(max, Math.abs(x[i]));
  const gain = peak / max;
  for (let i = 0; i < x.length; i++) x[i] *= gain;
}
