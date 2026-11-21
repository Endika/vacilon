import { describe, expect, it } from 'vitest';
import { route } from '../../../src/domain/conversation/route';
import { mulberry32 } from '../../../src/domain/random';
import {
  COLORS,
  MIXES,
  MIX_UNKNOWN,
  type ColorId,
} from '../../../src/domain/tricks/content/colors';
import { FACTS } from '../../../src/domain/tricks/content/facts';
import { HINTS } from '../../../src/domain/tricks/content/problems';
import { TEACH_WORDS } from '../../../src/domain/tricks/content/morse';
import { createColorQuiz } from '../../../src/domain/tricks/color-quiz';
import { createColors } from '../../../src/domain/tricks/colors';
import { createFact } from '../../../src/domain/tricks/fact';
import { createMathProblem } from '../../../src/domain/tricks/math-problem';
import { createMorse } from '../../../src/domain/tricks/morse';
import { encode, show } from '../../../src/domain/tricks/morse-code';
import type { Problem } from '../../../src/domain/tricks/problem';
import { createTricks, matchTrick } from '../../../src/domain/tricks/registry';
import { PASS, type FollowUp } from '../../../src/domain/tricks/types';
import { fakeStage, said } from './stage';
import { spell } from './spell';

const tricks = createTricks(mulberry32(1));
const idFor = (text: string) => matchTrick(text, tricks)?.id ?? null;

const MATCHES: Record<string, string[]> = {
  'math-problem': [
    'hazme un problema',
    'hazme un problema de mates',
    'un problema de mates',
    'un reto de mates',
    'una suma',
    'una resta',
    'quiero hacer cuentas',
    'otro problema',
    'ponme una suma',
    'dame un problema',
    'quiero jugar a las mates',
  ],
  fact: [
    'cuéntame algo curioso',
    'un dato curioso',
    'dime algo que no sepa',
    'sabías que',
    'otro dato',
    'dime un dato',
    'cuéntame cosas curiosas',
  ],
  colors: [
    '¿qué sale si mezclo azul y amarillo?',
    'qué color sale de rojo con azul',
    'qué pasa si mezclo rojo con blanco',
    'qué sale al mezclar los colores',
    'azul con amarillo qué color sale',
  ],
  'color-quiz': ['juguemos a los colores', 'quiero jugar a los colores', 'un concurso de colores'],
  morse: [
    '¿cómo se dice hola en Morse?',
    'escribe hola en morse',
    'enséñame Morse',
    'quiero aprender morse',
    'dime sos en código morse',
  ],
};

const NO_MATCH = [
  'me gustan las mates',
  'tengo un problema',
  'mi hermana hace sumas',
  'sabías que mi gato salta muy alto',
  'me gusta el color azul',
  'mi color favorito es rojo y azul',
  'mezclo la ensalada',
  'me gusta el morse',
  'tengo un dato',
  'tengo una resta',
];

describe('learning trick triggers', () => {
  const cases = Object.entries(MATCHES).flatMap(([id, texts]) =>
    texts.map((text) => [text, id] as const),
  );
  it.each(cases)('%s -> %s', (text, id) => {
    expect(idFor(text)).toBe(id);
  });

  it.each(NO_MATCH)('%s -> none', (text) => {
    expect(idFor(text)).toBeNull();
  });

  it('does not steal numbers typed as the answer, in digits or words', () => {
    for (let n = 0; n <= 999; n++) {
      for (const text of [String(n), spell(n), `son ${spell(n)}`, `es ${n}`]) {
        expect(idFor(text), text).toBeNull();
        expect(route(text, { pendingFollowUp: true, tricks, aboutNames: false }), text).toBe(
          'followUp',
        );
      }
    }
  });

  it('lets a new request cancel a pending problem', () => {
    const ctx = { pendingFollowUp: true, tricks, aboutNames: false };
    expect(route('cuéntame algo curioso', ctx)).toEqual({
      trick: expect.objectContaining({ id: 'fact' }),
    });
  });
});

