import { describe, expect, it } from 'vitest';
import { Tokenizer } from '../../../src/domain/brain/tokenizer';
import { readFixture, readModel } from '../../load';

interface Case {
  text: string;
  ids: number[];
  decoded: string;
}

const tokenizer = new Tokenizer(readModel().tokenizer);
const cases = readFixture<Case[]>('tokenizer.json');

describe('tokenizer parity with the Python tokenizer', () => {
  it('has 200 fixtures', () => expect(cases).toHaveLength(200));

  it.each(cases.map((c, i) => [i, JSON.stringify(c.text), c] as const))(
    'fixture %i %s',
    (_i, _label, c) => {
      const ids = tokenizer.encode(c.text);
      expect(ids).toEqual(c.ids);
      expect(tokenizer.decode(ids)).toBe(c.decoded);
    },
  );

  it('recognizes special tokens as single units', () => {
    expect(tokenizer.encode('<u>hola<b>')[0]).toBe(1);
    expect(tokenizer.encode('<eos>')).toEqual([3]);
  });
});
