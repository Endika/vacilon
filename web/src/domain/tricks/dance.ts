import { randomNoRepeat, type Rng } from '../random';
import { shuffleBag } from './bag';
import { DANCES, DANCE_INTROS, ENDINGS } from './content/songs';
import type { Trick } from './types';

export function createDance(rng: Rng): Trick {
  const intro = randomNoRepeat(DANCE_INTROS, rng);
  const nextDance = shuffleBag(DANCES, rng);
  const ending = randomNoRepeat(ENDINGS, rng);
  return {
    id: 'dance',
    triggers: [
      /^((oye|venga|hola|porfa|porfavor|por favor) )?(chispa )?bail(a|as|amos|emos)\b/,
      /\b(puedes|quieres|sabes|vamos a) bailar\b/,
      /\b(un|otro) baile\b/,
    ],
    async run(stage) {
      await stage.say(intro());
      stage.dance(true);
      try {
        await stage.play(nextDance());
      } finally {
        stage.dance(false);
      }
      await stage.say(ending());
      return null;
    },
  };
}