function problemOf(answer: number): Problem {
  return {
    text: 'Cuenta: ¿cuánto es?',
    answer,
    solution: `${answer - 1} más 1 son ${answer}`,
    hint: HINTS['add-1'],
  };
}

describe('math problem', () => {
  function setup(names: string[] = []) {
    const requested: number[] = [];
    const trick = createMathProblem(
      mulberry32(1),
      () => names,
      (level) => {
        requested.push(level);
        return problemOf(146);
      },
    );
    return { trick, requested };
  }

  async function reply(followUp: FollowUp, text: string) {
    const { stage, calls } = fakeStage();
    const next = await followUp(text, stage);
    return { next, lines: said(calls) };
  }

  async function start(trick: ReturnType<typeof setup>['trick']) {
    const { stage, calls } = fakeStage();
    const followUp = await trick.run(stage, 'hazme un problema');
    if (!followUp) throw new Error('no follow-up');
    return { followUp, lines: said(calls) };
  }

  it('asks the problem and waits for the answer', async () => {
    const { trick } = setup();
    const { lines } = await start(trick);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('¿cuánto es?');
  });

  it.each([
    '146',
    'ciento cuarenta y seis',
    'creo que son 146 seguro',
    'Son ciento cuarenta y seis',
  ])('accepts %s', async (answer) => {
    const { trick } = setup();
    const { followUp } = await start(trick);
    const { lines, next } = await reply(followUp, answer);
    expect(lines[0]).toContain('¡Correcto!');
    expect(lines[0]).toMatch(/¿[^?]*\?$/);
    expect(next).toEqual(expect.any(Function));
  });

  it('praises by name when it knows them', async () => {
    const { trick } = setup(['Ana', 'Leo']);
    const { followUp } = await start(trick);
    const { lines } = await reply(followUp, '146');
    expect(lines[0]).toContain('¡Has acertado, Ana y Leo!');
  });

  it('gives a hint after the first miss and accepts a second try', async () => {
    const { trick } = setup();
    const { followUp } = await start(trick);
    const first = await reply(followUp, '150');
    expect(first.lines[0]).toContain(HINTS['add-1']);
    expect(first.next).toEqual(expect.any(Function));
    const second = await reply(first.next as FollowUp, 'ciento cuarenta y seis');
    expect(second.lines[0]).toContain('¡Correcto!');
  });

  it('explains the solution after a second miss', async () => {
    const { trick } = setup();
    const { followUp } = await start(trick);
    const first = await reply(followUp, '150');
    const second = await reply(first.next as FollowUp, '151');
    expect(second.lines[0]).toContain('145 más 1 son 146');
    expect(second.lines[0]).toMatch(/¿[^?]*\?$/);
  });

  it.each(['me rindo', 'no sé', 'ni idea', 'dímelo'])(
    'explains the solution on "%s"',
    async (text) => {
      const { trick } = setup();
      const { followUp } = await start(trick);
      const { lines } = await reply(followUp, text);
      expect(lines[0]).toContain('145 más 1 son 146');
    },
  );

  it('asks again once when there is no number, then lets the brain talk', async () => {
    const { trick } = setup();
    const { followUp } = await start(trick);
    const first = await reply(followUp, 'mmm déjame pensar');
    expect(first.lines).toHaveLength(1);
    const second = await reply(first.next as FollowUp, 'qué tiempo hace');
    expect(second.next).toBe(PASS);
    expect(second.lines).toEqual([]);
  });

  it('starts another problem after a result on "otro", "sí" or "vale" and passes anything else', async () => {
    const { trick } = setup();
    for (const text of ['otro', 'sí', 'vale', 'quiero otro más difícil']) {
      const { followUp } = await start(trick);
      const done = await reply(followUp, '146');
      const again = await reply(done.next as FollowUp, text);
      expect(again.lines[0], text).toContain('¿cuánto es?');
      expect(again.next).toEqual(expect.any(Function));
    }
    const { followUp } = await start(trick);
    const done = await reply(followUp, '146');
    expect((await reply(done.next as FollowUp, 'gracias, adiós')).next).toBe(PASS);
  });

  it('raises the level with the streak, celebrates it and drops it after a miss', async () => {
    const { trick, requested } = setup();
    let { followUp } = await start(trick);
    const tails: string[] = [];
    for (let i = 0; i < 4; i++) {
      const done = await reply(followUp, '146');
      tails.push(done.lines[0]);
      const another = await reply(done.next as FollowUp, 'otro');
      followUp = another.next as FollowUp;
    }
    expect(requested).toEqual([1, 1, 2, 2, 3]);
    expect(tails[1]).toContain('¿Otro más difícil?');
    expect(tails[1]).toContain('¡Ya van 2 seguidos!');
    expect(tails[0]).not.toContain('seguidos');
    expect(tails[3]).toContain('¿Otro más difícil?');
    const gaveUp = await reply(followUp, 'me rindo');
    await reply(gaveUp.next as FollowUp, 'otro');
    expect(requested.at(-1)).toBe(1);
  });
});

