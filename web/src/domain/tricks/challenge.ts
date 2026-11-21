import { normalizeForFilter } from '../conversation/safety';
import { praise } from '../names/praise';
import { randomNoRepeat, type Rng } from '../random';
import {
  AGAIN,
  CHEERS,
  GIVE_UP_ANSWER,
  MISS_HOOKS,
  MISS_OPENERS,
  NUDGES,
  RETRY_HOOKS,
  RETRY_OPENERS,
} from './content/challenge';
import { PASS, type FollowUp, type FollowUpResult, type Stage } from './types';

export type Verdict = 'right' | 'wrong' | 'unclear';

/** A question with one right answer, two tries and a way to reveal it. */
export interface Challenge {
  judge(normalized: string): Verdict;
  /** Said after the first wrong answer. */
  hint: string;
  right(stage: Stage): Promise<FollowUpResult>;
  /** Shown after a second miss or when giving up. */
  reveal(stage: Stage): Promise<FollowUpResult>;
}

const GIVE_UP = GIVE_UP_ANSWER.map((source) => new RegExp(source));

/** After a result, "otro", "sí" or "vale" starts another round; anything else is left to the brain. */
export function offerAnother(run: (stage: Stage) => Promise<FollowUp | null>): FollowUp {
  return async (text, stage) => (AGAIN.test(normalizeForFilter(text)) ? run(stage) : PASS);
}

export function createAnswering(rng: Rng) {
  const cheer = randomNoRepeat(CHEERS, rng);
  const retryOpener = randomNoRepeat(RETRY_OPENERS, rng);
  const retryHook = randomNoRepeat(RETRY_HOOKS, rng);
  const nudge = randomNoRepeat(NUDGES, rng);
  const missOpener = randomNoRepeat(MISS_OPENERS, rng);
  const missHook = randomNoRepeat(MISS_HOOKS, rng);

  function awaitAnswer(challenge: Challenge, misses = 0, nudged = false): FollowUp {
    return async (text, stage) => {
      const normalized = normalizeForFilter(text);
      if (GIVE_UP.some((pattern) => pattern.test(normalized))) return challenge.reveal(stage);
      const verdict = challenge.judge(normalized);
      if (verdict === 'right') return challenge.right(stage);
      if (verdict === 'unclear') {
        if (nudged) return PASS;
        await stage.say(nudge());
        return awaitAnswer(challenge, misses, true);
      }
      if (misses >= 1) return challenge.reveal(stage);
      await stage.say(`${retryOpener()} ${challenge.hint} ${retryHook()}`);
      return awaitAnswer(challenge, misses + 1, nudged);
    };
  }

  return {
    awaitAnswer: (challenge: Challenge) => awaitAnswer(challenge),
    /** Celebrates, naming whoever is known, then adds the tail. */
    cheer: (names: readonly string[], tail = ''): string =>
      [praise(names) || '¡Correcto!', cheer(), tail].filter(Boolean).join(' '),
    miss: (explanation: string): string => `${missOpener()} ${explanation} ${missHook()}`,
  };
}
