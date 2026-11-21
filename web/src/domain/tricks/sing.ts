import { randomNoRepeat, type Rng } from '../random';
import { shuffleBag } from './bag';
import { ENDINGS, SING_INTROS, SONGS } from './content/songs';
import type { Trick } from './types';

export function createSing(rng: Rng): Trick {
  const intro = randomNoRepeat(SING_INTROS, rng);
  const nextSong = shuffleBag(SONGS, rng);
  const ending = randomNoRepeat(ENDINGS, rng);
  return {
    id: 'sing',
    triggers: [
      /^((oye|venga|hola|porfa|porfavor|por favor) )?(chispa )?cant(a|as|ame|amos|emos)\b/,
      /\b(puedes|quieres|sabes|vamos a) cantar\b/,
      /\b(una|otra) cancion\b/,
    ],
    async run(stage) {
      const song = nextSong();
      await stage.say(intro());
      await stage.play(song, (i) => stage.show(song.lines[i].text));
      await stage.say(ending());
      return null;
    },
  };
}
