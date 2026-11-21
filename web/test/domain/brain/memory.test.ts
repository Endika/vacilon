import { describe, expect, it } from 'vitest';
import { Memory, type Pair } from '../../../src/domain/brain/memory';
import { Chispa } from '../../../src/domain/brain/chispa';
import { readFixture } from '../../load';

interface Fixture {
  pairs: Pair[];
  cases: { message: string; score: number; candidates: string[] }[];
}

const data = readFixture<Fixture>('memory.json');
const memory = new Memory(data.pairs);
const RAIN = [
  '¡Bip! Qué bien, a mí me encantan los charcos.',
  'Con la lluvia me brillan más los ojitos.',
];

describe('memory parity with the Python implementation', () => {
  it.each(data.cases)('$message', ({ message, score, candidates }) => {
    const found = memory.lookup(message);
    expect(Number(found.best.toFixed(4))).toBe(score);
    expect([...found.candidates].sort()).toEqual(candidates);
  });
});

describe('recall', () => {
  it('recalls a reply above the threshold', () => {
    expect(memory.recall('voy al parque con mamá', [], () => 0)).toBe(
      '¡Yo flotaría contigo por el parque!',
    );
  });

  it('falls through below the threshold', () => {
    expect(memory.recall('he montado un lego enorme', [], () => 0)).toBeNull();
    expect(memory.recall('mi tortuga come lechuga', [], () => 0)).toBeNull();
  });

  it('sees through fillers and kid spelling', () => {
    expect(RAIN).toContain(memory.recall('oye chispa hoy llueveee muxo', [], () => 0));
  });

  it('picks among near-tied candidates', () => {
    const seen = new Set([0, 0.99].map((r) => memory.recall('hoy llueve mucho', [], () => r)));
    expect([...seen].sort()).toEqual([...RAIN].sort());
  });

  it('avoids recent replies when possible', () => {
    expect(memory.recall('hoy llueve mucho', [RAIN[0]], () => 0)).toBe(RAIN[1]);
    expect(RAIN).toContain(memory.recall('hoy llueve mucho', RAIN, () => 0));
  });

  it('recalls nothing from an empty memory', () => {
    expect(new Memory().recall('hoy llueve mucho', [], () => 0)).toBeNull();
  });
});

describe('Chispa with memory', () => {
  it('answers from memory before the model and remembers it', () => {
    const v = new Chispa(null, null, { generator: () => 'modelo', memory, seed: 0 });
    expect(v.reply('me voy al parque')).toBe('¡Yo flotaría contigo por el parque!');
    expect(v.reply('he montado un lego enorme')).toBe('modelo');
  });
});
