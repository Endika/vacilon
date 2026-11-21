import { nameKey } from './format';

export type Conjunction = 'and' | 'or';

const I_SOUND = /^h?i(?![aeiou])/;
const O_SOUND = /^h?o/;

function wordFor(conjunction: Conjunction, next: string): string {
  const key = nameKey(next);
  if (conjunction === 'and') return I_SOUND.test(key) ? 'e' : 'y';
  return O_SOUND.test(key) ? 'u' : 'o';
}

/** "A", "A y B", "A, B y C"; Spanish swaps the conjunction before a name that starts with its own sound. */
export function joinNames(names: readonly string[], conjunction: Conjunction): string {
  if (names.length <= 1) return names.join('');
  const head = names.slice(0, -1).join(', ');
  const last = names[names.length - 1];
  return `${head} ${wordFor(conjunction, last)} ${last}`;
}
