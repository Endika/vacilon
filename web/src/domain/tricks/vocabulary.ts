import { normalizeForFilter } from '../conversation/safety';
import type { Language, Word } from './content/words';

const LANGUAGE_WORDS: Record<Language, string> = {
  en: 'ingles',
  eu: 'euskera|euskara|vasco',
};

export const LANGUAGE_PATTERN = Object.values(LANGUAGE_WORDS).join('|');

/** The language a normalized text names, or null. */
export function languageIn(normalized: string): Language | null {
  for (const [language, words] of Object.entries(LANGUAGE_WORDS) as [Language, string][]) {
    if (new RegExp(`\\b(${words})\\b`).test(normalized)) return language;
  }
  return null;
}

const LEADING = /^(?:(?:el|la|los|las|un|una|unos|unas|mi|la palabra|palabra)\s+)+/;

/** Drops articles in front of a normalized word. */
export const bare = (normalized: string): string => normalized.replace(LEADING, '');

/** Basque nouns carry the article `-a`; answers without it count too. */
const withoutArticle = (form: string): string[] =>
  form.length > 3 && form.endsWith('a') ? [form, form.slice(0, -1)] : [form];

export function spanishForms(word: Word): string[] {
  return word.es.map(normalizeForFilter);
}

export function foreignForms(word: Word, language: Language): string[] {
  if (language === 'eu') return word.eu.map(normalizeForFilter).flatMap(withoutArticle);
  const sounds = word.sounds ? [normalizeForFilter(word.sounds)] : [];
  return [...word.en.map(normalizeForFilter), ...sounds];
}

export interface Vocabulary {
  /** The word whose Spanish form is exactly this normalized text. */
  fromSpanish(normalized: string): Word | null;
  /** The word whose form in that language is exactly this normalized text. */
  fromForeign(normalized: string, language: Language): Word | null;
  /** Every normalized foreign form, longest first, for building patterns. */
  foreignWords(language: Language): string[];
}

function indexBy(words: readonly Word[], forms: (word: Word) => string[]): Map<string, Word> {
  const index = new Map<string, Word>();
  for (const word of words)
    for (const form of forms(word)) if (!index.has(form)) index.set(form, word);
  return index;
}

export function createVocabulary(words: readonly Word[]): Vocabulary {
  const spanish = indexBy(words, spanishForms);
  const foreign: Record<Language, Map<string, Word>> = {
    en: indexBy(words, (word) => word.en.map(normalizeForFilter)),
    eu: indexBy(words, (word) => word.eu.map(normalizeForFilter)),
  };
  return {
    fromSpanish: (normalized) => spanish.get(bare(normalized)) ?? null,
    fromForeign: (normalized, language) => foreign[language].get(bare(normalized)) ?? null,
    foreignWords: (language) => [...foreign[language].keys()].sort((a, b) => b.length - a.length),
  };
}

/** True when the answer names one of the forms as whole words. */
export const mentionsAny = (normalized: string, forms: readonly string[]): boolean =>
  forms.some((form) => new RegExp(`\\b${form}\\b`).test(normalized));
