import data from './guardrails.json';
import { normalizeForFilter } from './safety';
import type { Rng } from '../random';

export interface Intent {
  id: string;
  patterns: RegExp[];
  responses: string[];
}

interface IntentJson {
  id: string;
  patterns: string[];
  responses: string[];
}

export function parseGuardrails(intents: IntentJson[]): Intent[] {
  return intents.map((i) => ({
    id: i.id,
    patterns: i.patterns.map((p) => new RegExp(p)),
    responses: i.responses,
  }));
}

export const GUARDRAILS = parseGuardrails(data.intents);

export function matchIntent(message: string, intents: Intent[] = GUARDRAILS): Intent | null {
  const text = normalizeForFilter(message);
  return intents.find((i) => i.patterns.some((p) => p.test(text))) ?? null;
}

export function fixedReply(
  message: string,
  rng: Rng,
  intents: Intent[] = GUARDRAILS,
): string | null {
  const intent = matchIntent(message, intents);
  return intent ? intent.responses[Math.floor(rng() * intent.responses.length)] : null;
}
