import { describe, expect, it } from 'vitest';
import { BUBBLE_SCALES, bubbleScaleIndex } from '../../src/ui/bubble-size';

describe('bubbleScaleIndex', () => {
  it('keeps short text at full size', () => {
    expect(bubbleScaleIndex(0)).toBe(0);
    expect(bubbleScaleIndex(70)).toBe(0);
  });
  it('never grows with longer text', () => {
    let last = 0;
    for (let n = 0; n <= 400; n += 1) {
      const i = bubbleScaleIndex(n);
      expect(i).toBeGreaterThanOrEqual(last);
      expect(i).toBeLessThan(BUBBLE_SCALES.length);
      last = i;
    }
  });
  it('uses the smallest step beyond 200 characters', () => {
    expect(bubbleScaleIndex(201)).toBe(BUBBLE_SCALES.length - 1);
  });
});
