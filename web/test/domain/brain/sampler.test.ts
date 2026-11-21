import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../../src/domain/random';
import { bannedByNgram, penalize, sampleNext } from '../../../src/domain/brain/sampler';

describe('bannedByNgram', () => {
  it('blocks the token that would repeat a trigram', () => {
    expect(bannedByNgram([5, 6, 7, 5, 6], 3)).toEqual(new Set([7]));
    expect(bannedByNgram([5, 6, 7], 3)).toEqual(new Set());
    expect(bannedByNgram([5], 3)).toEqual(new Set());
  });
});

describe('penalize', () => {
  it('lowers seen tokens and bans repeated n-grams', () => {
    const logits = Float32Array.from([2, -2, 2, 1, 0, 0, 0, 0]);
    const out = penalize(logits, [0, 1, 7, 0, 1], 2, 3);
    expect(out[0]).toBe(1);
    expect(out[1]).toBe(-4);
    expect(out[2]).toBe(2);
    expect(out[7]).toBe(-Infinity);
    expect(logits[0]).toBe(2);
  });
});

describe('sampleNext', () => {
  const opts = { temperature: 0.5, topK: 2, topP: 0 };

  it('is greedy at temperature 0', () => {
    const logits = Float32Array.from([0, 3, 1]);
    expect(sampleNext(logits, mulberry32(1), { ...opts, temperature: 0 })).toBe(1);
  });

  it('never picks outside the top-k', () => {
    const logits = Float32Array.from([5, 4, 3, 2, 1]);
    const rng = mulberry32(7);
    for (let i = 0; i < 200; i++) expect(sampleNext(logits, rng, opts)).toBeLessThan(2);
  });

  it('top-p keeps only the head of the distribution', () => {
    const logits = Float32Array.from([10, 0, 0, 0]);
    const rng = mulberry32(3);
    for (let i = 0; i < 50; i++) {
      expect(sampleNext(logits, rng, { temperature: 1, topK: 0, topP: 0.5 })).toBe(0);
    }
  });

  it('is deterministic for a seed', () => {
    const logits = Float32Array.from([1, 1, 1, 1]);
    const draw = (): number[] => {
      const rng = mulberry32(42);
      return Array.from({ length: 10 }, () => sampleNext(logits, rng, { ...opts, topK: 0 }));
    };
    expect(draw()).toEqual(draw());
  });
});
