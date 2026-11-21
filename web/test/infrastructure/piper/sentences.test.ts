import { describe, expect, it } from 'vitest';
import { splitSentences } from '../../../src/infrastructure/piper/sentences';

describe('splitSentences', () => {
  it('splits on . ! ? and keeps the opening ¡ and ¿ with their sentence', () => {
    expect(splitSentences('¡Hola, mi niña! ¿Qué tal estás? Muy bien.')).toEqual([
      '¡Hola, mi niña!',
      '¿Qué tal estás?',
      'Muy bien.',
    ]);
  });

  it('splits after an ellipsis and keeps it with the previous part', () => {
    expect(splitSentences('Bueno... casi nunca me mareo… Pero a veces sí.')).toEqual([
      'Bueno...',
      'casi nunca me mareo…',
      'Pero a veces sí.',
    ]);
  });

  it('treats repeated marks as one terminator', () => {
    expect(splitSentences('¡¡Qué susto!! ¿¿En serio??')).toEqual(['¡¡Qué susto!!', '¿¿En serio??']);
  });

  it('does not split after common abbreviations', () => {
    expect(splitSentences('La Sra. López vive con el Dr. Gómez. Se llevan bien.')).toEqual([
      'La Sra. López vive con el Dr. Gómez.',
      'Se llevan bien.',
    ]);
    expect(splitSentences('Me gustan los gatos, p. ej. los negros. Y tú?')).toEqual([
      'Me gustan los gatos, p. ej. los negros.',
      'Y tú?',
    ]);
    expect(splitSentences('Viaja a EE. UU. en avión. Qué guay.')).toEqual([
      'Viaja a EE. UU. en avión.',
      'Qué guay.',
    ]);
  });

  it('splits after etc. only when a capital follows', () => {
    expect(splitSentences('Tengo lápices, gomas, etc. y más cosas.')).toEqual([
      'Tengo lápices, gomas, etc. y más cosas.',
    ]);
    expect(splitSentences('Tengo lápices, gomas, etc. Luego juego.')).toEqual([
      'Tengo lápices, gomas, etc.',
      'Luego juego.',
    ]);
  });

  it('keeps initials and decimals inside the sentence', () => {
    expect(splitSentences('Me lo dijo J. R. Pérez ayer.')).toEqual([
      'Me lo dijo J. R. Pérez ayer.',
    ]);
    expect(splitSentences('Pesa 3.5 kilos. Es mucho.')).toEqual(['Pesa 3.5 kilos.', 'Es mucho.']);
  });

  it('splits a long sentence at commas into chunks of about 60 characters', () => {
    const long =
      'Primero me fui al salón, luego miré debajo del sofá, después flote hasta la cocina, ' +
      'más tarde choqué con la lámpara, y al final me quedé quieta mirando la luna.';
    const parts = splitSentences(long);
    expect(parts.length).toBeGreaterThan(2);
    expect(parts.join(' ')).toBe(long);
    for (const part of parts) expect(part.length).toBeLessThanOrEqual(90);
    for (const part of parts.slice(0, -1)) expect(part.endsWith(',')).toBe(true);
  });

  it('leaves a short sentence with commas whole', () => {
    expect(splitSentences('Pues, mira, no sé.')).toEqual(['Pues, mira, no sé.']);
  });

  it('keeps text without any terminator and drops chunks with no letters', () => {
    expect(splitSentences('hola chispa')).toEqual(['hola chispa']);
    expect(splitSentences('¿Sí? ... !!')).toEqual(['¿Sí?']);
    expect(splitSentences('   ')).toEqual([]);
    expect(splitSentences('')).toEqual([]);
  });
});
