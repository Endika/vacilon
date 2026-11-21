import { normalizeForFilter } from '../conversation/safety';

export function nameKey(name: string): string {
  return normalizeForFilter(name);
}

export function capitalize(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(
      /(^|[\s'’-])(\p{L})/gu,
      (_, separator: string, letter: string) => separator + letter.toUpperCase(),
    );
}
