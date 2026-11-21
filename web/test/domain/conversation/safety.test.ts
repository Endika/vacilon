import { describe, expect, it } from 'vitest';
import { isSafe, normalizeForFilter } from '../../../src/domain/conversation/safety';

describe('isSafe', () => {
  it('accepts friendly sentences', () => {
    expect(isSafe('¡Bip! Soy Chispa, una robot huevito que flota.')).toBe(true);
    expect(isSafe('Me encanta el helado de cono y los pulpos.')).toBe(true);
  });

  it('rejects swear words, with or without accents and case', () => {
    expect(isSafe('Eso es una mierda')).toBe(false);
    expect(isSafe('¡JODER!')).toBe(false);
    expect(isSafe('Qué coño dices')).toBe(false);
    expect(isSafe('Eres un CABRÓN')).toBe(false);
  });

  it('rejects ugly insults', () => {
    expect(isSafe('Eres idiota')).toBe(false);
    expect(isSafe('qué estúpido')).toBe(false);
  });

  it('matches whole words only', () => {
    expect(isSafe('Mi computadora no es una disputada')).toBe(true);
    expect(isSafe('El peculiar culominador')).toBe(true);
    expect(isSafe('Una pelota en el estupendo parque')).toBe(true);
    expect(isSafe('Vamos a pedir un pedido')).toBe(true);
  });

  it('keeps the enye distinct so cone is not coño', () => {
    expect(normalizeForFilter('coño')).not.toBe(normalizeForFilter('cono'));
    expect(isSafe('un cono de helado')).toBe(true);
    expect(isSafe('el año del cono')).toBe(true);
  });

  it('sees words glued to punctuation', () => {
    expect(isSafe('hola,mierda!')).toBe(false);
    expect(isSafe('(puta)')).toBe(false);
  });
});
