import { MAX_CHARS, MORSE } from './content/morse';
import type { Note, Song } from './content/types';

/** A message as words, each a list of letter codes made of `.` and `-`. */
export type MorseText = string[][];

const UNITS = { dot: 1, dash: 3, symbolGap: 1, letterGap: 3, wordGap: 7 };
const PITCH = 'A5';
const BPM = 600;

/** Lower case, accents dropped, ñ kept, anything else a space. */
export function foldForMorse(text: string): string {
  return text
    .toLowerCase()
    .replace(/ñ/g, '\uE000')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\uE000/g, 'ñ')
    .replace(/[^a-z0-9ñ]+/g, ' ')
    .trim();
}

/** The first `MAX_CHARS` characters of the text, and whether anything was cut. */
export function clip(folded: string): { text: string; cut: boolean } {
  return { text: folded.slice(0, MAX_CHARS).trim(), cut: folded.length > MAX_CHARS };
}

export function encode(folded: string): MorseText {
  return folded
    .split(' ')
    .map((word) => [...word].filter((char) => char in MORSE).map((char) => MORSE[char]))
    .filter((letters) => letters.length > 0);
}

/** Dots and dashes as they look in the bubble. */
export function show(text: MorseText): string {
  return text
    .map((word) => word.join(' '))
    .join(' / ')
    .replace(/\./g, '·')
    .replace(/-/g, '–');
}

/** One pitch: dots are short beeps, dashes are long ones, spaced with the Morse gaps. */
export function morseSong(text: MorseText): Song {
  const notes: Note[] = [];
  const gap = (beats: number): void => void notes.push([null, beats]);
  text.forEach((word, w) => {
    if (w > 0) gap(UNITS.wordGap);
    word.forEach((letter, l) => {
      if (l > 0) gap(UNITS.letterGap);
      [...letter].forEach((symbol, s) => {
        if (s > 0) gap(UNITS.symbolGap);
        notes.push([PITCH, symbol === '.' ? UNITS.dot : UNITS.dash]);
      });
    });
  });
  return { title: 'Morse', bpm: BPM, lines: [{ text: show(text), notes }] };
}
