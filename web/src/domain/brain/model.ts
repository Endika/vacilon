export interface ModelConfig {
  vocab_size: number;
  n_embd: number;
  n_layer: number;
  n_head: number;
  block_size: number;
  ln_eps: number;
}

export interface TensorEntry {
  name: string;
  dtype: 'int8' | 'float32';
  shape: number[];
  offset: number;
  scale_offset?: number;
}

export interface Manifest {
  config: ModelConfig;
  tensors: TensorEntry[];
}

export class KVCache {
  readonly k: Float32Array[];
  readonly v: Float32Array[];
  length = 0;

  constructor(layers: number, size: number) {
    this.k = Array.from({ length: layers }, () => new Float32Array(size));
    this.v = Array.from({ length: layers }, () => new Float32Array(size));
  }
}

const SQRT_2_OVER_PI = Math.sqrt(2 / Math.PI);

function dequantize(buffer: ArrayBuffer, entry: TensorEntry): Float32Array {
  const [rows, cols] = entry.shape as [number, number];
  const q = new Int8Array(buffer, entry.offset, rows * cols);
  const scale = new Float32Array(buffer, entry.scale_offset as number, rows);
  const out = new Float32Array(rows * cols);
  for (let r = 0; r < rows; r++) {
    const s = scale[r] as number;
    for (let c = 0; c < cols; c++) out[r * cols + c] = (q[r * cols + c] as number) * s;
  }
  return out;
}

export function readTensors(manifest: Manifest, buffer: ArrayBuffer): Map<string, Float32Array> {
  const weights = new Map<string, Float32Array>();
  for (const entry of manifest.tensors) {
    if (entry.dtype === 'int8') {
      weights.set(entry.name, dequantize(buffer, entry));
    } else {
      const length = entry.shape.reduce((a, b) => a * b, 1);
      weights.set(
        entry.name,
        new Float32Array(buffer.slice(entry.offset, entry.offset + length * 4)),
      );
    }
  }
  return weights;
}

/** out[r] = sum_c w[r*cols + c] * x[c] for the rows of a (rows x cols) matrix. */
function matVec(w: Float32Array, rows: number, cols: number, x: Float32Array, out: Float32Array) {
  for (let r = 0; r < rows; r++) {
    let sum = 0;
    const base = r * cols;
    for (let c = 0; c < cols; c++) sum += (w[base + c] as number) * (x[c] as number);
    out[r] = sum;
  }
}

function layerNorm(
  x: Float32Array,
  w: Float32Array,
  b: Float32Array,
  eps: number,
  out: Float32Array,
) {
  const n = x.length;
  let mean = 0;
  for (let i = 0; i < n; i++) mean += x[i] as number;
  mean /= n;
  let variance = 0;
  for (let i = 0; i < n; i++) variance += ((x[i] as number) - mean) ** 2;
  const inv = 1 / Math.sqrt(variance / n + eps);
  for (let i = 0; i < n; i++) {
    out[i] = ((x[i] as number) - mean) * inv * (w[i] as number) + (b[i] as number);
  }
}

function gelu(x: Float32Array): void {
  for (let i = 0; i < x.length; i++) {
    const v = x[i] as number;
    x[i] = 0.5 * v * (1 + Math.tanh(SQRT_2_OVER_PI * (v + 0.044715 * v * v * v)));
  }
}

export class GPT {
  readonly cfg: ModelConfig;
  private readonly w: Map<string, Float32Array>;
  private readonly x: Float32Array;
  private readonly h: Float32Array;
  private readonly qkv: Float32Array;
  private readonly att: Float32Array;
  private readonly proj: Float32Array;
  private readonly hidden: Float32Array;
  private readonly scores: Float32Array;
  readonly logits: Float32Array;

  constructor(cfg: ModelConfig, weights: Map<string, Float32Array>) {
    this.cfg = cfg;
    this.w = weights;
    const c = cfg.n_embd;
    this.x = new Float32Array(c);
    this.h = new Float32Array(c);
    this.qkv = new Float32Array(3 * c);
    this.att = new Float32Array(c);
    this.proj = new Float32Array(c);
    this.hidden = new Float32Array(4 * c);
    this.scores = new Float32Array(cfg.block_size);
    this.logits = new Float32Array(cfg.vocab_size);
  }

