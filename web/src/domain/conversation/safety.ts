import blocklist from './blocklist.json';

export function normalizeForFilter(text: string): string {
  return text
    .toLowerCase()
    .replace(/ñ/g, 'ny')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const BANNED = new Set<string>(blocklist);

export function isSafe(text: string): boolean {
  return !normalizeForFilter(text)
    .split(' ')
    .some((word) => BANNED.has(word));
}
