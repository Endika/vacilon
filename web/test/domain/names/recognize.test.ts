import { describe, expect, it } from 'vitest';
import { bookFrom, EMPTY_BOOK } from '../../../src/domain/names/book';
import { recognize } from '../../../src/domain/names/recognize';

const present = (...names: string[]) => ({ kind: 'present', names });
const known = bookFrom(['Mérida', 'Irune']);

describe('recognize', () => {
  it.each([
    ['me llamo Irune', present('Irune')],
    ['Me llamo irune.', present('Irune')],
    ['mi nombre es Ana María', present('Ana María')],
    ['hola, me llamo Ángela', present('Ángela')],
    ['me llamo MÉRIDA', present('Mérida')],
  ])('introduces %s', (text, intent) => {
    expect(recognize(text, EMPTY_BOOK, 'none')).toEqual(intent);
  });

  it('reads soy only when awaiting a name or when the name is known', () => {
    expect(recognize('soy Irune', EMPTY_BOOK, 'none')).toBeNull();
    expect(recognize('soy zurda', EMPTY_BOOK, 'none')).toBeNull();
    expect(recognize('soy zurda', known, 'none')).toBeNull();
    expect(recognize('soy Lucía', EMPTY_BOOK, 'name')).toEqual(present('Lucía'));
    expect(recognize('ahora soy irune', known, 'none')).toEqual(present('Irune'));
    expect(recognize('soy merida', known, 'none')).toEqual(present('Merida'));
  });

  it('reads a bare name only when awaiting, and only if it looks like one', () => {
    expect(recognize('Irune', EMPTY_BOOK, 'none')).toBeNull();
    expect(recognize('Irune', EMPTY_BOOK, 'name')).toEqual(present('Irune'));
    for (const text of ['no quiero', 'sí', 'nada', 'vale', 'hola', 'Irune 7', 'una dos tres', '']) {
      expect(recognize(text, EMPTY_BOOK, 'name')).toBeNull();
    }
  });

  it('rejects unsafe names', () => {
    expect(recognize('me llamo mierda', EMPTY_BOOK, 'none')).toEqual({ kind: 'unsafe' });
    expect(recognize('culo', EMPTY_BOOK, 'name')).toEqual({ kind: 'unsafe' });
    expect(recognize('me llamo caca', EMPTY_BOOK, 'none')).toEqual({ kind: 'unsafe' });
    expect(recognize('pedo', EMPTY_BOOK, 'name')).toEqual({ kind: 'unsafe' });
    expect(recognize('me llamo Mocos Pis', EMPTY_BOOK, 'none')).toEqual({ kind: 'unsafe' });
  });

  it('keeps accents and capitalizes each word', () => {
    expect(recognize('me llamo josé ángel', EMPTY_BOOK, 'none')).toEqual(present('José Ángel'));
  });

  it.each([
    ['Mérida e Irune', ['Mérida', 'Irune']],
    ['irune y merida', ['Irune', 'Mérida']],
    ['las dos', ['Mérida', 'Irune']],
    ['los dos', ['Mérida', 'Irune']],
    ['somos las dos', ['Mérida', 'Irune']],
    ['todas', ['Mérida', 'Irune']],
    ['todos', ['Mérida', 'Irune']],
    ['soy Irune', ['Irune']],
    ['Irune', ['Irune']],
  ])('answers who is here: %s', (text, names) => {
    expect(recognize(text, known, 'who')).toEqual(present(...names));
  });

  it('does not take las dos as an answer with fewer than two names', () => {
    expect(recognize('las dos', bookFrom(['Irune']), 'who')).toBeNull();
  });

  it('recognizes forget commands and who-am-I questions', () => {
    expect(recognize('olvida mi nombre', known, 'none')).toEqual({ kind: 'forgetMine' });
    expect(recognize('olvida los nombres', known, 'none')).toEqual({ kind: 'forgetAll' });
    expect(recognize('olvida todos los nombres', known, 'none')).toEqual({ kind: 'forgetAll' });
    for (const text of ['¿cómo me llamo?', '¿sabes cómo me llamo?', '¿quién soy?']) {
      expect(recognize(text, known, 'none')).toEqual({ kind: 'whoAmI' });
    }
  });
});
