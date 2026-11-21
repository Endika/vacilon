import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../../src/domain/random';
import { normalizeForFilter } from '../../../src/domain/conversation/safety';
import { JOKES } from '../../../src/domain/tricks/content/jokes';
import { REVEAL, RIDDLES } from '../../../src/domain/tricks/content/riddles';
import { createDance } from '../../../src/domain/tricks/dance';
import { createJoke } from '../../../src/domain/tricks/joke';
import { createTricks, matchTrick } from '../../../src/domain/tricks/registry';
import { createRiddle } from '../../../src/domain/tricks/riddle';
import { createSing } from '../../../src/domain/tricks/sing';
import { fakeStage, said } from './stage';

const tricks = createTricks(mulberry32(1));
const idFor = (text: string) => matchTrick(text, tricks)?.id ?? null;

const MATCHES: Record<string, string[]> = {
  joke: ['dime un chiste', 'cuentame chistes'],
  dance: [
    'baila',
    'Chispa, baila',
    'Oye Chispa, ¡baila!',
    'porfa baila',
    'bailas algo',
    'bailamos',
    'bailemos',
    'puedes bailar',
    'quieres bailar',
    'sabes bailar',
    'vamos a bailar',
    'haz un baile',
    'un baile',
  ],
  sing: [
    'canta',
    'Chispa, canta',
    'venga, canta',
    'Hola Chispa, cántame algo',
    'cantas algo',
    'cántame una canción',
    'cantamos',
    'puedes cantar',
    'sabes cantar',
    'quieres cantar',
    'una canción',
    'canta una canción',
  ],
  riddle: ['dime una adivinanza', 'sabes adivinanzas'],
};

const NO_MATCH = [
  'me gusta bailar',
  'mi hermana baila ballet',
  'bailar es divertido',
  'me gusta cantar',
  'mi canción favorita es esa',
  'mi madre canta',
  'adivina qué me ha pasado',
];

describe('trick triggers', () => {
  const cases = Object.entries(MATCHES).flatMap(([id, texts]) =>
    texts.map((text) => [text, id] as const),
  );
  it.each(cases)('%s -> %s', (text, id) => {
    expect(idFor(text)).toBe(id);
  });

  it.each(NO_MATCH)('%s -> none', (text) => {
    expect(idFor(text)).toBeNull();
  });

  it('lets guardrails win over a trick', () => {
    expect(idFor('tengo miedo, cántame una canción')).toBeNull();
    expect(idFor('cómo te llamas')).toBeNull();
  });
});

describe('joke', () => {
  it('tells every joke once before repeating', async () => {
    const joke = createJoke(mulberry32(3));
    const setups: string[] = [];
    for (let i = 0; i < JOKES.length * 2; i++) {
      const { stage, calls } = fakeStage();
      await joke.run(stage, '');
      setups.push(said(calls)[0]);
    }
    const first = setups.slice(0, JOKES.length);
    expect(new Set(first)).toEqual(new Set(JOKES.map((j) => j.setup)));
    expect(setups[JOKES.length]).not.toBe(first[JOKES.length - 1]);
  });

  it('says the punchline followed by a laugh', async () => {
    const { stage, calls } = fakeStage();
    await createJoke(mulberry32(3)).run(stage, '');
    const [setup, punch] = said(calls);
    const joke = JOKES.find((j) => j.setup === setup);
    expect(punch.startsWith(joke?.punchline ?? '?')).toBe(true);
  });
});

describe('dance', () => {
  it('dances on, plays, dances off', async () => {
    const { stage, calls } = fakeStage();
    await createDance(mulberry32(1)).run(stage, '');
    expect(calls.map((c) => c.kind)).toEqual(['say', 'dance', 'play', 'dance', 'say']);
    expect(calls.filter((c) => c.kind === 'dance')).toEqual([
      { kind: 'dance', on: true },
      { kind: 'dance', on: false },
    ]);
  });

  it('stops dancing even if play rejects', async () => {
    const { stage, calls } = fakeStage(new Error('boom'));
    await expect(createDance(mulberry32(1)).run(stage, '')).rejects.toThrow('boom');
    expect(calls.at(-1)).toEqual({ kind: 'dance', on: false });
  });
});

describe('sing', () => {
  it('shows every line in order', async () => {
    const { stage, calls } = fakeStage();
    await createSing(mulberry32(1)).run(stage, '');
    const song = calls.find((c) => c.kind === 'play')?.song;
    const shown = calls.flatMap((c) => (c.kind === 'show' ? [c.text] : []));
    expect(shown).toEqual(song?.lines.map((l) => l.text));
  });

  it('does not repeat a song back to back', async () => {
    const sing = createSing(mulberry32(5));
    const titles: string[] = [];
    for (let i = 0; i < 12; i++) {
      const { stage, calls } = fakeStage();
      await sing.run(stage, '');
      titles.push(calls.find((c) => c.kind === 'play')?.song.title ?? '');
    }
    titles.slice(1).forEach((t, i) => expect(t).not.toBe(titles[i]));
  });
});

describe('riddle', () => {
  async function ask() {
    const riddle = createRiddle(mulberry32(2));
    const first = fakeStage();
    const followUp = await riddle.run(first.stage, '');
    const text = said(first.calls)[0];
    const asked = RIDDLES.find((r) => text.endsWith(r.question));
    if (!followUp || !asked) throw new Error('riddle not asked');
    return { followUp, asked };
  }

  async function reply(text: string) {
    const { followUp, asked } = await ask();
    const { stage, calls } = fakeStage();
    await followUp(text, stage);
    return { said: said(calls)[0], asked };
  }

  it('praises a right answer, also with caps and accents', async () => {
    const { asked } = await ask();
    for (const text of [asked.answers[0], `¡${asked.answers[0].toUpperCase()}!`]) {
      const { said: line } = await reply(text);
      expect(line).not.toContain(asked.solution);
    }
  });

  it('accepts accented answers after normalization', () => {
    expect(normalizeForFilter('¡La PERA!')).toBe('la pera');
  });

  it('reveals the solution on a wrong answer', async () => {
    const { said: line, asked } = await reply('un zapato volador');
    expect(line).toContain(asked.solution);
  });

  it('reveals the solution when giving up', async () => {
    const { said: line, asked } = await reply('no sé, me rindo');
    expect(REVEAL.map((r) => r.replace('{x}', asked.solution))).toContain(line);
  });

  it('asks every riddle once before repeating', async () => {
    const riddle = createRiddle(mulberry32(4));
    const asked = new Set<string>();
    for (let i = 0; i < RIDDLES.length; i++) {
      const { stage, calls } = fakeStage();
      await riddle.run(stage, '');
      asked.add(said(calls)[0]);
    }
    expect(asked.size).toBe(RIDDLES.length);
  });
});
