export const BUBBLE_SCALES = [1, 0.85, 0.72, 0.6, 0.5] as const;

export function bubbleScaleIndex(length: number): number {
  if (length <= 70) return 0;
  if (length <= 110) return 1;
  if (length <= 150) return 2;
  if (length <= 200) return 3;
  return 4;
}
