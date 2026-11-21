import { describe, expect, it } from 'vitest';
import { respell, standardVocabulary } from '../../../src/domain/brain/spelling';
import { readFixture } from '../../load';

interface Fixture {
  respell: {
    word: string;
    vocabulary: string[];
    aliases: Record<string, string>;
    expected: string;
  }[];
  standardVocabulary: {
    words: string[];
    aliases: Record<string, string>;
    keep: string[];
    expected: string[];
  };
}

const data = readFixture<Fixture>('spelling.json');
const VOCAB = new Set(['mucho', 'tengo', 'hola', 'quiero', 'aburro', 'perro', 'pero', 'chispa']);
const ALIASES = { tng: 'tengo', q: 'que' };

describe('spelling parity with the Python implementation', () => {
  it.each(data.respell)('$word', ({ word, vocabulary, aliases, expected }) => {
    expect(respell(word, new Set(vocabulary), aliases)).toBe(expected);
  });

  it('builds the same standard vocabulary', () => {
    const { words, aliases, keep, expected } = data.standardVocabulary;
    expect([...standardVocabulary(words, aliases, new Set(keep))].sort()).toEqual(expected);
  });
});

describe('respell', () => {
  it.each([
    ['muxo', 'mucho'],
    ['tng', 'tengo'],
    ['holaaa', 'hola'],
    ['kiero', 'quiero'],
    ['aburrooo', 'aburro'],
    ['perrito', 'perro'],
    ['chispita', 'chispa'],
  ])('%s -> %s', (word, expected) => {
    expect(respell(word, VOCAB, ALIASES)).toBe(expected);
  });

  it('never touches known words, short vowel runs or unknown words', () => {
    expect(respell('perro', VOCAB, ALIASES)).toBe('perro');
    expect(respell('lee', new Set(['le']), {})).toBe('lee');
    expect(respell('zarandaja', VOCAB, ALIASES)).toBe('zarandaja');
  });

  it('keeps deliberate spellings in the standard vocabulary', () => {
    const words = ['hola', 'holaa', 'holaaa', 'kiero', 'quiero', 'tirita', 'tira'];
    expect([...standardVocabulary(words, {}, new Set(['holaaa', 'tirita']))].sort()).toEqual([
      'hola',
      'holaaa',
      'quiero',
      'tira',
      'tirita',
    ]);
  });
});
