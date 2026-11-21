import { describe, expect, it } from 'vitest';
import { GUARDRAILS, fixedReply, matchIntent } from '../../../src/domain/conversation/guardrails';
import { readFixture } from '../../load';

interface Case {
  message: string;
  intent: string | null;
}

const cases = readFixture<Case[]>('guardrails.json');

describe('guardrails parity with the Python certification', () => {
  it.each(cases)('$message -> $intent', ({ message, intent }) => {
    expect(matchIntent(message)?.id ?? null).toBe(intent);
  });
});

describe('fixedReply', () => {
  it('picks one of the matching intent responses', () => {
    const miedo = GUARDRAILS.find((i) => i.id === 'miedo');
    expect(miedo?.responses).toContain(fixedReply('tengo miedo', () => 0.99));
  });

  it('leaves small talk to the model', () => {
    expect(fixedReply('me gusta el helado', () => 0)).toBeNull();
  });
});
