import { normalizeForFilter } from '../conversation/safety';
import { calculate, parseCalculation, type Calculation } from '../tricks/calculation';

/** A question Chispa asked whose answer she knows how to read. */
export type Question =
  /** A sum she asked, with its exact result. */
  | { kind: 'sum'; calculation: Calculation; result: number }
  | { kind: 'color' }
  | { kind: 'number' }
  /** "¿Qué tal estás?": how the child feels. */
  | { kind: 'mood' }
  | { kind: 'animal' }
  /** `about`: what is named, as she wrote it ("tu perro"), or empty. */
  | { kind: 'name'; about: string }
  /** `about`: the thing ("comida"); `favourite`: "favorito" or "favorita". */
  | { kind: 'favourite'; about: string; favourite: string }
  /** The last word of each side of "¿rosa o azul?". */
  | { kind: 'choice'; options: [Option, Option] };

/** `key` is normalized for matching; `said` is how she wrote it. */
export interface Option {
  key: string;
  said: string;
}

const MAX_OPTION_WORDS = 3;

/** Every question in the reply, the last one first. */
function questionsIn(reply: string): string[] {
  return [...reply.matchAll(/¿([^¿?]+)\?/g)].map((match) => match[1].trim()).reverse();
}

function nameQuestion(question: string): Question | null {
  const match =
    /^(?:y )?c[oó]mo se llaman? ?(.*)$|^(?:y )?qu[eé] nombre (?:tiene|le pusiste|le has puesto) ?(.*)$/i.exec(
      question,
    );
  if (!match) return null;
  const about = (match[1] ?? match[2] ?? '').trim();
  return { kind: 'name', about: /^(tu|tus|su|sus)\s/i.test(about) ? about : '' };
}

function favouriteQuestion(question: string): Question | null {
  const match = /cu[aá]l es tu ((?:\p{L}+ ?){1,2}?) (favorit[oa])$/iu.exec(question);
  return match
    ? { kind: 'favourite', about: match[1].trim(), favourite: match[2].toLowerCase() }
    : null;
}

function optionOf(word: string | undefined): Option | null {
  const said = word?.replace(/[^\p{L}\p{N}]/gu, '') ?? '';
  return said ? { key: normalizeForFilter(said), said: said.toLowerCase() } : null;
}

function choiceQuestion(question: string): Question | null {
  const sides = question.split(/\s+o\s+/i);
  if (sides.length !== 2) return null;
  const rightWords = sides[1].trim().split(/\s+/);
  const left = optionOf(sides[0].trim().split(/\s+/).at(-1));
  const right = optionOf(rightWords.at(-1));
  if (!left || !right || left.key === right.key || rightWords.length > MAX_OPTION_WORDS)
    return null;
  return { kind: 'choice', options: [left, right] };
}

function sumQuestion(question: string): Question | null {
  const calculation = parseCalculation(question);
  if (!calculation) return null;
  const outcome = calculate(calculation);
  return outcome.kind === 'exact' ? { kind: 'sum', calculation, result: outcome.value } : null;
}

const MOOD_TAIL = '(?: (?:hoy|el dia|tu dia|el cole|el colegio|la escuela|por ahi|esta tarde))*';
const MOOD_QUESTION = new RegExp(
  `^(?:y )?(?:tu )?(?:que tal(?: estas| te encuentras| te sientes| te va| te ha ido)?|como (?:estas|te encuentras|te sientes|te ha ido|te va|andas))${MOOD_TAIL}$`,
);

function classifyOne(question: string): Question | null {
  const normalized = normalizeForFilter(question);
  if (MOOD_QUESTION.test(normalized)) return { kind: 'mood' };
  const sum = sumQuestion(question);
  if (sum) return sum;
  const named = nameQuestion(question);
  if (named) return named;
  const favourite = favouriteQuestion(question);
  if (favourite) return favourite;
  if (/\b(de )?que color\b/.test(normalized)) return { kind: 'color' };
  if (/\bque (animal|mascota)\b/.test(normalized)) return { kind: 'animal' };
  if (/\bcuant(o|a|os|as)\b/.test(normalized)) return { kind: 'number' };
  return choiceQuestion(question);
}

/** The questions in her reply she can follow, the last one first. */
export function classify(reply: string): Question[] {
  return questionsIn(reply).flatMap((question) => classifyOne(question) ?? []);
}
