import { describe, expect, it } from 'vitest';
import { MAX_MESSAGE, clampMessage } from '../../../src/domain/conversation/message';

describe('clampMessage', () => {
  it('limits messages to 200 characters', () => {
    expect(MAX_MESSAGE).toBe(200);
    expect(clampMessage('a'.repeat(500))).toHaveLength(200);
  });

  it('keeps short messages and trims spaces', () => {
    expect(clampMessage('  hola chispa  ')).toBe('hola chispa');
  });

  it('returns an empty string for blank input', () => {
    expect(clampMessage('    ')).toBe('');
  });

  it('does not split emoji in half', () => {
    const text = '😀'.repeat(250);
    expect(Array.from(clampMessage(text))).toHaveLength(200);
    expect(clampMessage(text).endsWith('😀')).toBe(true);
  });
});
