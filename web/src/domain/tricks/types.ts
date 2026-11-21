import type { Song } from './content/types';

export interface Stage {
  /** Shows the text in the bubble and speaks it; resolves when done. */
  say(text: string): Promise<void>;
  show(text: string): void;
  /** Plays the melody; `onLine` fires as each song line starts. */
  play(song: Song, onLine?: (index: number) => void): Promise<void>;
  dance(on: boolean): void;
}

/** Handed back by a follow-up that does not want the message, so the brain answers it. */
export const PASS: unique symbol = Symbol('pass');

/** What a follow-up leaves open: the next follow-up, nothing, or `PASS`. */
export type FollowUpResult = FollowUp | null | typeof PASS;

export type FollowUp = (text: string, stage: Stage) => Promise<FollowUpResult>;

export interface Trick {
  id: string;
  /** Matched against `normalizeForFilter` output. */
  triggers: RegExp[];
  /** `text` is the message that matched, as typed. */
  run(stage: Stage, text: string): Promise<FollowUp | null>;
}
