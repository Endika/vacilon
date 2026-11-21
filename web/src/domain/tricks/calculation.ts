import { normalizeForFilter } from '../conversation/safety';
import { parseNumberWords } from './number-words';

export type Operator = 'plus' | 'minus' | 'times' | 'divided';

export interface Calculation {
  left: number;
  operator: Operator;
  right: number;
}

export type Outcome =
  | { kind: 'exact'; value: number }
  | { kind: 'remainder'; quotient: number; remainder: number }
  | { kind: 'negative' }
  | { kind: 'by-zero' }
  | { kind: 'too-big' };

/** Results above this are not read out: no child is checking them and they sound like noise. */
export const BIGGEST = 100_000;
const LONGEST_NUMBER_IN_WORDS = 5;

const OPERATORS: Record<string, Operator> = {
  mas: 'plus',
  menos: 'minus',
  por: 'times',
  veces: 'times',
  x: 'times',
  entre: 'divided',
};

/** Symbols and multi-word operators become one operator word before the usual normalization. */
function canonical(text: string): string {
  const spelled = text
    .toLowerCase()
    .replace(/×|\*/g, ' por ')
    .replace(/÷|\//g, ' entre ')
    .replace(/\+/g, ' mas ')
    .replace(/(\d)\s*-\s*(\d)/g, '$1 menos $2')
    .replace(/(\d)\s*x\s*(\d)/g, '$1 por $2')
    .replace(/=/g, ' igual a ');
  return normalizeForFilter(spelled)
    .replace(/\bmultiplicado por\b/g, 'por')
    .replace(/\b(dividido|partido) (entre|por|para)\b/g, 'entre');
}

function numberAt(tokens: string[], start: number, end: number): number | null {
  if (start < 0 || end > tokens.length || start >= end) return null;
  const run = tokens.slice(start, end);
  if (run.length === 1 && /^\d+$/.test(run[0])) return Number(run[0]);
  if (run[0] === 'y' || run.some((token) => /\d/.test(token))) return null;
  return parseNumberWords(run);
}

/** The longest number that ends just before `end`. */
function numberEndingAt(tokens: string[], end: number): number | null {
  for (let start = Math.max(0, end - LONGEST_NUMBER_IN_WORDS); start < end; start++) {
    const value = numberAt(tokens, start, end);
    if (value !== null) return value;
  }
  return null;
}

/** The longest number that starts at `start`, with where it ends. */
function numberStartingAt(tokens: string[], start: number): { value: number; end: number } | null {
  for (let end = Math.min(tokens.length, start + LONGEST_NUMBER_IN_WORDS); end > start; end--) {
    const value = numberAt(tokens, start, end);
    if (value !== null) return { value, end };
  }
  return null;
}

const RESULT_WORDS = new Set(['son', 'es', 'da', 'dan', 'igual']);

/** "3 más 4 son 7" is an answer being given, not a question. */
function givesResult(tokens: string[], from: number): boolean {
  if (!RESULT_WORDS.has(tokens[from])) return false;
  const next = tokens[from + 1] === 'a' ? from + 2 : from + 1;
  return numberStartingAt(tokens, next) !== null;
}

/** The first "number operator number" in the message, unless the message already gives the result. */
export function parseCalculation(text: string): Calculation | null {
  const tokens = canonical(text).split(' ');
  for (let i = 1; i < tokens.length - 1; i++) {
    const operator = OPERATORS[tokens[i]];
    if (!operator) continue;
    const left = numberEndingAt(tokens, i);
    const right = numberStartingAt(tokens, i + 1);
    if (left === null || right === null) continue;
    if (givesResult(tokens, right.end)) return null;
    return { left, operator, right: right.value };
  }
  return null;
}

export function calculate({ left, operator, right }: Calculation): Outcome {
  if (operator === 'divided') {
    if (right === 0) return { kind: 'by-zero' };
    const quotient = Math.floor(left / right);
    const remainder = left % right;
    return remainder === 0
      ? { kind: 'exact', value: quotient }
      : { kind: 'remainder', quotient, remainder };
  }
  const value =
    operator === 'plus' ? left + right : operator === 'minus' ? left - right : left * right;
  if (value < 0) return { kind: 'negative' };
  if (value > BIGGEST) return { kind: 'too-big' };
  return { kind: 'exact', value };
}
