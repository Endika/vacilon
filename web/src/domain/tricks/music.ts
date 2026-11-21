import type { Song } from './content/types';

export interface ScheduledNote {
  start: number;
  duration: number;
  frequency: number | null;
  line: number;
}

const SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function noteFrequency(pitch: string): number {
  const match = /^([A-G])([#b]?)(-?\d+)$/.exec(pitch);
  if (!match) throw new Error(`bad pitch: ${pitch}`);
  const [, letter, accidental, octave] = match;
  const shift = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0;
  const midi = 12 * (Number(octave) + 1) + SEMITONES[letter] + shift;
  return 440 * 2 ** ((midi - 69) / 12);
}

export function schedule(song: Song): ScheduledNote[] {
  const beat = 60 / song.bpm;
  const notes: ScheduledNote[] = [];
  let start = 0;
  song.lines.forEach((line, index) => {
    for (const [pitch, beats] of line.notes) {
      const duration = beats * beat;
      notes.push({
        start,
        duration,
        frequency: pitch === null ? null : noteFrequency(pitch),
        line: index,
      });
      start += duration;
    }
  });
  return notes;
}

export function songSeconds(song: Song): number {
  const notes = schedule(song);
  const last = notes[notes.length - 1];
  return last ? last.start + last.duration : 0;
}
