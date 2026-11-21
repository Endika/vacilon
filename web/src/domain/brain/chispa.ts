import { GPT, type KVCache, type Manifest } from './model';
import { fixedReply } from '../conversation/guardrails';
import { Memory } from './memory';
import { mulberry32, type Rng } from '../random';
import { penalize, sampleNext, type SampleOptions } from './sampler';
import { Tokenizer, type TokenizerJson } from './tokenizer';

export const RETRIES = 4;
export const HISTORY = 5;

const USER = '<u>';
const BOT = '<b>';
const EOS_ID = 3;

export type Generator = (message: string, onToken?: TokenCallback) => string;
export type TokenCallback = (info: { text: string; count: number }) => void;

export interface ChispaOptions extends SampleOptions {
  maxNewTokens: number;
  repetitionPenalty: number;
  noRepeatNgram: number;
  seed?: number;
  rng?: Rng;
  generator?: Generator;
  memory?: Memory;
}

export const DEFAULT_OPTIONS: ChispaOptions = {
  temperature: 0.5,
  topK: 20,
  topP: 0,
  maxNewTokens: 60,
  repetitionPenalty: 1.3,
  noRepeatNgram: 3,
};

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export class Chispa {
  private readonly opts: ChispaOptions;
  private readonly rng: Rng;
  private readonly generator: Generator;
  private readonly memory: Memory;
  private readonly recent: string[] = [];

  constructor(
    private readonly model: GPT | null,
    private readonly tokenizer: Tokenizer | null,
    options: Partial<ChispaOptions> = {},
  ) {
    this.opts = { ...DEFAULT_OPTIONS, ...options };
    this.rng = this.opts.rng ?? mulberry32(this.opts.seed ?? Date.now());
    this.memory = this.opts.memory ?? new Memory();
    this.generator = this.opts.generator ?? ((m, cb) => this.generate(m, cb));
  }

  static fromBuffers(
    manifest: Manifest,
    weights: ArrayBuffer,
    tokenizer: TokenizerJson,
    options: Partial<ChispaOptions> = {},
  ): Chispa {
    return new Chispa(GPT.fromBuffers(manifest, weights), new Tokenizer(tokenizer), options);
  }

  reply(message: string, onToken?: TokenCallback): string {
    const fixed = fixedReply(message, this.rng);
    if (fixed !== null) return fixed;
    const remembered = this.memory.recall(message, this.recent, this.rng);
    if (remembered !== null) return this.remember(remembered);
    const key = normalize(message);
    let answer = '';
    for (let attempt = 0; attempt <= RETRIES; attempt++) {
      answer = this.generator(message, onToken);
      if (this.acceptable(key, answer)) break;
    }
    return this.remember(answer);
  }

  private remember(answer: string): string {
    this.recent.push(answer);
    if (this.recent.length > HISTORY) this.recent.shift();
    return answer;
  }

  private acceptable(messageKey: string, answer: string): boolean {
    const key = normalize(answer);
    return key !== '' && key !== messageKey && !this.recent.some((r) => normalize(r) === key);
  }

  private generate(message: string, onToken?: TokenCallback): string {
    const model = this.model as GPT;
    const tokenizer = this.tokenizer as Tokenizer;
    const block = model.cfg.block_size;
    const ids = tokenizer.encode(`${USER}${message}${BOT}`);
    const out: number[] = [];
    let cache = model.newCache();
    let logits = model.feed(ids.slice(-block), cache);
    for (let n = 0; n < this.opts.maxNewTokens; n++) {
      const adjusted = penalize(logits, out, this.opts.repetitionPenalty, this.opts.noRepeatNgram);
      const token = sampleNext(adjusted, this.rng, this.opts);
      if (token === EOS_ID) break;
      ids.push(token);
      out.push(token);
      onToken?.({ text: tokenizer.decode(out), count: out.length });
      [cache, logits] = this.advance(model, cache, ids, token, block);
    }
    return tokenizer.decode(out).trim();
  }

  private advance(
    model: GPT,
    cache: KVCache,
    ids: number[],
    token: number,
    block: number,
  ): [KVCache, Float32Array] {
    if (cache.length < block) return [cache, model.step(token, cache)];
    const fresh = model.newCache();
    return [fresh, model.feed(ids.slice(-block), fresh)];
  }
}
