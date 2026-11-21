import { randomNoRepeat, type Rng } from '../random';
import { shuffleBag } from './bag';
import { JOKES, JOKE_LAUGHS } from './content/jokes';
import type { Trick } from './types';

export function createJoke(rng: Rng): Trick {
  const nextJoke = shuffleBag(JOKES, rng);
  const laugh = randomNoRepeat(JOKE_LAUGHS, rng);
  return {
    id: 'joke',
    triggers: [/\bchiste\w*/],
    async run(stage) {
      const joke = nextJoke();
      await stage.say(joke.setup);
      await stage.say(`${joke.punchline} ${laugh()}`);
      return null;
    },
  };
}
