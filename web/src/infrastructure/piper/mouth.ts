const GAIN = 5;

/** RMS of the samples scaled so that normal speech sits around 0.4 to 1. */
export function mouthLevel(samples: ArrayLike<number>): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.min(1, Math.sqrt(sum / samples.length) * GAIN);
}
