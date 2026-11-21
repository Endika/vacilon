import { isSafe, normalizeForFilter } from '../conversation/safety';
import { COMMON_WORDS } from '../names/common-words';
import { capitalize } from '../names/format';
import { COLORS } from '../tricks/content/colors';
import { findNumber } from '../tricks/number-words';
import { ANIMALS } from './content';
import { toSecondPerson } from './person';
import type { Option, Question } from './question';

/** What she understood from the answer, ready to be said back. */
export type Answer =
  | { kind: 'sum'; value: number }
  | { kind: 'color'; color: string }
  | { kind: 'number'; value: number }
  | { kind: 'animal'; withArticle: string }
  | { kind: 'name'; name: string }
  | { kind: 'favourite'; value: string }
  | { kind: 'choice'; option: string }
  | { kind: 'mood'; mood: Mood }
  /** `echo`: what was said, in second person, or null when it cannot be repeated. */
  | { kind: 'open'; echo: string | null }
  | { kind: 'dontknow' };

export type Mood = 'good' | 'soso' | 'bad' | 'tired';

const MAX_FREE_WORDS = 4;
const MAX_FREE_LENGTH = 30;
const FILLERS = new Set([
  'el',
  'la',
  'los',
  'las',
  'un',
  'una',
  'mi',
  'mis',
  'pues',
  'es',
  'son',
  'me',
  'gusta',
  'gustan',
  'mas',
  'mucho',
  'chispa',
  'creo',
  'que',
  'se',
  'llama',
  'llaman',
  'le',
  'llamo',
  'llamamos',
]);

/** In "7 menos 4 son 3" the answer is what comes after "son". */
function resultPart(normalized: string): string {
  return /\b(?:son|es|da|dan|igual)\b(.*)$/.exec(normalized)?.[1] ?? normalized;
}

const words = (normalized: string): string[] => normalized.split(' ').filter(Boolean);

function readColor(normalized: string): Answer | null {
  const said = new Set(words(normalized));
  const found = Object.values(COLORS).filter((color) => color.words.some((w) => said.has(w)));
  return found.length === 1 ? { kind: 'color', color: found[0].name } : null;
}

function readAnimal(normalized: string): Answer | null {
  const said = new Set(words(normalized));
  const found = ANIMALS.filter((animal) => animal.words.some((w) => said.has(w)));
  return found.length === 1 ? { kind: 'animal', withArticle: found[0].withArticle } : null;
}

/** The words of the answer after leading fillers ("pues se llama", "la de"), as typed. */
function core(text: string): string[] {
  const typed = text
    .replace(/[¡!¿?.,;:"«»]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  let start = 0;
  while (start < typed.length && FILLERS.has(normalizeForFilter(typed[start]))) start++;
  return typed.slice(start);
}

function readName(text: string): Answer | null {
  const rest = core(text);
  if (rest.length === 0 || rest.length > 2) return null;
  const name = rest.join(' ');
  if (!isSafe(name) || rest.some((w) => COMMON_WORDS.has(normalizeForFilter(w)))) return null;
  if (!/^\p{L}[\p{L}' -]*$/u.test(name)) return null;
  return { kind: 'name', name: capitalize(name) };
}

function readFree(text: string): Answer | null {
  const rest = core(text);
  const value = rest.join(' ');
  if (rest.length === 0 || rest.length > MAX_FREE_WORDS || value.length > MAX_FREE_LENGTH)
    return null;
  if (!isSafe(value) || !/\p{L}/u.test(value)) return null;
  return { kind: 'favourite', value: value.toLowerCase() };
}

function readChoice(normalized: string, options: [Option, Option]): Answer | null {
  const said = new Set(words(normalized));
  const picked = options.filter((option) => said.has(option.key));
  return picked.length === 1 ? { kind: 'choice', option: picked[0].said } : null;
}

const NOT_GOOD = /\b(?:no|nada)(?: \w+){0,2} (?:bien|genial|feliz|contenta|contento|guay|super)\b/;
const MOODS: [Mood, RegExp][] = [
  [
    'bad',
    /\b(?:mal|malo|mala|triste|enfadad[oa]|enfadadisim[oa]|fatal|aburrid[oa]|fastidiad[oa]|pena)\b/,
  ],
  ['tired', /\b(?:cansad[oa]|cansadisim[oa]|agotad[oa]|sueny?o|dormir)\b|\bsin energia\b/],
  ['soso', /\b(?:regular|normal|normalito|asi asi|mas o menos|regulero)\b/],
  [
    'good',
    /\b(?:bien|bienn+|genial|super|feliz|contenta|contento|guay|fenomenal|estupendo|estupenda|alegre|chachi|fenomenal|de maravilla|muy bien)\b/,
  ],
];

function readMood(normalized: string): Answer | null {
  if (NOT_GOOD.test(normalized)) return { kind: 'mood', mood: 'bad' };
  if (/\bno (?:\w+ )?mal\b/.test(normalized)) return { kind: 'mood', mood: 'soso' };
  const found = MOODS.find(([, pattern]) => pattern.test(normalized));
  return found ? { kind: 'mood', mood: found[0] } : null;
}

const MAX_OPEN_WORDS = 5;
const MAX_OPEN_LENGTH = 40;
const DONT_KNOW = /^(?:pues |eh )?(?:no (?:lo )?se|ni idea|no me acuerdo|yo que se)\b/;

function readOpen(text: string, normalized: string): Answer | null {
  if (DONT_KNOW.test(normalized)) return { kind: 'dontknow' };
  const typed = text
    .replace(/[¡!¿?.,;:"«»]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const said = typed.join(' ');
  if (typed.length === 0 || typed.length > MAX_OPEN_WORDS || said.length > MAX_OPEN_LENGTH)
    return null;
  if (!isSafe(said) || !/\p{L}/u.test(said)) return null;
  return { kind: 'open', echo: toSecondPerson(typed) };
}

/** Reads the answer to her question, or null when it is not one. */
export function readAnswer(question: Question, text: string): Answer | null {
  const normalized = normalizeForFilter(text);
  switch (question.kind) {
    case 'color':
      return readColor(normalized);
    case 'animal':
      return readAnimal(normalized);
    case 'number': {
      const value = findNumber(normalized);
      return value === null ? null : { kind: 'number', value };
    }
    case 'sum': {
      const value = findNumber(resultPart(normalized));
      return value === null ? null : { kind: 'sum', value };
    }
    case 'name':
      return readName(text);
    case 'favourite':
      return readFree(text);
    case 'choice':
      return readChoice(normalized, question.options);
    case 'mood':
      return readMood(normalized);
    case 'open':
      return readOpen(text, normalized);
  }
}
