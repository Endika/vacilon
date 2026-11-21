import type { Rng } from '../random';
import { matchIntent } from '../conversation/guardrails';
import { normalizeForFilter } from '../conversation/safety';
import { createColorQuiz } from './color-quiz';
import { createColors } from './colors';
import { createDance } from './dance';
import { createFact } from './fact';
import { createJoke } from './joke';
import { createLanguageQuiz } from './language-quiz';
import { createLanguages } from './languages';
import { createMathProblem } from './math-problem';
import { createMorse } from './morse';
import { createRiddle } from './riddle';
import { createSing } from './sing';
import type { Trick } from './types';

export function createTricks(rng: Rng, names: () => readonly string[] = () => []): Trick[] {
  return [
    createJoke(rng),
    createDance(rng),
    createSing(rng),
    createRiddle(rng, names),
    createMathProblem(rng, names),
    createFact(rng),
    createColors(rng),
    createColorQuiz(rng, names),
    createMorse(rng, names),
    createLanguages(rng),
    createLanguageQuiz(rng, names),
  ];
}

export function matchTrick(text: string, tricks: Trick[]): Trick | null {
  if (matchIntent(text)) return null;
  const normalized = normalizeForFilter(text);
  return tricks.find((trick) => trick.triggers.some((t) => t.test(normalized))) ?? null;
}