describe('fact', () => {
  it('tells each fact with its hook once before repeating', async () => {
    const fact = createFact(mulberry32(2));
    const told: string[] = [];
    for (let i = 0; i < FACTS.length; i++) {
      const { stage, calls } = fakeStage();
      expect(await fact.run(stage, 'un dato curioso')).toBeNull();
      told.push(said(calls)[0]);
    }
    for (const { text, hook } of FACTS)
      expect(told.filter((line) => line.includes(`${text} ${hook}`))).toHaveLength(1);
  });
});

describe('colors', () => {
  async function answer(text: string): Promise<string> {
    const { stage, calls } = fakeStage();
    await createColors(mulberry32(3)).run(stage, text);
    return said(calls)[0];
  }

  it('answers every mix in both orders', async () => {
    for (const { a, b, result } of MIXES) {
      for (const [x, y] of [
        [a, b],
        [b, a],
      ] as [ColorId, ColorId][]) {
        const line = await answer(
          `¿qué sale si mezclo ${COLORS[x].words[0]} y ${COLORS[y].words[0]}?`,
        );
        expect(line, `${x} ${y}`).toContain(result);
      }
    }
  });

  it('answers the sample question', async () => {
    expect(await answer('¿qué sale si mezclo azul y amarillo?')).toContain('verde');
  });

  it('keeps a colour when mixed with itself', async () => {
    expect(await answer('qué sale si mezclo rojo con rojo')).toContain('sigue siendo rojo');
  });

  it('is playful about a mix she has not tried', async () => {
    expect(MIX_UNKNOWN).toContain(await answer('qué sale si mezclo rosa con verde'));
  });

  it('asks for two colours when it only hears one', async () => {
    expect(await answer('qué sale si mezclo los colores')).toContain('Dime dos colores');
  });
});

describe('color quiz', () => {
  async function ask() {
    const quiz = createColorQuiz(mulberry32(4), () => ['Ana']);
    const { stage, calls } = fakeStage();
    const followUp = await quiz.run(stage, 'juguemos a los colores');
    const question = said(calls)[0];
    const mix = MIXES.find(
      (m) =>
        question.includes(`${COLORS[m.a].name} con ${COLORS[m.b].name}?`) &&
        !m.result.includes(' '),
    );
    if (!followUp || !mix) throw new Error(`no quiz in: ${question}`);
    return { followUp, mix };
  }

  async function reply(followUp: FollowUp, text: string) {
    const { stage, calls } = fakeStage();
    return { next: await followUp(text, stage), lines: said(calls) };
  }

  it('accepts the result and its synonyms', async () => {
    const { followUp, mix } = await ask();
    for (const word of mix.answers) {
      const done = await reply(followUp, `creo que es ${word}`);
      expect(done.lines[0], word).toContain('¡Has acertado, Ana!');
    }
  });

  it('hints with the first letter, then reveals', async () => {
    const { followUp, mix } = await ask();
    const first = await reply(followUp, 'amarillo');
    expect(first.lines[0]).toContain(`«${mix.result[0]}»`);
    const second = await reply(first.next as FollowUp, 'negro');
    expect(second.lines[0]).toContain(`sale ${mix.result}`);
  });

  it('counts a colour she did not list as a wrong answer, not as noise', async () => {
    const { followUp, mix } = await ask();
    const wrong = mix.result === 'granate' ? 'celeste' : 'granate';
    const first = await reply(followUp, `es ${wrong}`);
    expect(first.lines[0]).toContain('Pista');
  });

  it('offers another round after the result', async () => {
    const { followUp } = await ask();
    const done = await reply(followUp, 'me rindo');
    const again = await reply(done.next as FollowUp, 'otro');
    expect(again.lines[0]).toContain('¿Qué color sale si mezclas');
  });
});

