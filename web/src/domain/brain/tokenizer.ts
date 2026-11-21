export interface TokenizerJson {
  added_tokens: { id: number; content: string }[];
  model: { vocab: Record<string, number>; merges: [string, string][] | string[] };
}

const PRE_TOKENIZE = /'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu;

function buildByteToChar(): string[] {
  const keep: number[] = [];
  for (let b = 33; b <= 126; b++) keep.push(b);
  for (let b = 161; b <= 172; b++) keep.push(b);
  for (let b = 174; b <= 255; b++) keep.push(b);
  const table: string[] = new Array<string>(256);
  let extra = 0;
  for (let b = 0; b < 256; b++) {
    table[b] = String.fromCodePoint(keep.includes(b) ? b : 256 + extra++);
  }
  return table;
}

const BYTE_TO_CHAR = buildByteToChar();
const CHAR_TO_BYTE = new Map(BYTE_TO_CHAR.map((c, b) => [c, b]));
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8');

export class Tokenizer {
  private readonly vocab: Map<string, number>;
  private readonly tokens: string[] = [];
  private readonly ranks = new Map<string, number>();
  private readonly specials: string[];
  private readonly specialSplit: RegExp | null;
  private readonly cache = new Map<string, number[]>();

  constructor(json: TokenizerJson) {
    this.vocab = new Map(Object.entries(json.model.vocab));
    for (const [token, id] of this.vocab) this.tokens[id] = token;
    for (const { id, content } of json.added_tokens) {
      this.vocab.set(content, id);
      this.tokens[id] = content;
    }
    json.model.merges.forEach((merge, rank) => {
      const [a, b] = typeof merge === 'string' ? merge.split(' ') : merge;
      this.ranks.set(`${a} ${b}`, rank);
    });
    this.specials = json.added_tokens.map((t) => t.content);
    this.specialSplit = this.specials.length
      ? new RegExp(
          `(${[...this.specials]
            .sort((a, b) => b.length - a.length)
            .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('|')})`,
        )
      : null;
  }

  get vocabSize(): number {
    return this.tokens.length;
  }

  tokenId(token: string): number {
    const id = this.vocab.get(token);
    if (id === undefined) throw new Error(`unknown token ${token}`);
    return id;
  }

  encode(text: string): number[] {
    const ids: number[] = [];
    const parts = this.specialSplit ? text.split(this.specialSplit) : [text];
    for (const part of parts) {
      if (part === '') continue;
      const special = this.vocab.get(part);
      if (special !== undefined && this.specials.includes(part)) ids.push(special);
      else this.encodePlain(part.normalize('NFC'), ids);
    }
    return ids;
  }

  decode(ids: number[]): string {
    const bytes: number[] = [];
    for (const id of ids) {
      for (const ch of this.tokens[id] ?? '') {
        const b = CHAR_TO_BYTE.get(ch);
        if (b !== undefined) bytes.push(b);
        else bytes.push(...encoder.encode(ch));
      }
    }
    return decoder.decode(Uint8Array.from(bytes));
  }

  private encodePlain(text: string, out: number[]): void {
    for (const match of text.matchAll(PRE_TOKENIZE)) {
      out.push(...this.encodeWord(match[0]));
    }
  }

  private encodeWord(word: string): number[] {
    const cached = this.cache.get(word);
    if (cached) return cached;
    const symbols = Array.from(encoder.encode(word), (b) => BYTE_TO_CHAR[b] as string);
    const ids = this.merge(symbols).map((s) => this.tokenId(s));
    this.cache.set(word, ids);
    return ids;
  }

  private merge(symbols: string[]): string[] {
    for (;;) {
      let best = -1;
      let bestRank = Infinity;
      for (let i = 0; i < symbols.length - 1; i++) {
        const rank = this.ranks.get(`${symbols[i]} ${symbols[i + 1]}`);
        if (rank !== undefined && rank < bestRank) {
          bestRank = rank;
          best = i;
        }
      }
      if (best < 0) return symbols;
      symbols.splice(best, 2, (symbols[best] as string) + (symbols[best + 1] as string));
    }
  }
}
