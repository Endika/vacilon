import { findKnown, type NameBook } from './book';
import { COMMON_WORDS, JOKE_NAMES } from './common-words';
import { capitalize, nameKey } from './format';
import type { Awaiting } from './transition';
import { isSafe, normalizeForFilter } from '../conversation/safety';

export type NameIntent =
  | { kind: 'present'; names: string[] }
  | { kind: 'unsafe' }
  | { kind: 'forgetMine' }
  | { kind: 'forgetAll' }
  | { kind: 'whoAmI' };

const MAX_NAME_WORDS = 2;
const MIN_WORD_LENGTH = 2;
const MAX_WORD_LENGTH = 20;

const FORGET_ALL = /\b(olvida|borra)\w* (todos )?(los )?nombres\b/;
const FORGET_MINE = /\b(olvida|borra)\w* (mi|mis) nombres?\b/;
const WHO_AM_I = /\b(como me llamo|quien soy)\b/;
const BOTH = /^(somos )?(las |los )?dos$/;
const EVERYONE = /^(somos )?(todas|todos)$/;

const INTRODUCTIONS = [
  { prefix: ['me', 'llamo'], needsContext: false },
  { prefix: ['mi', 'nombre', 'es'], needsContext: false },
  { prefix: ['ahora', 'soy'], needsContext: true },
  { prefix: ['soy'], needsContext: true },
];
const OPENERS = new Set(['hola', 'hey', 'buenas', 'pues', 'vale']);

function words(text: string): string[] {
  return text.match(/\p{L}+(?:['’-]\p{L}+)*/gu) ?? [];
}

function isNameLike(candidate: string[], text: string): boolean {
  const keys = candidate.map(nameKey);
  return (
    candidate.length >= 1 &&
    candidate.length <= MAX_NAME_WORDS &&
    !/\d/.test(text) &&
    candidate.every((word) => word.length >= MIN_WORD_LENGTH && word.length <= MAX_WORD_LENGTH) &&
    !keys.some((key) => key.split(' ').some((part) => COMMON_WORDS.has(part)))
  );
}

function startsWith(keys: string[], prefix: string[]): boolean {
  return prefix.every((word, i) => keys[i] === word);
}

function isAcceptable(name: string): boolean {
  return (
    isSafe(name) &&
    !nameKey(name)
      .split(' ')
      .some((part) => JOKE_NAMES.has(part))
  );
}

function asIntent(candidate: string[]): NameIntent {
  const name = capitalize(candidate.join(' '));
  return isAcceptable(name) ? { kind: 'present', names: [name] } : { kind: 'unsafe' };
}

function introduced(tokens: string[], book: NameBook, awaiting: Awaiting, text: string) {
  const keys = tokens.map(nameKey);
  const start = OPENERS.has(keys[0]) ? 1 : 0;
  const rest = keys.slice(start);
  for (const { prefix, needsContext } of INTRODUCTIONS) {
    if (!startsWith(rest, prefix)) continue;
    const candidate = tokens.slice(start + prefix.length);
    const allowed = !needsContext || awaiting !== 'none' || findKnown(book, candidate.join(' '));
    return allowed && isNameLike(candidate, text) ? asIntent(candidate) : null;
  }
  return null;
}

function bareName(tokens: string[], awaiting: Awaiting, text: string): NameIntent | null {
  return awaiting !== 'none' && isNameLike(tokens, text) ? asIntent(tokens) : null;
}

function choice(text: string, book: NameBook): NameIntent | null {
  const normalized = normalizeForFilter(text);
  if (book.known.length >= 2 && BOTH.test(normalized)) {
    return { kind: 'present', names: book.known.slice(0, 2) };
  }
  if (book.known.length >= 2 && EVERYONE.test(normalized)) {
    return { kind: 'present', names: [...book.known] };
  }
  const parts = text
    .split(/\s*,\s*|\s+[eyEY]\s+/)
    .map((part) => part.replace(/[¡!¿?.]/g, '').trim());
  if (parts.length < 2) return null;
  const names = parts.map((part) =>
    findKnown(book, nameKey(part).replace(/^(ahora soy|somos|soy) /, '')),
  );
  return names.every((name) => name !== undefined)
    ? { kind: 'present', names: names as string[] }
    : null;
}

/** Reads a message as something about names, or returns null so it follows its normal path. */
export function recognize(text: string, book: NameBook, awaiting: Awaiting): NameIntent | null {
  const normalized = normalizeForFilter(text);
  if (FORGET_ALL.test(normalized)) return { kind: 'forgetAll' };
  if (FORGET_MINE.test(normalized)) return { kind: 'forgetMine' };
  if (WHO_AM_I.test(normalized)) return { kind: 'whoAmI' };
  if (awaiting === 'who') {
    const chosen = choice(text, book);
    if (chosen) return chosen;
  }
  const tokens = words(text);
  return introduced(tokens, book, awaiting, text) ?? bareName(tokens, awaiting, text);
}
