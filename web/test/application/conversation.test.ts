import { describe, expect, it } from 'vitest';
import { Conversation, type ConversationDeps } from '../../src/application/conversation';
import { Names } from '../../src/application/names';
import { FALLBACK } from '../../src/domain/phrases';
import { WELCOME_AND_ASK } from '../../src/domain/names/phrases';
import { PASS, type FollowUp, type Stage, type Trick } from '../../src/domain/tricks/types';

function setup(overrides: Partial<ConversationDeps> = {}) {
  const events: string[] = [];
  const stage: Stage = {
    say: async (text) => void events.push(`say:${text}`),
    show: () => undefined,
    play: async () => undefined,
    dance: () => undefined,
  };
  const deps: ConversationDeps = {
    brain: { reply: async (text) => `eco ${text}` },
    stage,
    tricks: [],
    names: new Names({ store: { load: () => [], save: () => undefined }, rng: () => 0 }),
    bubble: {
      set: (text) => void events.push(`bubble:${text}`),
      thinking: (on) => void events.push(`thinking:${on}`),
    },
    speaking: { silence: () => void events.push('silence') },
    face: {
      activity: () => void events.push('activity'),
      startThinking: () => void events.push('startThinking'),
    },
    onAccepted: () => void events.push('accepted'),
    onBusy: (busy) => void events.push(`busy:${busy}`),
    followQuestion: () => null,
    ...overrides,
  };
  return { conversation: new Conversation(deps), events };
}

const tell = (run: Trick['run']): Trick => ({ id: 'tell', triggers: [/\bcuento\b/], run });

describe('Conversation', () => {
  it('greets through the stage', () => {
    const { conversation, events } = setup();
    conversation.greet();
    expect(events).toEqual([`say:${WELCOME_AND_ASK}`]);
  });

  it('ignores empty messages and clamps long ones', async () => {
    const asked: string[] = [];
    const { conversation, events } = setup({
      brain: {
        reply: async (text) => {
          asked.push(text);
          return 'vale';
        },
      },
    });
    await conversation.submit('   ');
    expect(events).toEqual([]);
    await conversation.submit('a'.repeat(300));
    expect(asked[0]).toHaveLength(200);
  });

  it('answers with the brain, locking while it works', async () => {
    const { conversation, events } = setup();
    const done = conversation.submit('hola');
    expect(conversation.busy).toBe(true);
    await done;
    expect(conversation.busy).toBe(false);
    expect(events).toEqual([
      'accepted',
      'busy:true',
      'silence',
      'bubble:',
      'activity',
      'startThinking',
      'thinking:true',
      'thinking:false',
      'say:eco hola',
      'thinking:false',
      'busy:false',
    ]);
  });

  it('refuses a second message while busy', async () => {
    let release: () => void = () => undefined;
    const { conversation, events } = setup({
      brain: { reply: () => new Promise<string>((resolve) => (release = () => resolve('ok'))) },
    });
    const first = conversation.submit('uno');
    await conversation.submit('dos');
    expect(events.filter((e) => e === 'accepted')).toHaveLength(1);
    release();
    await first;
  });

  it('shows the fallback when the brain fails and keeps going', async () => {
    const { conversation, events } = setup({
      brain: {
        reply: async () => {
          throw new Error('boom');
        },
      },
    });
    await conversation.submit('hola');
    expect(events).toContain(`say:${FALLBACK}`);
    expect(conversation.busy).toBe(false);
  });

  it('runs a trick and then routes the next message to its follow-up', async () => {
    const heard: string[] = [];
    const followUp: FollowUp = async (text) => {
      heard.push(text);
      return null;
    };
    const { conversation, events } = setup({
      tricks: [tell(async () => followUp)],
    });
    await conversation.submit('un cuento');
    await conversation.submit('la respuesta');
    expect(heard).toEqual(['la respuesta']);
    expect(events.some((e) => e === 'say:eco la respuesta')).toBe(false);
    await conversation.submit('otra cosa');
    expect(events).toContain('say:eco otra cosa');
  });

  it('hands the message to the brain when the follow-up passes and keeps nothing open', async () => {
    const { conversation, events } = setup({
      tricks: [tell(async () => async () => PASS)],
    });
    await conversation.submit('un cuento');
    await conversation.submit('otra cosa');
    expect(events).toContain('say:eco otra cosa');
    await conversation.submit('y más');
    expect(events).toContain('say:eco y más');
  });

  it('keeps the follow-up a follow-up hands back', async () => {
    const heard: string[] = [];
    const again: FollowUp = async (text) => {
      heard.push(text);
      return again;
    };
    const { conversation } = setup({ tricks: [tell(async () => again)] });
    await conversation.submit('un cuento');
    await conversation.submit('uno');
    await conversation.submit('dos');
    expect(heard).toEqual(['uno', 'dos']);
  });

  it('reacts to the answer of a question she asked, and leaves other replies to the brain', async () => {
    const asked: string[] = [];
    const { conversation, events } = setup({
      brain: { reply: async () => '¿De qué color es tu mochila?' },
      followQuestion: (reply) => {
        asked.push(reply);
        return async (text, stage) => {
          if (text !== 'rosa') return PASS;
          await stage.say('¡Rosa!');
          return null;
        };
      },
    });
    await conversation.submit('hola');
    expect(asked).toEqual(['¿De qué color es tu mochila?']);
    await conversation.submit('rosa');
    expect(events).toContain('say:¡Rosa!');

    events.length = 0;
    await conversation.submit('hola');
    await conversation.submit('no sé');
    expect(events.filter((e) => e.startsWith('say:'))).toEqual([
      'say:¿De qué color es tu mochila?',
      'say:¿De qué color es tu mochila?',
    ]);
  });
});
