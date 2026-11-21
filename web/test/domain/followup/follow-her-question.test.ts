import { describe, expect, it } from 'vitest';
import { readAnswer } from '../../../src/domain/followup/answer';
import { createQuestionFollowing } from '../../../src/domain/followup/follow-her-question';
import { MOOD_BAD, MOOD_TIRED, OPEN_ECHO, OPEN_PLAIN } from '../../../src/domain/followup/content';
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
    ['¿Qué tal?'],
    ['¿Qué tal estás hoy?'],
    ['¿Y qué tal estás?'],
    ['¿Cómo estás?'],
    ['¿Cómo te encuentras?'],
    ['¿Cómo te sientes hoy?'],
    ['¿Qué tal el día?'],
    ['¿Y qué tal el cole?'],
    ['¿Cómo te ha ido?'],
    ['¿Cómo te ha ido el cole hoy?'],
  ])('reads %s as a mood question', (reply) => {
    expect(classify(reply)).toEqual([{ kind: 'mood' }]);
  });

  it.each([
    ['¿Qué plan tienes?', 'open'],
    ['¿Y tú, qué plan tienes?', 'open'],
    ['¿Con quién juegas?', 'open'],
    ['¿Qué le dibujas?', 'open'],
    ['¿Dónde escondes el peluche?', 'open'],
    ['¿Por qué te gusta tanto?', 'open'],
    ['¿A qué te gusta jugar?', 'open'],
    ['¿Qué has hecho hoy?', 'open'],
  ])('reads %s as an open question', (reply, kind) => {
    expect(classify(reply)).toEqual([{ kind }]);
  });

  it.each([
    '¿Jugamos a las estatuas?',
    '¿Quieres que te cuente un secreto?',
    '¿Te gusta el chocolate?',
    '¿Qué tal si jugamos al escondite?',
    '¿Y si bailamos?',
    '¿Tienes mascota?',
    '¿Cómo?',
  ])('does not take %s for an open question', (reply) => {
    expect(classify(reply)).toEqual([]);
  });

  it('keeps the earlier kinds ahead of the open one', () => {
    expect(classify('¿Qué animal te gusta más?')[0].kind).toBe('animal');
    expect(classify('¿Cómo se llama tu perro?')[0].kind).toBe('name');
    expect(classify('¿Qué color prefieres, rosa o azul?')[0].kind).toBe('color');
    expect(classify('¿Qué prefieres, la piña o la fresa?')[0].kind).toBe('choice');
    expect(classify('¿Cuál es tu juego favorito?')[0].kind).toBe('favourite');
    expect(classify('¿Cuántos hermanos tienes?')[0].kind).toBe('number');
    expect(classify('¿Qué tal estás?')[0].kind).toBe('mood');
  });

  it.each([
    '¡Qué divertido!',
    '¿Quieres que te cuente un secreto?',
    '¿Me cuentas más? Bip.',
    'Chiste: ¿qué hace un pez? Nada. Jajabip. ¡Pídeme otro si quieres!',
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

describe('readAnswer for a mood', () => {
  const mood = { kind: 'mood' } as const;
  it.each([
    ['bien', 'good'],
    ['genial, gracias', 'good'],
    ['muy bien', 'good'],
    ['contenta', 'good'],
    ['súper feliz', 'good'],
    ['regular', 'soso'],
    ['más o menos', 'soso'],
    ['así así', 'soso'],
    ['no está mal', 'soso'],
    ['mal', 'bad'],
    ['triste', 'bad'],
    ['enfadada', 'bad'],
    ['no muy bien', 'bad'],
    ['no estoy bien', 'bad'],
    ['cansada', 'tired'],
    ['tengo sueño', 'tired'],
    ['agotado', 'tired'],
  ])('reads "%s" as %s', (text, expected) => {
    expect(readAnswer(mood, text)).toEqual({ kind: 'mood', mood: expected });
  });

  it('has nothing to read without a mood word', () => {
    expect(readAnswer(mood, 'he ido al parque')).toBeNull();
    expect(readAnswer(mood, 'hola')).toBeNull();
  });
});

describe('readAnswer for an open question', () => {
  const open = { kind: 'open' } as const;
  it.each([
    ['ir al parque', 'ir al parque'],
    ['con mi hermana', 'con tu hermana'],
    ['con mis amigos', 'con tus amigos'],
    ['voy al parque', 'vas al parque'],
    ['juego conmigo', 'juegas contigo'],
    ['yo quiero un helado', 'tú quieres un helado'],
    ['tengo un gato', 'tienes un gato'],
    ['me gusta bailar', 'te gusta bailar'],
    ['Soy Luna', 'Eres Luna'],
    ['¡con mi mamá!', 'con tu mamá'],
  ])('repeats "%s" as "%s"', (text, echo) => {
    expect(readAnswer(open, text)).toEqual({ kind: 'open', echo });
  });

  it.each([
    'he ido al parque',
    'fui al cole',
    'jugué con mi prima',
    'vamos al parque',
    'me voy a dormir',
    'salto en la cama',
    'es para mi',
  ])('does not repeat "%s", but still reacts', (text) => {
    expect(readAnswer(open, text)).toEqual({ kind: 'open', echo: null });
  });

  it.each(['no sé', 'No lo sé', 'ni idea', 'no me acuerdo'])(
    'reads "%s" as not knowing',
    (text) => {
      expect(readAnswer(open, text)).toEqual({ kind: 'dontknow' });
    },
  );

  it('gives up on long, empty or unsafe answers', () => {
    expect(
      readAnswer(open, 'pues voy a esconderlo debajo de la cama de mi hermana mayor'),
    ).toBeNull();
    expect(readAnswer(open, 'una cosa larguísima con muchísimas letras seguidas ya')).toBeNull();
    expect(readAnswer(open, '   ')).toBeNull();
    expect(readAnswer(open, '...')).toBeNull();
    expect(readAnswer(open, 'una mierda')).toBeNull();
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
    expect(follow('¿Quieres que te cuente un secreto?')).toBeNull();
  });

  it.each([
    ['¿Qué tal estás hoy?', 'bien', /alegría|Bien, bien|encanta|Chócala/],
    ['¿Cómo estás?', 'no muy bien', /siento|decírmelo|abrazo/],
    ['¿Qué tal el cole?', 'cansada', /despacito|cansancio|largo/],
  ])('reacts to the mood in %s / %s', async (question, answer, expected) => {
    const { stage, calls } = fakeStage();
    expect(await follow(question)?.(answer, stage)).toBeNull();
    expect(said(calls)[0]).toMatch(expected);
  });

  it('passes an answer with no mood to the brain', async () => {
    const { stage, calls } = fakeStage();
    expect(await follow('¿Qué tal estás?')?.('he ido al parque', stage)).toBe(PASS);
    expect(calls).toEqual([]);
  });

  it('offers something after a bad mood and does not hold the tired child', () => {
    expect(MOOD_TIRED.every((reaction) => !reaction.includes('?'))).toBe(true);
    expect(MOOD_BAD.every((reaction) => reaction.endsWith('?'))).toBe(true);
  });

  it.each([
    ['¿Y tú, qué plan tienes?', 'ir al parque', 'ir al parque'],
    ['¿Con quién juegas?', 'con mi hermana', 'con tu hermana'],
  ])('repeats the answer to %s in second person', async (question, answer, echo) => {
    const echoing = createQuestionFollowing(() => 0.1);
    const { stage, calls } = fakeStage();
    expect(await echoing(question)?.(answer, stage)).toBeNull();
    expect(said(calls)[0].toLowerCase()).toContain(echo);
  });

  it('reacts to not knowing, and never repeats a lot of words', async () => {
    const dontKnow = fakeStage();
    expect(await follow('¿Qué le dibujas?')?.('no sé', dontKnow.stage)).toBeNull();
    expect(said(dontKnow.calls)[0]).toMatch(/No pasa nada|Tranquilidad|Vale, no pasa/);

    const long = fakeStage();
    const twelve = 'lo escondo debajo de la cama de mi hermana para que no lo vea';
    expect(await follow('¿Dónde escondes el peluche?')?.(twelve, long.stage)).toBe(PASS);
    expect(long.calls).toEqual([]);
  });

  it('answers a yes/no question with no follow-up', () => {
    expect(follow('¿Jugamos a las estatuas?')).toBeNull();
  });

  it('reacts without repeating when the answer starts with a verb she cannot swap', async () => {
    const { stage, calls } = fakeStage();
    await follow('¿Qué has hecho hoy?')?.('he ido al parque', stage);
    expect(said(calls)[0]).not.toContain('ido al parque');
    expect(said(calls)).toHaveLength(1);
  });

  it('has enough open reactions, a third of them without the echo, and does not repeat in a row', async () => {
    expect(OPEN_ECHO.length + OPEN_PLAIN.length).toBeGreaterThanOrEqual(10);
    expect(OPEN_PLAIN.length / (OPEN_ECHO.length + OPEN_PLAIN.length)).toBeGreaterThan(0.3);
    const followUp = createQuestionFollowing(mulberry32(9))('¿Qué plan tienes?');
    const { stage, calls } = fakeStage();
    for (let i = 0; i < 40; i++) await followUp?.('ir al parque', stage);
    const replies = said(calls);
    replies.slice(1).forEach((reply, i) => expect(reply).not.toBe(replies[i]));
  });
});
