import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../../src/domain/random';
import { FaceMachine, mouthForLevel } from '../../../src/domain/face/machine';
import { mouthLevel } from '../../../src/infrastructure/piper/mouth';

const sine = (amplitude: number, n = 512): Float32Array =>
  Float32Array.from({ length: n }, (_, i) => amplitude * Math.sin((2 * Math.PI * 8 * i) / n));

describe('mouthLevel', () => {
  it('is 0 for silence and for no samples', () => {
    expect(mouthLevel(new Float32Array(512))).toBe(0);
    expect(mouthLevel(new Float32Array(0))).toBe(0);
  });

  it('grows with the amplitude', () => {
    expect(mouthLevel(sine(0.1))).toBeLessThan(mouthLevel(sine(0.3)));
    expect(mouthLevel(sine(0.3))).toBeLessThan(mouthLevel(sine(0.9)) + 1e-9);
  });

  it('measures RMS: a sine of amplitude a gives a / sqrt(2) times the gain', () => {
    expect(mouthLevel(sine(0.2))).toBeCloseTo((0.2 / Math.SQRT2) * 5, 3);
  });

  it('is capped at 1', () => {
    expect(mouthLevel(new Float32Array(64).fill(1))).toBe(1);
  });
});

describe('mouthForLevel', () => {
  it('closes, half opens and opens with the level', () => {
    expect(mouthForLevel(0)).toBe('smile');
    expect(mouthForLevel(0.2)).toBe('small');
    expect(mouthForLevel(0.8)).toBe('open');
  });
});

describe('the face follows the audio level', () => {
  function setup() {
    let t = 1_000;
    const machine = new FaceMachine({ now: () => t, rng: mulberry32(3) });
    const step = (): void => {
      t += 80;
      machine.tick();
    };
    return { machine, step };
  }

  it('shows the loudest level of the last tick and relaxes when it drops', () => {
    const { machine, step } = setup();
    machine.startSpeaking();
    machine.setMouthLevel(0.05);
    machine.setMouthLevel(0.9);
    machine.setMouthLevel(0.2);
    step();
    expect(machine.view().mouth).toBe('open');
    machine.setMouthLevel(0.02);
    step();
    expect(machine.view().mouth).toBe('smile');
  });

  it('stays closed through silence instead of flapping on the syllable beat', () => {
    const { machine, step } = setup();
    machine.startSpeaking();
    machine.setMouthLevel(0);
    for (let i = 0; i < 10; i++) {
      step();
      expect(machine.view().mouth).toBe('smile');
    }
  });

  it('ignores levels when she is not speaking and resets on stop', () => {
    const { machine, step } = setup();
    machine.setMouthLevel(1);
    step();
    expect(machine.view().mouth).toBe('smile');
    machine.startSpeaking();
    machine.setMouthLevel(1);
    step();
    expect(machine.view().mouth).toBe('open');
    machine.stopSpeaking();
    step();
    expect(machine.view().mode).toBe('idle');
    expect(machine.view().mouth).toBe('smile');
  });
});
