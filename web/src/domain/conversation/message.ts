export const MAX_MESSAGE = 200;

export function clampMessage(text: string): string {
  return Array.from(text.trim()).slice(0, MAX_MESSAGE).join('');
}
