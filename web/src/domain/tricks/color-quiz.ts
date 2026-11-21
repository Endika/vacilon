import { randomNoRepeat, type Rng } from '../random';
import { shuffleBag } from './bag';
import { createAnswering, offerAnother, type Challenge } from './challenge';
import { mentionsColor, nameOf } from './color-mix';
import { MIXES, QUIZ_AGAIN, QUIZ_INTROS, QUIZ_QUESTION, type Mix } from './content/colors';
import { fill } from './template';
import type { FollowUp, Stage, Trick } from './types';

const POOL = MIXES.filter((mix) => !mix.result.includes(' '));

const mentions = (normalized: string, answers: string[]): boolean =>
  answers.some((answer) => new RegExp(`\\b${answer}\\b`).test(normalized));

export function createColorQuiz(rng: Rng, names: () => readonly string[] = () => []): Trick {
  const answering = createAnswering(rng);
  const nextMix = shuffleBag(POOL, rng);
  const intro = randomNoRepeat(QUIZ_INTROS, rng);
  const again = randomNoRepeat(QUIZ_AGAIN, rng);

  const challengeFor = (mix: Mix): Challenge => ({
    judge(normalized) {
      if (mentions(normalized, mix.answers)) return 'right';
      return mentionsColor(normalized) ? 'wrong' : 'unclear';
    },
    hint: `Pista: empieza por la «${mix.result[0]}».`,
    async right(stage) {
      await stage.say(answering.cheer(names(), `Sí, sale ${mix.result}. ${again()}`));
      return offerAnother(ask);
    },
    async reveal(stage) {
      const explanation = `Si mezclas ${nameOf(mix.a)} con ${nameOf(mix.b)}, sale ${mix.result}.`;
      await stage.say(answering.miss(explanation));
      return offerAnother(ask);
    },
  });

  async function ask(stage: Stage): Promise<FollowUp | null> {
    const mix = nextMix();
    const question = fill(QUIZ_QUESTION, { a: nameOf(mix.a), b: nameOf(mix.b) });
    await stage.say(`${intro()} ${question}`);
    return answering.awaitAnswer(challengeFor(mix));
  }

  return {
    id: 'color-quiz',
    triggers: [
      /\b(juguemos|jugar|jugamos|jugando) (a |con )?(los )?colores\b/,
      /\b(concurso|juego) de (los )?colores\b/,
    ],
    run: ask,
  };
}
