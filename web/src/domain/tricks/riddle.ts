import { normalizeForFilter } from '../conversation/safety';
import { praise } from '../names/praise';
import { randomNoRepeat, type Rng } from '../random';
import { shuffleBag } from './bag';
import { GIVE_UP, REVEAL, RIDDLES, RIDDLE_INTROS, RIGHT, WRONG } from './content/riddles';
import type { Riddle } from './content/types';
import type { FollowUp, Trick } from './types';

const GIVE_UP_PATTERNS = GIVE_UP.map((source) => new RegExp(source));

function isGiveUp(normalized: string): boolean {
  return GIVE_UP_PATTERNS.some((pattern) => pattern.test(normalized));
}

function isCorrect(normalized: string, riddle: Riddle): boolean {
  return riddle.answers.some((answer) => new RegExp(`\\b${answer}\\b`).test(normalized));
}

export function createRiddle(rng: Rng, names: () => readonly string[] = () => []): Trick {
  const nextRiddle = shuffleBag(RIDDLES, rng);
  const intro = randomNoRepeat(RIDDLE_INTROS, rng);
  const right = randomNoRepeat(RIGHT, rng);
  const wrong = randomNoRepeat(WRONG, rng);
  const reveal = randomNoRepeat(REVEAL, rng);

  const followUp = (riddle: Riddle): FollowUp => {
    return async (text, stage) => {
      const normalized = normalizeForFilter(text);
      if (isGiveUp(normalized)) await stage.say(reveal().replace('{x}', riddle.solution));
      else if (isCorrect(normalized, riddle))
        await stage.say([praise(names()), right()].filter(Boolean).join(' '));
      else await stage.say(wrong().replace('{x}', riddle.solution));
      return null;
    };
  };

  return {
    id: 'riddle',
    triggers: [/\badivinanza\w*/],
    async run(stage) {
      const riddle = nextRiddle();
      await stage.say(`${intro()} ${riddle.question}`);
      return followUp(riddle);
    },
  };
}
