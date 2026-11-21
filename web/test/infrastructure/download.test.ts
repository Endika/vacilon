import { describe, expect, it } from 'vitest';
import { readWithProgress } from '../../src/infrastructure/download';
import { progressRatio } from '../../src/ui/progress';

function streamed(chunks: Uint8Array[], headers: HeadersInit = {}): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
  return new Response(stream, { headers });
}

describe('readWithProgress', () => {
  it('reports cumulative bytes against content-length and returns all bytes', async () => {
    const chunks = [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5]), new Uint8Array([6])];
    const seen: [number, number | null][] = [];
    const buffer = await readWithProgress(streamed(chunks, { 'content-length': '6' }), (l, t) =>
      seen.push([l, t]),
    );
    expect(Array.from(new Uint8Array(buffer))).toEqual([1, 2, 3, 4, 5, 6]);
    expect(seen).toEqual([
      [3, 6],
      [5, 6],
      [6, 6],
    ]);
  });

  it('reports an unknown total without content-length', async () => {
    const seen: (number | null)[] = [];
    await readWithProgress(streamed([new Uint8Array(4)]), (_l, t) => seen.push(t));
    expect(seen).toEqual([null]);
  });
});

describe('progressRatio', () => {
  it('maps bytes to a 0..1 ratio, capped', () => {
    expect(progressRatio(50, 200)).toBe(0.25);
    expect(progressRatio(300, 200)).toBe(1);
  });

  it('is null when the total is unknown', () => {
    expect(progressRatio(50, null)).toBeNull();
    expect(progressRatio(50, 0)).toBeNull();
  });
});
