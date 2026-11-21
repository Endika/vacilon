import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SongPlayer } from '../../src/application/ports';
import { createStage } from '../../src/application/stage';
import type { Song } from '../../src/domain/tricks/content/types';
import { schedule, songSeconds } from '../../src/domain/tricks/music';

const song: Song = {
  title: 't',
  bpm: 120,
  lines: [
    { text: 'a', notes: [['C4', 1]] },
    { text: 'b', notes: [['D4', 1]] },
  ],
};

const fakeSongs: SongPlayer = (song, handlers) => {
  let finish: () => void = () => undefined;
  const done = new Promise<void>((resolve) => (finish = resolve));
  let line = -1;
  for (const note of schedule(song)) {
    setTimeout(() => {
      if (note.line !== line) handlers.onLine?.((line = note.line));
      if (note.frequency !== null) handlers.onNote?.(note);
    }, note.start * 1000);
  }
  setTimeout(finish, songSeconds(song) * 1000);
  return { done, stop: finish };
};

function setup(speak: (text: string) => Promise<void> = async () => undefined) {
  const events: string[] = [];
  const stage = createStage({
    bubble: { set: (t) => void events.push(`bubble:${t}`) },
    speak,
    face: {
      startSpeaking: () => void events.push('startSpeaking'),
      stopSpeaking: () => void events.push('stopSpeaking'),
      syllable: () => void events.push('syllable'),
      startDancing: () => void events.push('startDancing'),
      stopDancing: () => void events.push('stopDancing'),
    },
    songs: fakeSongs,
  });
  return { stage, events };
}

describe('createStage', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('say sets the bubble and waits for the speech', async () => {
    let end: () => void = () => undefined;
    const { stage, events } = setup(() => new Promise<void>((r) => (end = r)));
    let done = false;
    const run = stage.say('hola').then(() => (done = true));
    await Promise.resolve();
    expect(events).toEqual(['bubble:hola']);
    expect(done).toBe(false);
    end();
    await run;
    expect(done).toBe(true);
  });

  it('show only sets the bubble', () => {
    const { stage, events } = setup();
    stage.show('ey');
    expect(events).toEqual(['bubble:ey']);
  });

  it('play syncs the mouth with the notes and lines when not dancing', async () => {
    const { stage, events } = setup();
    const lines: number[] = [];
    const run = stage.play(song, (i) => lines.push(i));
    await vi.runAllTimersAsync();
    await run;
    expect(events[0]).toBe('startSpeaking');
    expect(events.filter((e) => e === 'syllable')).toHaveLength(2);
    expect(events.at(-1)).toBe('stopSpeaking');
    expect(lines).toEqual([0, 1]);
  });

  it('play leaves the dancing face alone', async () => {
    const { stage, events } = setup();
    stage.dance(true);
    const run = stage.play(song);
    await vi.runAllTimersAsync();
    await run;
    expect(events).toEqual(['startDancing']);
    stage.dance(false);
    expect(events.at(-1)).toBe('stopDancing');
  });
});
