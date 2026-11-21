import { describe, expect, it } from 'vitest';
import {
  bookFrom,
  EMPTY_BOOK,
  forgetAll,
  forgetCurrent,
  MAX_NAMES,
  use,
} from '../../../src/domain/names/book';
import { greet } from '../../../src/domain/names/greeting';
import { joinNames } from '../../../src/domain/names/join';
import { praise } from '../../../src/domain/names/praise';

describe('NameBook', () => {
  it('puts the name in use first', () => {
    const book = use(use(EMPTY_BOOK, ['Irune']), ['Mérida']);
    expect(book).toEqual({ known: ['Mérida', 'Irune'], current: ['Mérida'] });
  });

  it('switching to a known name updates recency and keeps its spelling', () => {
    const book = use(bookFrom(['Mérida', 'Irune']), ['irune']);
    expect(book.known).toEqual(['Irune', 'Mérida']);
    expect(book.current).toEqual(['Irune']);
  });

  it('keeps at most six names, dropping the least recently used', () => {
    let book = EMPTY_BOOK;
    for (const name of ['A1', 'B2', 'C3', 'D4', 'E5', 'F6', 'G7']) book = use(book, [name]);
    expect(book.known).toHaveLength(MAX_NAMES);
    expect(book.known).toEqual(['G7', 'F6', 'E5', 'D4', 'C3', 'B2']);
    const touched = use(book, ['B2']);
    expect(touched.known[0]).toBe('B2');
    expect(use(touched, ['H8']).known).not.toContain('C3');
  });

  it('sanitizes stored names', () => {
    expect(bookFrom(['Irune', 'irune', '', 'A', 'B', 'C', 'D', 'E', 'F']).known).toEqual([
      'Irune',
      'A',
      'B',
      'C',
      'D',
      'E',
    ]);
  });

  it('forgets the current names or everything', () => {
    const book = use(bookFrom(['Mérida', 'Irune']), ['Irune']);
    expect(forgetCurrent(book)).toEqual({ known: ['Mérida'], current: [] });
    expect(forgetAll()).toEqual(EMPTY_BOOK);
  });
});

describe('joinNames', () => {
  it.each([
    [['Irune'], 'and', 'Irune'],
    [['Mérida', 'Irune'], 'and', 'Mérida e Irune'],
    [['Irune', 'Mérida'], 'and', 'Irune y Mérida'],
    [['Mérida', 'Hilario'], 'and', 'Mérida e Hilario'],
    [['Mérida', 'Iago'], 'and', 'Mérida y Iago'],
    [['Mérida', 'Irune', 'Lucía'], 'or', 'Mérida, Irune o Lucía'],
    [['Irune', 'Olga'], 'or', 'Irune u Olga'],
    [['Irune', 'Mérida', 'Ana'], 'and', 'Irune, Mérida y Ana'],
  ] as const)('%j (%s)', (names, conjunction, expected) => {
    expect(joinNames(names, conjunction)).toBe(expected);
  });
});

describe('greet and praise', () => {
  const pick = () => '¡Hola, {x}!';
  it('asks for a name when none is known', () => {
    expect(greet(EMPTY_BOOK, pick)).toMatchObject({ awaiting: 'name' });
  });
  it('greets one known name and makes it current', () => {
    const result = greet(bookFrom(['Irune']), pick);
    expect(result.reply).toBe('¡Hola, Irune!');
    expect(result.book.current).toEqual(['Irune']);
  });
  it('asks who is here with several', () => {
    expect(greet(bookFrom(['Mérida', 'Irune']), pick)).toMatchObject({ awaiting: 'who' });
  });
  it('praises with the names, or nothing without them', () => {
    expect(praise(['Irune'])).toBe('¡Has acertado, Irune!');
    expect(praise(['Mérida', 'Irune'])).toBe('¡Has acertado, Mérida e Irune!');
    expect(praise([])).toBe('');
  });
});
