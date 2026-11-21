import { randomNoRepeat, type Rng } from '../random';
import { createAnswering, offerAnother, type Challenge } from './challenge';
import { PROBLEM_HARDER, PROBLEM_HOOKS, PROBLEM_INTROS, streakLine } from './content/problems';
import { findNumber } from './number-words';
import { generateProblem, levelFor, type Level, type Problem } from './problem';
import type { FollowUp, Stage, Trick } from './types';

const SUBJECT = '(problemas?|sumas?|restas?)';
const REQUEST = '(hazme|haz|ponme|pon|dame|dime|quiero|quieres|puedes|me haces|me pones|me das)';

export function createMathProblem(
  rng: Rng,
  names: () => readonly string[] = () => [],
  generate: (level: Level, rng: Rng) => Problem = generateProblem,
): Trick {
  const answering = createAnswering(rng);
  const intro = randomNoRepeat(PROBLEM_INTROS, rng);
  const another = randomNoRepeat(PROBLEM_HOOKS, rng);
  let streak = 0;

  const challengeFor = (problem: Problem): Challenge => ({
    judge(normalized) {
      const said = findNumber(normalized);
      if (said === null) return 'unclear';
      return said === problem.answer ? 'right' : 'wrong';
    },
    hint: problem.hint,
    async right(stage) {
      const before = levelFor(streak);
      streak += 1;
      const hook = levelFor(streak) > before ? PROBLEM_HARDER : another();
      const tail = [streak >= 2 ? streakLine(streak) : '', hook].filter(Boolean).join(' ');
      await stage.say(answering.cheer(names(), tail));
      return offerAnother(ask);
    },
    async reveal(stage) {
      streak = 0;
      await stage.say(answering.miss(`${problem.solution}.`));
      return offerAnother(ask);
    },
  });

  async function ask(stage: Stage): Promise<FollowUp | null> {
    const problem = generate(levelFor(streak), rng);
    await stage.say(`${intro()} ${problem.text}`);
    return answering.awaitAnswer(challengeFor(problem));
  }

  return {
    id: 'math-problem',
    triggers: [
      new RegExp(`\\b${REQUEST} (un |una |algun |otro |otra )?${SUBJECT}\\b`),
      /\b(un|otro|otra) (problema|reto) de (mates|matematicas|sumas|restas|cuentas)\b/,
      /\botro problema\b/,
      /^(una|otra) (suma|resta)\b/,
      /\b(quiero|quieres|vamos a|podemos|puedes) (hacer|jugar a) (las |unas )?(cuentas|mates|matematicas|sumas|restas)\b/,
    ],
    run: ask,
  };
}
