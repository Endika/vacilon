import { normalizeForFilter } from '../conversation/safety';
import { randomNoRepeat, type Rng } from '../random';
import {
  LANGUAGE_NAMES,
  SAY_MEANING,
  SAY_SOUNDS,
  SAY_WORD,
  WORD_HOOKS,
  WORD_UNKNOWN,
  WORDS,
  type Language,
  type Word,
} from './content/words';
import { fill } from './template';
import type { Trick } from './types';
import { bare, createVocabulary, LANGUAGE_PATTERN, languageIn } from './vocabulary';

const LANG = `(${LANGUAGE_PATTERN})`;
const SPANISH = '(?:castellano|espanyol)';
const ASK = '(?:como se (?:dice|escribe)|como (?:digo|es)|que es|dime|di|traduceme|traduce)';

const WORD_THEN_LANGUAGE = new RegExp(`\\b${ASK}\\s+(.+?)\\s+en (?:el )?${LANG}\\b`);
const LANGUAGE_THEN_WORD = new RegExp(`\\b${ASK}\\s+en (?:el )?${LANG}\\s+(.+)$`);

export const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

/** The Spanish word and language asked for, both normalized, or null. */
function toForeignRequest(normalized: string): { asked: string; language: Language } | null {
  const after = WORD_THEN_LANGUAGE.exec(normalized);
  const before = after ? null : LANGUAGE_THEN_WORD.exec(normalized);
  const asked = after?.[1] ?? before?.[2];
  const language = languageIn(after?.[2] ?? before?.[1] ?? '');
  return asked && language ? { asked, language } : null;
}

/** `es` is the Spanish form to repeat, when it was asked for in a particular one. */
export function sayWord(word: Word, language: Language, template: string, es = word.es[0]): string {
  const values = {
    es,
    Es: capitalize(es),
    word: word[language][0],
    lang: LANGUAGE_NAMES[language],
  };
  const extra =
    language === 'en' ? word.sounds && fill(SAY_SOUNDS, { sounds: word.sounds }) : word.euNote;
  return [fill(template, values), extra].filter(Boolean).join(' ');
}

export function createLanguages(rng: Rng): Trick {
  const vocabulary = createVocabulary(WORDS);
  const template = randomNoRepeat(SAY_WORD, rng);
  const hook = randomNoRepeat(WORD_HOOKS, rng);
  const unknown = randomNoRepeat(WORD_UNKNOWN, rng);

  const foreign = (['en', 'eu'] as const).flatMap((l) => vocabulary.foreignWords(l)).join('|');
  const MEANING = new RegExp(`\\bque (?:significa|quiere decir) (${foreign})(?: en ${LANG})?$`);
  const BACK = new RegExp(`\\b(?:como se dice|que es) (${foreign}) en ${SPANISH}\\b`);

  function meaning(normalized: string): string | null {
    const match = MEANING.exec(normalized) ?? BACK.exec(normalized);
    if (!match) return null;
    const named = languageIn(match[2] ?? '');
    const order: Language[] = named ? [named] : ['en', 'eu'];
    for (const language of order) {
      const word = vocabulary.fromForeign(match[1], language);
      if (!word) continue;
      const values = {
        Word: capitalize(word[language][0]),
        es: word.es[0],
        lang: LANGUAGE_NAMES[language],
      };
      return `${fill(SAY_MEANING, values)} ${hook()}`;
    }
    return null;
  }

  function reply(text: string): string {
    const normalized = normalizeForFilter(text);
    const back = meaning(normalized);
    if (back) return back;
    const request = toForeignRequest(normalized);
    const word = request && vocabulary.fromSpanish(request.asked);
    if (!request || !word) return unknown();
    const asked = word.es.find((form) => normalizeForFilter(form) === bare(request.asked));
    return `${sayWord(word, request.language, template(), asked)} ${hook()}`;
  }

  return {
    id: 'languages',
    triggers: [WORD_THEN_LANGUAGE, LANGUAGE_THEN_WORD, MEANING, BACK],
    async run(stage, text) {
      await stage.say(reply(text));
      return null;
    },
  };
}
