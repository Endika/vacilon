import { describe, expect, it } from 'vitest';
import { Chispa, normalize, type Generator } from '../../../src/domain/brain/chispa';
import { readModel } from '../../load';

const scripted = (answers: string[]): Generator => {
  let i = 0;
  return () => answers[i++] as string;
};

const bot = (generator: Generator): Chispa => new Chispa(null, null, { generator });

describe('responde', () => {
  it('answers serious topics and identity with fixed phrases before the model', () => {
    const v = bot(() => 'respuesta del modelo');
    expect(v.reply('¿cómo te llamas?')).toContain('Chispa');
    expect(v.reply('me gusta el helado')).toBe('respuesta del modelo');
  });

  it('retries empty and echoed answers', () => {
    expect(bot(scripted(['', '  ¡HOLA, qué tal!', 'ya ves'])).reply('hola qué tal')).toBe('ya ves');
  });

  it('retries answers equal to one of the recent ones', () => {
    const v = bot(scripted(['uno', 'uno', 'dos', 'Uno.', 'tres']));
    expect([v.reply('a'), v.reply('b'), v.reply('c')]).toEqual(['uno', 'dos', 'tres']);
  });

  it('gives up after four retries', () => {
    let calls = 0;
    const v = bot(() => {
      calls++;
      return '';
    });
    expect(v.reply('hola')).toBe('');
    expect(calls).toBe(5);
  });

  it('forgets answers older than the last five', () => {
    const answers = ['a1', 'b2', 'c3', 'd4', 'e5', 'f6', 'a1'];
    const v = bot(scripted(answers));
    expect(answers.map((_, i) => v.reply(`m${i}`))).toEqual(answers);
  });
});

describe('normalize', () => {
  it('folds case, accents and punctuation', () => {
    expect(normalize('¡Qué TAL, Ñu!')).toBe('que tal nu');
  });
});

describe('real generation', () => {
  const { manifest, weights, tokenizer } = readModel();
  const run = (seed: number): string =>
    Chispa.fromBuffers(manifest, weights, tokenizer, { seed, maxNewTokens: 12 }).reply('hola');

  it('is reproducible for a seed and reports tokens', () => {
    expect(run(3)).toBe(run(3));
    const counts: number[] = [];
    Chispa.fromBuffers(manifest, weights, tokenizer, { seed: 1, maxNewTokens: 5 }).reply(
      'hola',
      (t) => counts.push(t.count),
    );
    expect(counts.length).toBeGreaterThan(0);
  });
});
