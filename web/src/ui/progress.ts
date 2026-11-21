export function progressRatio(loaded: number, total: number | null): number | null {
  if (total === null || total <= 0) return null;
  return Math.min(1, loaded / total);
}
