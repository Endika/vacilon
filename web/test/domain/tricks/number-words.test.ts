import { describe, expect, it } from 'vitest';
import { findNumber, parseNumberWords } from '../../../src/domain/tricks/number-words';
import { spell } from './spell';

describe('number words', () => {
  it('reads every number from 0 to 999 back from its words', () => {
    for (let n = 0; n <= 999; n++) expect(findNumber(spell(n)), spell(n)).toBe(n);
  });

  it.each([
    ['ciento cuarenta y seis', 146],
    ['cien', 100],
    ['veintitres', 23],
    ['treinta y uno', 31],
    ['novecientos noventa y nueve', 999],
    ['cero', 0],
    ['quinientas', 500],
  ])('%s -> %i', (words, value) => {
    expect(parseNumberWords(words.split(' '))).toBe(value);
  });

  it.each([
    ['ciento'],
    ['cien tres'],
    ['treinta y'],
    ['treinta y treinta'],
    ['veinte y tres y'],
    ['cuarenta cinco'],
    ['ciento cero'],
    ['constructor'],
    ['ciento toString'],
  ])('rejects %s', (words) => {
    expect(parseNumberWords(words.split(' '))).toBeNull();
  });

  it('finds the number inside a sentence, with digits or words', () => {
    expect(findNumber('creo que son ciento cuarenta y seis')).toBe(146);
    expect(findNumber('es 146 seguro')).toBe(146);
    expect(findNumber('son cincuenta y dos manzanas')).toBe(52);
  });

  it('prefers digits and returns null when there is no number', () => {
    expect(findNumber('son 12 doce')).toBe(12);
    expect(findNumber('no tengo ni idea')).toBeNull();
    expect(findNumber('')).toBeNull();
  });
});
