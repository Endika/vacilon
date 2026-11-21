import { describe, expect, it } from 'vitest';
import {
  LENGTH_SCALE,
  PITCH_FACTOR,
  ROBOT_DEPTH,
  ROBOT_RATE_HZ,
} from '../../../src/infrastructure/piper/config';
import { normalize, pitchUp, robotize } from '../../../src/infrastructure/piper/effects';

const ramp = (n: number): Float32Array => Float32Array.from({ length: n }, (_, i) => i);

describe('approved voice settings', () => {
  it('match the sample the owner chose', () => {
    expect([LENGTH_SCALE, PITCH_FACTOR, ROBOT_DEPTH, ROBOT_RATE_HZ]).toEqual([1.3, 1.3, 0.22, 48]);
  });
});

describe('pitchUp', () => {
  it('shortens the signal by the factor', () => {
    const out = pitchUp(new Float32Array(22_051), 1.3);
    expect(out.length).toBe(Math.ceil(22_050 / 1.3));
    expect(out.length / 22_050).toBeCloseTo(1 / 1.3, 3);
  });

  it('interpolates linearly: on a ramp, sample i is i times the factor', () => {
    const out = pitchUp(ramp(101), 1.3);
    for (const i of [0, 1, 7, 50, out.length - 1]) expect(out[i]).toBeCloseTo(i * 1.3, 4);
  });

  it('raises a sine by the factor', () => {
    const sr = 22_050;
    const sine = Float32Array.from({ length: sr }, (_, i) =>
      Math.sin((2 * Math.PI * 440 * i) / sr),
    );
    const out = pitchUp(sine, 1.3);
    let crossings = 0;
    for (let i = 1; i < out.length; i++) if (out[i - 1] < 0 && out[i] >= 0) crossings++;
    const hz = crossings / (out.length / sr);
    expect(hz).toBeGreaterThan(440 * 1.3 * 0.99);
    expect(hz).toBeLessThan(440 * 1.3 * 1.01);
  });

  it('copes with empty and one-sample input', () => {
    expect(pitchUp(new Float32Array(0), 1.3).length).toBe(0);
    expect(pitchUp(new Float32Array(1), 1.3).length).toBe(0);
  });
});

describe('robotize', () => {
  const ones = (n: number): Float32Array => new Float32Array(n).fill(1);

  it('follows 1 - depth + depth * sin(2 pi f t)', () => {
    const x = ones(8);
    robotize(x, 192, 0.22, 48);
    const expected = [0.78, 1, 0.78, 0.56, 0.78, 1, 0.78, 0.56];
    expected.forEach((value, i) => expect(x[i]).toBeCloseTo(value, 5));
  });

  it('keeps the phase continuous across chunks through the offset', () => {
    const whole = ones(10);
    robotize(whole, 192, 0.22, 48);
    const head = ones(4);
    const tail = ones(6);
    robotize(head, 192, 0.22, 48, 0);
    robotize(tail, 192, 0.22, 48, 4);
    expect([...head, ...tail]).toEqual([...whole]);
  });

  it('never leaves the 1 - 2 depth to 1 band', () => {
    const x = ones(22_050);
    robotize(x, 22_050, 0.22, 48);
    expect(Math.min(...x)).toBeGreaterThanOrEqual(0.56 - 1e-6);
    expect(Math.max(...x)).toBeLessThanOrEqual(1 + 1e-6);
  });
});

describe('normalize', () => {
  it('scales the peak to the target, keeping the sign', () => {
    const x = Float32Array.from([0.1, -0.5, 0.25]);
    normalize(x, 0.9);
    expect(x[1]).toBeCloseTo(-0.9, 6);
    expect(x[0]).toBeCloseTo(0.18, 6);
  });

  it('leaves silence silent', () => {
    const x = new Float32Array(4);
    normalize(x, 0.9);
    expect([...x]).toEqual([0, 0, 0, 0]);
  });
});
