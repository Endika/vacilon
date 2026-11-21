import { nameKey } from './format';

export const MAX_NAMES = 6;

/** `known` goes from the most to the least recently used; `current` are the names talking now. */
export interface NameBook {
  readonly known: readonly string[];
  readonly current: readonly string[];
}

export const EMPTY_BOOK: NameBook = { known: [], current: [] };

function unique(names: readonly string[]): string[] {
  const seen = new Set<string>();
  return names.filter((name) => {
    const key = nameKey(name);
    if (key === '' || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function bookFrom(stored: readonly string[]): NameBook {
  return { known: unique(stored).slice(0, MAX_NAMES), current: [] };
}

export function findKnown(book: NameBook, name: string): string | undefined {
  const key = nameKey(name);
  return book.known.find((known) => nameKey(known) === key);
}

export function isKnown(book: NameBook, name: string): boolean {
  return findKnown(book, name) !== undefined;
}

/** Puts the names first (most recent), keeps the rest in order and drops the least recently used beyond the cap. */
export function use(book: NameBook, names: readonly string[]): NameBook {
  const current = unique(names.map((name) => findKnown(book, name) ?? name));
  const known = unique([...current, ...book.known]).slice(0, MAX_NAMES);
  return { known, current: current.filter((name) => isKnown({ known, current: [] }, name)) };
}

export function forgetCurrent(book: NameBook): NameBook {
  const forgotten = new Set(book.current.map(nameKey));
  return { known: book.known.filter((name) => !forgotten.has(nameKey(name))), current: [] };
}

export function forgetAll(): NameBook {
  return EMPTY_BOOK;
}
