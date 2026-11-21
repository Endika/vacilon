import { describe, expect, it } from 'vitest';
import { isSafe, normalizeForFilter } from '../../../src/domain/conversation/safety';
import {
  AGAIN,
  CHEERS,
  GIVE_UP_ANSWER,
  MISS_HOOKS,
  MISS_OPENERS,
  NUDGES,
  RETRY_HOOKS,
  RETRY_OPENERS,
} from '../../../src/domain/tricks/content/challenge';
import {
  COLORS,
  MIXES,
  MIX_ANSWERS,
  MIX_HOOKS,
  MIX_NEED_TWO,
  MIX_UNKNOWN,
  QUIZ_AGAIN,
  QUIZ_INTROS,
  QUIZ_QUESTION,
  SAME_ANSWERS,
  type ColorId,
} from '../../../src/domain/tricks/content/colors';
import { FACTS, FACT_INTROS } from '../../../src/domain/tricks/content/facts';
import {
  MORSE_HOOKS,
  MORSE_INTROS,
  MORSE_NEED_WORD,
  MORSE_TOO_LONG,
  TEACH_AGAIN,
  TEACH_INTROS,
  TEACH_WORDS,
} from '../../../src/domain/tricks/content/morse';
import {
  FEMALE_NAMES,
  HINTS,
  ITEMS,
  MALE_NAMES,
  PROBLEM_HARDER,
  PROBLEM_HOOKS,
  PROBLEM_INTROS,
  SCENES,
  streakLine,
} from '../../../src/domain/tricks/content/problems';
import { JOKES, JOKE_LAUGHS } from '../../../src/domain/tricks/content/jokes';
import {
  GIVE_UP,
  REVEAL,
  RIDDLES,
  RIDDLE_INTROS,
  RIGHT,
  WRONG,
} from '../../../src/domain/tricks/content/riddles';
import {
  DANCES,
  DANCE_INTROS,
  ENDINGS,
  SING_INTROS,
  SONGS,
} from '../../../src/domain/tricks/content/songs';
import type { Song } from '../../../src/domain/tricks/content/types';

const MAX_CHARS = 140;
const PITCH = /^[A-G]#?[3-6]$/;

const allText = (): string[] => [
  ...JOKES.flatMap((j) => [j.setup, j.punchline]),
  ...JOKE_LAUGHS,
  ...RIDDLES.flatMap((r) => [r.question, r.solution]),
  ...RIDDLE_INTROS,
  ...RIGHT,
  ...WRONG,
  ...REVEAL,
  ...SONGS.flatMap((s) => [s.title, ...s.lines.map((l) => l.text)]),
  ...DANCES.map((s) => s.title),
  ...SING_INTROS,
  ...DANCE_INTROS,
  ...ENDINGS,
  ...FACT_INTROS,
  ...FACTS.flatMap((f) => [f.text, f.hook]),
  ...PROBLEM_INTROS,
  ...PROBLEM_HOOKS,
  PROBLEM_HARDER,
  streakLine(12),
  ...Object.values(HINTS),
  ...FEMALE_NAMES,
  ...MALE_NAMES,
  ...ITEMS.flatMap((i) => [i.singular, i.plural]),
  ...SCENES.flatMap((s) => [
    s.start,
    s.question,
    ...s.add.map((p) => p.text),
    ...s.sub.map((p) => p.text),
  ]),
  ...CHEERS,
  ...RETRY_OPENERS,
  ...RETRY_HOOKS,
  ...NUDGES,
  ...MISS_OPENERS,
  ...MISS_HOOKS,
  ...MIX_ANSWERS,
  ...SAME_ANSWERS,
  ...MIX_HOOKS,
  ...MIX_UNKNOWN,
  MIX_NEED_TWO,
  ...QUIZ_INTROS,
  ...QUIZ_AGAIN,
  QUIZ_QUESTION,
  ...MIXES.flatMap((m) => [m.result, ...m.answers]),
  ...MORSE_INTROS,
  ...MORSE_HOOKS,
  ...TEACH_INTROS,
  ...TEACH_AGAIN,
  ...TEACH_WORDS,
  MORSE_NEED_WORD,
  MORSE_TOO_LONG,
];

const seconds = (song: Song): number =>
  (song.lines.flatMap((l) => l.notes).reduce((sum, [, beats]) => sum + beats, 0) * 60) / song.bpm;

