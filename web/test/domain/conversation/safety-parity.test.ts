import { describe, expect, it } from 'vitest';
import { isSafe } from '../../../src/domain/conversation/safety';
import { readFixture } from '../../load';

interface Case {
  text: string;
  safe: boolean;
}

const cases = readFixture<Case[]>('safety.json');

describe('filter parity with the Python certification', () => {
  it.each(cases)('$text -> safe=$safe', ({ text, safe }) => {
    expect(isSafe(text)).toBe(safe);
  });
});
