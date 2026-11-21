import config from './memory-config.json';
import { normalizeForFilter } from '../conversation/safety';
import type { Rng } from '../random';
import { respell, standardVocabulary, type Vocabulary } from './spelling';

export type Pair = [message: string, reply: string];

export const THRESHOLD = config.threshold;
export const TIE_MARGIN = config.tieMargin;
const NGRAM = config.ngram;
const STOPWORDS = new Set<string>([...config.stopwords, ...config.fillers]);
const ALIASES: Readonly<Record<string, string>> = config.aliases;
const KEEP = new Set<string>(config.keep);

type Vector = Map<string, number>;

function tokens(text: string): string[] {
  return normalizeForFilter(text)
    .split(' ')
    .filter((w) => w !== '');
}

/** Content words plus character n-grams of each word, padded with underscores. */
export function features(text: string, vocabulary: Vocabulary = new Set()): Vector {
  const words = tokens(text)
    .map((w) => respell(w, vocabulary, ALIASES))
    .filter((w) => !STOPWORDS.has(w));
  const counts: Vector = new Map();
  const add = (key: string): void => void counts.set(key, (counts.get(key) ?? 0) + 1);
  for (const word of words) {
    add(word);
    const padded = `_${word}_`;
    for (let i = 0; i <= padded.length - NGRAM; i++) add(padded.slice(i, i + NGRAM));
  }
  return counts;
}

function unit(weights: Vector): Vector {
  let sum = 0;
  for (const w of weights.values()) sum += w * w;
  const norm = Math.sqrt(sum) || 1;
  return new Map([...weights].map(([k, w]) => [k, w / norm]));
}

/** Corpus replies retrievable by TF-IDF cosine similarity to the corpus messages. */
export class Memory {
  private readonly replies: string[];
  private readonly idf = new Map<string, number>();
  private readonly unknownIdf: number;
  private readonly postings = new Map<string, [number, number][]>();
  private readonly vocabulary: Set<string>;

  constructor(pairs: readonly Pair[] = []) {
    this.replies = pairs.map(([, reply]) => reply);
    this.vocabulary = standardVocabulary(
      pairs.flatMap(([message]) => tokens(message)),
      ALIASES,
      KEEP,
    );
    const docs = pairs.map(([message]) => features(message, this.vocabulary));
    const frequency = new Map<string, number>();
    for (const doc of docs)
      for (const k of doc.keys()) frequency.set(k, (frequency.get(k) ?? 0) + 1);
    for (const [k, df] of frequency) this.idf.set(k, Math.log(docs.length / df));
    this.unknownIdf = docs.length ? Math.log(docs.length) : 0;
    docs.forEach((doc, index) => {
      for (const [k, w] of unit(this.weigh(doc))) {
        const list = this.postings.get(k) ?? [];
        list.push([index, w]);
        this.postings.set(k, list);
      }
    });
  }

  private weigh(counts: Vector): Vector {
    return new Map([...counts].map(([k, c]) => [k, c * (this.idf.get(k) ?? this.unknownIdf)]));
  }

  private scores(message: string): Map<number, number> {
    const scores = new Map<number, number>();
    for (const [k, qw] of unit(this.weigh(features(message, this.vocabulary)))) {
      for (const [index, w] of this.postings.get(k) ?? []) {
        scores.set(index, (scores.get(index) ?? 0) + qw * w);
      }
    }
    return scores;
  }

  /** Best cosine and the distinct replies within TIE_MARGIN of it, in corpus order. */
  lookup(message: string): { best: number; candidates: string[] } {
    const scores = this.scores(message);
    if (scores.size === 0) return { best: 0, candidates: [] };
    const best = Math.max(...scores.values());
    const near = [...scores].filter(([, s]) => s >= best - TIE_MARGIN).map(([i]) => i);
    near.sort((a, b) => a - b);
    return { best, candidates: [...new Set(near.map((i) => this.replies[i]))] };
  }

  recall(message: string, recent: readonly string[], rng: Rng): string | null {
    const { best, candidates } = this.lookup(message);
    if (best < THRESHOLD) return null;
    const fresh = candidates.filter((r) => !recent.includes(r));
    const pool = fresh.length ? fresh : candidates;
    return pool[Math.floor(rng() * pool.length)];
  }
}
