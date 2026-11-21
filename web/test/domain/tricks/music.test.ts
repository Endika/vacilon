import { describe, expect, it } from 'vitest';
import { noteFrequency, schedule, songSeconds } from '../../../src/domain/tricks/music';
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

describe('noteFrequency', () => {
  it('uses equal temperament with A4 = 440', () => {
    expect(noteFrequency('A4')).toBeCloseTo(440);
    expect(noteFrequency('A5')).toBeCloseTo(880);
    expect(noteFrequency('C4')).toBeCloseTo(261.63, 1);
    expect(noteFrequency('F#4')).toBeCloseTo(369.99, 1);
    expect(noteFrequency('Bb3')).toBeCloseTo(233.08, 1);
  });

  it('rejects nonsense', () => {
    expect(() => noteFrequency('H2')).toThrow();
  });
});

describe('schedule', () => {
  it('lays notes out consecutively across lines', () => {
    const notes = schedule(song);
    expect(notes.map((n) => [n.start, n.duration, n.line])).toEqual([
      [0, 0.5, 0],
      [0.5, 0.25, 0],
      [0.75, 1, 1],
    ]);
    expect(notes[1].frequency).toBeNull();
    expect(songSeconds(song)).toBeCloseTo(1.75);
  });
});
