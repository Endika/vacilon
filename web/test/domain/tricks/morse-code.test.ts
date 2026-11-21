import { describe, expect, it } from 'vitest';
import { MAX_CHARS, MORSE } from '../../../src/domain/tricks/content/morse';
import { schedule, songSeconds } from '../../../src/domain/tricks/music';
import { clip, encode, foldForMorse, morseSong, show } from '../../../src/domain/tricks/morse-code';

const LETTERS: Record<string, string> = {
  a: '.-',
  b: '-...',
  c: '-.-.',
  d: '-..',
  e: '.',
  f: '..-.',
  g: '--.',
  h: '....',
  i: '..',
  j: '.---',
  k: '-.-',
  l: '.-..',
  m: '--',
  n: '-.',
  o: '---',
  p: '.--.',
  q: '--.-',
  r: '.-.',
  s: '...',
  t: '-',
  u: '..-',
  v: '...-',
  w: '.--',
  x: '-..-',
  y: '-.--',
  z: '--..',
};
const DIGITS = [
  '-----',
  '.----',
  '..---',
  '...--',
  '....-',
  '.....',
  '-....',
  '--...',
  '---..',
  '----.',
];

describe('morse table', () => {
  it('has every letter, ñ and every digit', () => {
    for (const [letter, code] of Object.entries(LETTERS)) expect(MORSE[letter], letter).toBe(code);
    DIGITS.forEach((code, digit) => expect(MORSE[String(digit)]).toBe(code));
    expect(MORSE['ñ']).toBe('--.--');
    expect(Object.keys(MORSE)).toHaveLength(26 + 1 + 10);
  });

  it('gives every character its own code', () => {
    const codes = Object.values(MORSE);
    expect(new Set(codes).size).toBe(codes.length);
    for (const code of codes) expect(code).toMatch(/^[.-]+$/);
  });
});

describe('morse text', () => {
  it('folds accents but keeps ñ', () => {
    expect(foldForMorse('¡Canción, MAMÁ! Año ü')).toBe('cancion mama año u');
  });

  it('encodes words and drops what has no code', () => {
    expect(encode('hola mundo')).toEqual([
      ['....', '---', '.-..', '.-'],
      ['--', '..-', '-.', '-..', '---'],
    ]);
    expect(encode('a   b')).toEqual([['.-'], ['-...']]);
    expect(encode('')).toEqual([]);
  });

  it('shows dots and dashes with a slash between words', () => {
    expect(show(encode('sos sos'))).toBe('··· ––– ··· / ··· ––– ···');
  });

  it('clips to the limit and tells when it cut', () => {
    expect(clip('hola')).toEqual({ text: 'hola', cut: false });
    const long = clip('abcdefghijklmnopqrstuvwxyz');
    expect(long).toEqual({ text: 'abcdefghijkl', cut: true });
    expect(long.text).toHaveLength(MAX_CHARS);
    expect(clip('hola mundo adios').text).toBe('hola mundo a');
  });
});

describe('morse song', () => {
  const UNIT = 60 / 600;

  it('times dots, dashes and gaps with the Morse proportions', () => {
    const notes = schedule(morseSong(encode('sos')));
    const sounding = notes.filter((n) => n.frequency !== null);
    expect(sounding.map((n) => Math.round(n.duration / UNIT))).toEqual([1, 1, 1, 3, 3, 3, 1, 1, 1]);
    expect(notes.map((n) => Math.round(n.duration / UNIT))).toEqual([
      1, 1, 1, 1, 1, 3, 3, 1, 3, 1, 3, 3, 1, 1, 1, 1, 1,
    ]);
    expect(songSeconds(morseSong(encode('sos')))).toBeCloseTo(27 * UNIT);
  });

  it('leaves seven units between words and no trailing rest', () => {
    const song = morseSong(encode('a a'));
    expect(songSeconds(song)).toBeCloseTo((5 + 7 + 5) * UNIT);
    expect(song.lines[0].notes.at(-1)?.[0]).not.toBeNull();
  });

  it('uses one pitch and carries the code as its only line', () => {
    const song = morseSong(encode('hola'));
    const pitches = new Set(song.lines[0].notes.map(([pitch]) => pitch).filter(Boolean));
    expect(pitches.size).toBe(1);
    expect(song.lines).toHaveLength(1);
    expect(song.lines[0].text).toBe('···· ––– ·–·· ·–');
  });

  it('stays short enough for the longest request', () => {
    expect(songSeconds(morseSong(encode('0'.repeat(MAX_CHARS))))).toBeLessThan(30);
  });
});
