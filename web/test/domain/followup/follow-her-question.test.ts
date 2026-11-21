import { describe, expect, it } from 'vitest';
import { readAnswer } from '../../../src/domain/followup/answer';
import { createQuestionFollowing } from '../../../src/domain/followup/follow-her-question';
import { classify, type Question } from '../../../src/domain/followup/question';
import { mulberry32 } from '../../../src/domain/random';
import { PASS } from '../../../src/domain/tricks/types';
import { fakeStage, said } from '../tricks/stage';

describe('classify', () => {
  it.each([
    ['¡Qué bien! ¿De qué color es tu mochila?', { kind: 'color' }],
    ['¿Cuántos años tienes?', { kind: 'number' }],
    ['¿Qué animal te gusta más?', { kind: 'animal' }],
    ['¡Un perrito! ¿Cómo se llama tu perro?', { kind: 'name', about: 'tu perro' }],
    ['¿Y cómo se llama?', { kind: 'name', about: '' }],
    ['¿Cómo se llama la canción?', { kind: 'name', about: '' }],
    ['¿Cuál es tu comida favorita?', { kind: 'favourite', about: 'comida', favourite: 'favorita' }],
    [
      '¿Cuál es tu dibujo animado favorito?',
      { kind: 'favourite', about: 'dibujo animado', favourite: 'favorito' },
    ],
    [
      '¿Te gusta más la piña o la fresa?',
      {
        kind: 'choice',
        options: [
          { key: 'pinya', said: 'piña' },
          { key: 'fresa', said: 'fresa' },
        ],
      },
    ],
  ])('reads %s', (reply, expected) => {
    expect(classify(reply)).toEqual([expected]);
  });

  it.each([
    '¡Qué divertido!',
    '¿Qué has hecho hoy?',
    '¿Quieres que te cuente un secreto?',
    '¿Me cuentas más? Bip.',
    '¿O no?',
  ])('leaves %s alone', (reply) => {
    expect(classify(reply)).toEqual([]);
  });
});

describe('readAnswer', () => {
  it('finds one colour, but not two', () => {
    expect(readAnswer({ kind: 'color' }, 'Es rosa')).toEqual({ kind: 'color', color: 'rosa' });
    expect(readAnswer({ kind: 'color' }, 'marrón clarito')).toEqual({
      kind: 'color',
      color: 'marrón',
    });
    expect(readAnswer({ kind: 'color' }, 'rosa y azul')).toBeNull();
    expect(readAnswer({ kind: 'color' }, 'no lo sé')).toBeNull();
  });

  it('reads numbers in digits and words', () => {
    expect(readAnswer({ kind: 'number' }, 'tengo siete')).toEqual({ kind: 'number', value: 7 });
    expect(readAnswer({ kind: 'number' }, '12')).toEqual({ kind: 'number', value: 12 });
    expect(readAnswer({ kind: 'number' }, 'muchos')).toBeNull();
  });

  it('finds the animal with its article', () => {
    expect(readAnswer({ kind: 'animal' }, 'las tortugas no, el pingüino')).toEqual({
      kind: 'animal',
      withArticle: 'un pingüino',
    });
    expect(readAnswer({ kind: 'animal' }, 'mi gatita')).toEqual({
      kind: 'animal',
      withArticle: 'un gato',
    });
  });

  it('takes a short name, capitalized, and skips the filler before it', () => {
    const question = { kind: 'name', about: 'tu perro' } as const;
    expect(readAnswer(question, 'toby')).toEqual({ kind: 'name', name: 'Toby' });
    expect(readAnswer(question, 'Se llama Luna.')).toEqual({ kind: 'name', name: 'Luna' });
    expect(readAnswer(question, 'pues se llama Copo de Nieve')).toBeNull();
    expect(readAnswer(question, 'no sé')).toBeNull();
    expect(readAnswer(question, 'gracias')).toBeNull();
  });

  it('echoes a short favourite, never a long or unsafe one', () => {
    const question = { kind: 'favourite', about: 'comida', favourite: 'favorita' } as const;
    expect(readAnswer(question, 'Los macarrones')).toEqual({
      kind: 'favourite',
      value: 'macarrones',
    });
    expect(readAnswer(question, 'me gusta mucho la pizza')).toEqual({
      kind: 'favourite',
      value: 'pizza',
    });
    expect(
      readAnswer(question, 'pues la verdad es que no sé muy bien qué decirte ahora'),
    ).toBeNull();
  });

  it('picks one side of a choice', () => {
    const question: Question = {
      kind: 'choice',
      options: [
        { key: 'pinya', said: 'piña' },
        { key: 'fresa', said: 'fresa' },
      ],
    };
    expect(readAnswer(question, 'la piña')).toEqual({ kind: 'choice', option: 'piña' });
    expect(readAnswer(question, 'las dos')).toBeNull();
  });
});

describe('createQuestionFollowing', () => {
  const follow = createQuestionFollowing(mulberry32(5));

  it('reacts to an answer that fits, with a capital and an open question', async () => {
    const followUp = follow('¿De qué color es tu mochila?');
    const { stage, calls } = fakeStage();
    expect(await followUp?.('rosa', stage)).toBeNull();
    const [reply] = said(calls);
    expect(reply).toMatch(/^¡?Rosa|^Rosa/);
    expect(reply).toMatch(/\?$/);
  });

  it('names the owner when she asked about it', async () => {
    const { stage, calls } = fakeStage();
    await follow('¿Cómo se llama tu perro?')?.('Toby', stage);
    expect(said(calls)[0]).toContain('Toby');
  });

  it('answers an earlier question in the same reply when the last one does not fit', async () => {
    const { stage, calls } = fakeStage();
    const reply = '¡Un peluche! ¿Cómo se llama? Los peluches dan abrazos. ¿Qué animal es?';
    expect(classify(reply).map((question) => question.kind)).toEqual(['animal', 'name']);
    await follow(reply)?.('Pelusa', stage);
    expect(said(calls)[0]).toContain('Pelusa');
  });

  it('checks the answer to a sum she asked', async () => {
    const reply = 'Ocho más cinco son veinte. ¿Y cuánto es 7 menos 4?';
    expect(classify(reply)[0]).toMatchObject({ kind: 'sum', result: 3 });

    const right = fakeStage();
    await follow(reply)?.('son 3', right.stage);
    expect(said(right.calls)[0]).toMatch(/^¡(Correcto|Bien|Exacto)/);

    const repeated = fakeStage();
    await follow(reply)?.('7 menos 4 son 3', repeated.stage);
    expect(said(repeated.calls)[0]).toMatch(/^¡(Correcto|Bien|Exacto)/);

    const wrong = fakeStage();
    await follow(reply)?.('12', wrong.stage);
    expect(said(wrong.calls)[0]).toContain('7 menos 4 son 3');
    expect(said(wrong.calls)[0]).not.toMatch(/Correcto|Bien!|Exacto/);
  });

  it('passes an answer that does not fit to the brain', async () => {
    const { stage, calls } = fakeStage();
    expect(await follow('¿De qué color es tu mochila?')?.('me aburro', stage)).toBe(PASS);
    expect(calls).toEqual([]);
  });

  it('leaves no follow-up after a reply she cannot follow', () => {
    expect(follow('¿Qué has hecho hoy?')).toBeNull();
  });
});
