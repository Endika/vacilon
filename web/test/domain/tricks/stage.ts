import type { Song } from '../../../src/domain/tricks/content/types';
import type { Stage } from '../../../src/domain/tricks/types';

export type Call =
  | { kind: 'say'; text: string }
  | { kind: 'show'; text: string }
  | { kind: 'play'; song: Song }
  | { kind: 'dance'; on: boolean };

export function fakeStage(playError?: Error): { stage: Stage; calls: Call[] } {
  const calls: Call[] = [];
  const stage: Stage = {
    say: async (text) => void calls.push({ kind: 'say', text }),
    show: (text) => void calls.push({ kind: 'show', text }),
    play: async (song, onLine) => {
      calls.push({ kind: 'play', song });
      if (playError) throw playError;
      song.lines.forEach((_, i) => onLine?.(i));
    },
    dance: (on) => void calls.push({ kind: 'dance', on }),
  };
  return { stage, calls };
}

export const said = (calls: Call[]) => calls.flatMap((c) => (c.kind === 'say' ? [c.text] : []));