  static fromBuffers(manifest: Manifest, buffer: ArrayBuffer): GPT {
    return new GPT(manifest.config, readTensors(manifest, buffer));
  }

  newCache(): KVCache {
    return new KVCache(this.cfg.n_layer, this.cfg.block_size * this.cfg.n_embd);
  }

  /** Feeds one token and returns the logits for the next one (a reused buffer). */
  step(token: number, cache: KVCache): Float32Array {
    const { n_embd: c, n_layer, block_size, ln_eps } = this.cfg;
    const pos = cache.length;
    if (pos >= block_size) throw new Error(`sequence length exceeds block size ${block_size}`);
    const wte = this.get('wte.weight');
    const wpe = this.get('wpe.weight');
    for (let i = 0; i < c; i++) {
      this.x[i] = (wte[token * c + i] as number) + (wpe[pos * c + i] as number);
    }
    for (let l = 0; l < n_layer; l++) {
      const p = `blocks.${l}.`;
      layerNorm(this.x, this.get(p + 'ln1.weight'), this.get(p + 'ln1.bias'), ln_eps, this.h);
      this.attention(l, pos, cache);
      for (let i = 0; i < c; i++) this.x[i] = (this.x[i] as number) + (this.proj[i] as number);
      layerNorm(this.x, this.get(p + 'ln2.weight'), this.get(p + 'ln2.bias'), ln_eps, this.h);
      matVec(this.get(p + 'mlp.fc.weight'), 4 * c, c, this.h, this.hidden);
      gelu(this.hidden);
      matVec(this.get(p + 'mlp.proj.weight'), c, 4 * c, this.hidden, this.proj);
      for (let i = 0; i < c; i++) this.x[i] = (this.x[i] as number) + (this.proj[i] as number);
    }
    cache.length = pos + 1;
    layerNorm(this.x, this.get('ln_f.weight'), this.get('ln_f.bias'), ln_eps, this.h);
    matVec(wte, this.cfg.vocab_size, c, this.h, this.logits);
    return this.logits;
  }

  /** Feeds several tokens and returns the logits after the last one. */
  feed(tokens: number[], cache: KVCache): Float32Array {
    let logits = this.logits;
    for (const t of tokens) logits = this.step(t, cache);
    return logits;
  }

  private get(name: string): Float32Array {
    const found = this.w.get(name);
    if (!found) throw new Error(`missing tensor ${name}`);
    return found;
  }

  private attention(layer: number, pos: number, cache: KVCache): void {
    const { n_embd: c, n_head } = this.cfg;
    const hd = c / n_head;
    matVec(this.get(`blocks.${layer}.attn.qkv.weight`), 3 * c, c, this.h, this.qkv);
    const k = cache.k[layer] as Float32Array;
    const v = cache.v[layer] as Float32Array;
    for (let i = 0; i < c; i++) {
      k[pos * c + i] = this.qkv[c + i] as number;
      v[pos * c + i] = this.qkv[2 * c + i] as number;
    }
    const scale = 1 / Math.sqrt(hd);
    for (let head = 0; head < n_head; head++) {
      this.headAttention(head, hd, pos, k, v, scale);
    }
    matVec(this.get(`blocks.${layer}.attn.proj.weight`), c, c, this.att, this.proj);
  }

  private headAttention(
    head: number,
    hd: number,
    pos: number,
    k: Float32Array,
    v: Float32Array,
    scale: number,
  ): void {
    const c = this.cfg.n_embd;
    const off = head * hd;
    let max = -Infinity;
    for (let t = 0; t <= pos; t++) {
      let dot = 0;
      for (let d = 0; d < hd; d++) {
        dot += (this.qkv[off + d] as number) * (k[t * c + off + d] as number);
      }
      const s = dot * scale;
      this.scores[t] = s;
      if (s > max) max = s;
    }
    let sum = 0;
    for (let t = 0; t <= pos; t++) {
      const e = Math.exp((this.scores[t] as number) - max);
      this.scores[t] = e;
      sum += e;
    }
    for (let d = 0; d < hd; d++) {
      let acc = 0;
      for (let t = 0; t <= pos; t++) {
        acc += (this.scores[t] as number) * (v[t * c + off + d] as number);
      }
      this.att[off + d] = acc / sum;
    }
  }
}
