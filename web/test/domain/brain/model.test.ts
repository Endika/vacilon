import { describe, expect, it } from 'vitest';
import { GPT } from '../../../src/domain/brain/model';
import { readFixture, readModel } from '../../load';

interface Case {
  ids: number[];
  argmax: number;
  top_indices: number[];
  top_values: number[];
}

const { manifest, weights } = readModel();
const model = GPT.fromBuffers(manifest, weights);
const cases = readFixture<Case[]>('logits.json');

describe('forward pass parity with numpy', () => {
  it.each(cases.map((c, i) => [i, c] as const))('sequence %i', (_i, c) => {
    const logits = model.feed(c.ids, model.newCache());
    let best = 0;
    logits.forEach((v, i) => {
      if (v > (logits[best] as number)) best = i;
    });
    expect(best).toBe(c.argmax);
    c.top_indices.forEach((index, rank) => {
      expect(Math.abs((logits[index] as number) - (c.top_values[rank] as number))).toBeLessThan(
        1e-3,
      );
    });
  });

  it('rejects sequences longer than the block size', () => {
    const cache = model.newCache();
    expect(() =>
      model.feed(new Array<number>(manifest.config.block_size + 1).fill(5), cache),
    ).toThrow();
  });
});
