import { FALLBACK } from '../domain/phrases';
import { isSafe } from '../domain/conversation/safety';

export const MAX_ATTEMPTS = 3;

export type TokenSink = (text: string) => void;
export type Ask = (onToken: TokenSink) => Promise<string>;

export async function askSafely(ask: Ask, onToken: TokenSink): Promise<string> {
  const show: TokenSink = (text) => {
    if (isSafe(text)) onToken(text);
  };
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const answer = await ask(show);
    if (isSafe(answer)) return answer;
  }
  return FALLBACK;
}
