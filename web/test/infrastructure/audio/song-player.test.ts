import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { playSong } from '../../../src/infrastructure/audio/song-player';
import type { Song } from '../../../src/domain/tricks/content/types';

const song: Song = {
  title: 't',
  bpm: 120,
  lines: [
    {
      text: 'a',
      notes: [
        ['A4', 1],
        [null, 0.5],
      ],
    },
    { text: 'b', notes: [['A5', 2]] },
  ],
};

describe('playSong without audio', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('drives lines, sounding notes and completion from timers', async () => {
    const lines: number[] = [];
    const notes: number[] = [];
    const playback = playSong(
      null,
      song,
      { onLine: (i) => lines.push(i), onNote: (n) => notes.push(n.start) },
      { muted: false },
    );
    let finished = false;
    void playback.done.then(() => (finished = true));
    await vi.advanceTimersByTimeAsync(100);
    expect(lines).toEqual([0]);
    await vi.advanceTimersByTimeAsync(700);
    expect(lines).toEqual([0, 1]);
    expect(notes).toEqual([0, 0.75]);
    expect(finished).toBe(false);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(finished).toBe(true);
  });

  it('stop cancels pending callbacks and resolves done', async () => {
    const lines: number[] = [];
    const playback = playSong(null, song, { onLine: (i) => lines.push(i) }, { muted: true });
    await vi.advanceTimersByTimeAsync(100);
    playback.stop();
    await playback.done;
    await vi.advanceTimersByTimeAsync(5_000);
    expect(lines).toEqual([0]);
  });
});
