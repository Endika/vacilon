import { describe, expect, it } from 'vitest';
import { MAX_ATTEMPTS, askSafely } from '../../src/application/ask-safely';
import { FALLBACK } from '../../src/domain/phrases';

describe('askSafely', () => {
  it('returns the first safe answer without retrying', async () => {
    let calls = 0;
    const answer = await askSafely(
      async () => {
        calls++;
        return 'Hola, amiga';
      },
      () => undefined,
    );
    expect(answer).toBe('Hola, amiga');
    expect(calls).toBe(1);
  });

  it('retries after an unsafe answer', async () => {
    const answers = ['qué mierda', 'qué bien'];
    let calls = 0;
    const answer = await askSafely(
      async () => answers[calls++],
      () => undefined,
    );
    expect(answer).toBe('qué bien');
    expect(calls).toBe(2);
  });

  it('uses the cute fallback after three unsafe answers', async () => {
    let calls = 0;
    const answer = await askSafely(
      async () => {
        calls++;
        return 'joder';
      },
      () => undefined,
    );
    expect(calls).toBe(MAX_ATTEMPTS);
    expect(answer).toBe(FALLBACK);
    expect(FALLBACK).toBe('Bip… se me ha cruzado un cable. ¿Me lo repites?');
  });

  it('never streams unsafe partial text to the screen', async () => {
    const shown: string[] = [];
    await askSafely(
      async (onToken) => {
        onToken('Eres');
        onToken('Eres una mierda');
        return 'Eres una mierda';
      },
      (text) => shown.push(text),
    );
    expect(shown.length).toBe(MAX_ATTEMPTS);
    expect(shown.every((text) => text === 'Eres')).toBe(true);
  });
});