describe('trick content', () => {
  it('passes the word filter and fits a bubble', () => {
    for (const text of allText()) {
      expect(isSafe(text), text).toBe(true);
      expect(text.length, text).toBeLessThanOrEqual(MAX_CHARS);
    }
  });

  it('has no repeated jokes or riddles', () => {
    expect(new Set(JOKES.map((j) => j.setup)).size).toBe(JOKES.length);
    expect(new Set(RIDDLES.map((r) => r.question)).size).toBe(RIDDLES.length);
  });

  it('stores riddle answers already normalized', () => {
    for (const r of RIDDLES)
      for (const a of r.answers) expect(normalizeForFilter(a), r.question).toBe(a);
  });

  it('keeps give-up patterns valid on normalized text', () => {
    const giveUp = GIVE_UP.map((p) => new RegExp(p));
    for (const said of ['No sé', 'me rindo', '¡Dímelo ya!', 'ni idea'])
      expect(
        giveUp.some((p) => p.test(normalizeForFilter(said))),
        said,
      ).toBe(true);
  });

  it('marks where the solution goes in every wrong-answer phrase', () => {
    for (const w of [...WRONG, ...REVEAL]) expect(w).toContain('{x}');
  });

  it('writes songs with real pitches and a sensible length', () => {
    for (const song of [...SONGS, ...DANCES]) {
      for (const [pitch, beats] of song.lines.flatMap((l) => l.notes)) {
        if (pitch !== null) expect(pitch).toMatch(PITCH);
        expect(beats).toBeGreaterThan(0);
      }
      expect(seconds(song), song.title).toBeGreaterThanOrEqual(6);
      expect(seconds(song), song.title).toBeLessThanOrEqual(20);
    }
  });

  it('gives every sung line its lyrics', () => {
    for (const song of SONGS) for (const line of song.lines) expect(line.text).not.toBe('');
  });

  it('keeps every fact short, true to its form and with a hook that asks something', () => {
    expect(FACTS.length).toBeGreaterThanOrEqual(100);
    expect(new Set(FACTS.map((f) => f.text)).size).toBe(FACTS.length);
    expect(new Set(FACTS.map((f) => f.hook)).size).toBe(FACTS.length);
    for (const { text, hook } of FACTS) {
      expect(`${text} ${hook}`.length, text).toBeLessThanOrEqual(160);
      expect(text, text).toMatch(/[.!]$/);
      expect(hook, text).toMatch(/[¿?]/);
    }
  });

  it('never states the myths she must avoid', () => {
    const all = FACTS.map((f) => normalizeForFilter(f.text)).join(' ');
    expect(all).not.toMatch(
      /pez(ces)? (de colores )?(solo )?(recuerda|memoria)|10 ?%|diez por ciento/,
    );
  });

  it('writes the fixed phrases with correct openings and closings', () => {
    for (const text of [...PROBLEM_INTROS, ...CHEERS, ...MISS_OPENERS, ...NUDGES, ...MIX_UNKNOWN])
      expect(text.charAt(0), text).toMatch(/[¡¿A-ZÁÉÍÓÚ]/);
    for (const hook of [
      ...PROBLEM_HOOKS,
      ...MISS_HOOKS,
      ...QUIZ_AGAIN,
      ...TEACH_AGAIN,
      ...MORSE_HOOKS,
    ])
      expect(hook, hook).toMatch(/\?$/);
  });

  it('keeps challenge patterns valid on normalized text', () => {
    const giveUp = GIVE_UP_ANSWER.map((p) => new RegExp(p));
    for (const said of ['No sé', 'me rindo', '¡Dímelo ya!', 'ni idea', 'la solución'])
      expect(
        giveUp.some((p) => p.test(normalizeForFilter(said))),
        said,
      ).toBe(true);
    for (const said of ['Otro', 'sí', 'vale', 'quiero uno más difícil', 'venga'])
      expect(AGAIN.test(normalizeForFilter(said)), said).toBe(true);
    expect(AGAIN.test('gracias adios')).toBe(false);
  });

  it('marks the colours of every template', () => {
    for (const t of MIX_ANSWERS) expect(t).toMatch(/\{a\}.*\{b\}.*\{r\}/);
    for (const t of SAME_ANSWERS) expect(t).toContain('{a}');
    expect(QUIZ_QUESTION).toMatch(/\{a\}.*\{b\}/);
  });

  it('has a hint for every kind of problem', () => {
    for (const hint of Object.values(HINTS)) expect(hint.length).toBeGreaterThan(20);
  });

  it('teaches only words the code can write, each with its own code', () => {
    for (const word of TEACH_WORDS) expect(word).toMatch(/^[a-zñ]+$/);
    expect(new Set(TEACH_WORDS).size).toBe(TEACH_WORDS.length);
  });
});

describe('colour table', () => {
  const BASE: ColorId[] = ['rojo', 'amarillo', 'azul', 'blanco', 'negro'];
  const keyOf = (a: string, b: string) => [a, b].sort().join('+');

  it('mixes every pair of the five base colours', () => {
    const known = new Set(MIXES.map((m) => keyOf(m.a, m.b)));
    for (const [i, a] of BASE.entries())
      for (const b of BASE.slice(i + 1)) expect(known.has(keyOf(a, b)), `${a} ${b}`).toBe(true);
  });

  it('lists each pair once, in either order, with colours she knows', () => {
    const keys = MIXES.map((m) => keyOf(m.a, m.b));
    expect(new Set(keys).size).toBe(keys.length);
    for (const m of MIXES) {
      expect(m.a).not.toBe(m.b);
      expect(COLORS[m.a]).toBeDefined();
      expect(COLORS[m.b]).toBeDefined();
    }
  });

  it('stores accepted answers already normalized and keeps the spoken result among them', () => {
    for (const m of MIXES) {
      expect(m.answers.length, m.result).toBeGreaterThan(0);
      for (const a of m.answers) expect(normalizeForFilter(a), m.result).toBe(a);
      expect(m.answers, m.result).toContain(normalizeForFilter(m.result));
    }
    for (const color of Object.values(COLORS))
      for (const w of color.words) expect(normalizeForFilter(w)).toBe(w);
  });

  it('accepts the usual synonyms of purple, pink and brown', () => {
    expect(MIXES.find((m) => m.result === 'morado')?.answers).toEqual(
      expect.arrayContaining(['violeta', 'purpura']),
    );
    expect(MIXES.find((m) => m.result === 'rosa')?.answers).toContain('rosado');
    expect(MIXES.find((m) => m.result === 'marrón')?.answers).toContain('cafe');
  });
});
