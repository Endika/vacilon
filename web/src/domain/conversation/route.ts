import { matchIntent } from './guardrails';
import { matchTrick } from '../tricks/registry';
import type { Trick } from '../tricks/types';

export type Route = 'brain' | 'names' | 'followUp' | { trick: Trick };

/** Serious topics and identity questions go to the brain first, then names, then tricks and follow-ups. */
export function route(
  text: string,
  ctx: { pendingFollowUp: boolean; tricks: Trick[]; aboutNames: boolean },
): Route {
  if (matchIntent(text)) return 'brain';
  if (ctx.aboutNames) return 'names';
  const trick = matchTrick(text, ctx.tricks);
  if (trick) return { trick };
  return ctx.pendingFollowUp ? 'followUp' : 'brain';
}