describe('morse trick', () => {
  async function run(text: string) {
    const { stage, calls } = fakeStage();
    const followUp = await createMorse(mulberry32(5), () => ['Ana']).run(stage, text);
    const song = calls.find((c) => c.kind === 'play')?.song;
    return { calls, followUp, song, lines: said(calls) };
  }

  it('shows and beeps a word', async () => {
    const { song, calls, lines } = await run('¿Cómo se dice hola en Morse?');
    expect(song?.lines[0].text).toBe('···· ––– ·–·· ·–');
    expect(calls.filter((c) => c.kind === 'show')).toEqual([
      { kind: 'show', text: '···· ––– ·–·· ·–' },
    ]);
    expect(lines).toHaveLength(2);
    expect(lines[1]).toMatch(/^«HOLA» en Morse es ···· ––– ·–·· ·–\. .*\?$/);
  });

  it.each([
    ['escribe sos en morse', '··· ––– ···'],
    ['escribe hola mamá en Morse', '···· ––– ·–·· ·– / –– ·– –– ·–'],
    ['¿cómo se dice canción en morse?', '–·–· ·– –· –·–· ·· ––– –·'],
    ['dime año en código morse', '·– ––·–– –––'],
    ['hola en morse', '···· ––– ·–·· ·–'],
    ['escribe 2026 en morse', '··––– ––––– ··––– –····'],
  ])('%s', async (text, code) => {
    expect((await run(text)).song?.lines[0].text).toBe(code);
  });

  it('cuts long messages and says so', async () => {
    const { song, lines } = await run('escribe abcdefghijklmnopqrstuvwxyz en morse');
    expect(lines[0]).toContain('muy largo');
    expect(song?.lines[0].text).toBe(show(encode('abcdefghijkl')));
  });

  it('asks for a word when there is nothing to write', async () => {
    const { song, lines } = await run('en morse');
    expect(lines[0]).toContain('¿Cuál es la tuya?');
    expect(song).toBeUndefined();
  });

  it('teaches a word and checks the guess', async () => {
    const { song, followUp } = await run('enséñame morse');
    const word = TEACH_WORDS.find((w) => show(encode(w)) === song?.lines[0].text);
    if (!followUp || !word) throw new Error('no lesson');
    const { stage, calls } = fakeStage();
    const next = await followUp(`es ${word}`, stage);
    expect(said(calls)[0]).toContain('¡Has acertado, Ana!');
    expect(next).toEqual(expect.any(Function));
  });

  it('gives the first letter, then the word', async () => {
    const { song, followUp } = await run('quiero aprender morse');
    const word = TEACH_WORDS.find((w) => show(encode(w)) === song?.lines[0].text) as string;
    const first = fakeStage();
    const retry = (await followUp?.('no es nada', first.stage)) as FollowUp;
    expect(said(first.calls)[0]).toContain(`«${word[0]}»`);
    const second = fakeStage();
    await retry('tampoco', second.stage);
    expect(said(second.calls)[0]).toContain(`«${word}»`);
  });
});
