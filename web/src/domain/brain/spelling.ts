/**
 * Kid spelling: map a word the corpus never uses to one it does ("muxo" -> "mucho").
 *
 * A word the corpus already knows is never touched, so deliberate spellings with their own
 * replies ("holaaa", "ola") keep them.
 */

export interface Vocabulary {
  has(word: string): boolean;
}

type Rewrite = (word: string) => string;

const MIN_SQUEEZED = 4;

const squeezeLongRuns: Rewrite = (word) => word.replace(/(.)\1{2,}/g, '$1');

const squeezeFinalVowels: Rewrite = (word) => {
  const squeezed = word.replace(/([aeiou])\1+$/, '$1');
  return squeezed.length >= MIN_SQUEEZED ? squeezed : word;
};

const xAsCh: Rewrite = (word) => word.replaceAll('x', 'ch');

const kAsQuOrC: Rewrite = (word) => word.replace(/k(?=[ei])/g, 'qu').replaceAll('k', 'c');

const dropSuperlative: Rewrite = (word) => word.replace(/isim([oa]s?)$/, '$1');

const dropDiminutive: Rewrite = (word) => word.replace(/(?:it|ill)([oa]s?)$/, '$1');

const REWRITES: readonly Rewrite[] = [
  squeezeLongRuns,
  squeezeFinalVowels,
  xAsCh,
  kAsQuOrC,
  dropSuperlative,
  dropDiminutive,
];

/** The first known form reached via the alias table or the stacked rewrites, else the word. */
export function respell(
  word: string,
  vocabulary: Vocabulary,
  aliases: Readonly<Record<string, string>>,
): string {
  if (vocabulary.has(word)) return word;
  if (Object.hasOwn(aliases, word)) return aliases[word];
  let current = word;
  for (const rewrite of REWRITES) {
    current = rewrite(current);
    if (vocabulary.has(current)) return current;
  }
  return word;
}

/** The words that are not a kid spelling of another word in the same set. */
export function standardVocabulary(
  words: Iterable<string>,
  aliases: Readonly<Record<string, string>>,
  keep: ReadonlySet<string>,
): Set<string> {
  const known = new Set(words);
  const others = (word: string): Vocabulary => ({
    has: (other) => other !== word && known.has(other),
  });
  return new Set([...known].filter((w) => keep.has(w) || respell(w, others(w), aliases) === w));
}
