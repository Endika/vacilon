import { describe, expect, it } from 'vitest';
import { Conversation } from '../../src/application/conversation';
import { Names } from '../../src/application/names';
import type { NameStore } from '../../src/application/ports';
import { createTricks } from '../../src/domain/tricks/registry';
import { RIDDLES } from '../../src/domain/tricks/content/riddles';
import { UNKNOWN_NAME, WELCOME_AND_ASK } from '../../src/domain/names/phrases';
import { mulberry32 } from '../../src/domain/random';

function memoryStore(initial: string[] = []): NameStore & { saved: string[] } {
  const store = {
    saved: initial,
    load: () => store.saved,
    save: (names: readonly string[]) => void (store.saved = [...names]),
  };
  return store;
}

function setup(initial: string[] = []) {
  const store = memoryStore(initial);
  const names = new Names({ store, rng: () => 0 });
  const said: string[] = [];
  const brainHeard: string[] = [];
  const conversation = new Conversation({
    brain: {
      reply: async (text) => {
        brainHeard.push(text);
        return 'cerebro';
      },
    },
    stage: {
      say: async (text) => void said.push(text),
      show: () => undefined,
      play: async () => undefined,
      dance: () => undefined,
    },
    tricks: createTricks(mulberry32(3), () => names.current),
    names,
    bubble: { set: () => undefined, thinking: () => undefined },
    speaking: { silence: () => undefined },
    face: { activity: () => undefined, startThinking: () => undefined },
    onAccepted: () => undefined,
    onBusy: () => undefined,
    followQuestion: () => null,
  });
  const last = () => said[said.length - 1];
  return { conversation, store, said, brainHeard, last, names };
}

describe('names in conversation', () => {
  it('asks the name when none is known and learns the bare answer', async () => {
    const { conversation, last, store } = setup();
    conversation.greet();
    expect(last()).toBe(WELCOME_AND_ASK);
    await conversation.submit('Irune');
    expect(last()).toBe('¡Encantada, Irune! Ya me sé tu nombre: lo guardo en mi cáscara.');
    expect(store.saved).toEqual(['Irune']);
  });

  it('does not take a bare word as a name when nothing was asked', async () => {
    const { conversation, brainHeard, store } = setup();
    await conversation.submit('Irune');
    expect(brainHeard).toEqual(['Irune']);
    expect(store.saved).toEqual([]);
  });

  it('lets a message that is not a name follow its normal path', async () => {
    const { conversation, brainHeard } = setup();
    conversation.greet();
    await conversation.submit('no quiero');
    expect(brainHeard).toEqual(['no quiero']);
  });

  it('clears the question after any message', async () => {
    const { conversation, brainHeard } = setup();
    conversation.greet();
    await conversation.submit('me gusta el helado');
    await conversation.submit('Irune');
    expect(brainHeard).toEqual(['me gusta el helado', 'Irune']);
  });

  it('rejects an unsafe name, keeps asking and stores nothing', async () => {
    const { conversation, last, store } = setup();
    conversation.greet();
    await conversation.submit('me llamo mierda');
    expect(last()).toBe('¡Ese nombre no me lo creo! ¿Cómo te llamas de verdad?');
    expect(store.saved).toEqual([]);
    await conversation.submit('Irune');
    expect(store.saved).toEqual(['Irune']);
  });

  it('answers who am I with none, one and several names', async () => {
    const { conversation, last, brainHeard } = setup();
    await conversation.submit('¿cómo me llamo?');
    expect(last()).toBe(UNKNOWN_NAME);
    await conversation.submit('Irune');
    await conversation.submit('¿sabes cómo me llamo?');
    expect(last()).toBe('¡Eres Irune! Me acuerdo perfectamente.');
    await conversation.submit('me llamo Mérida');
    await conversation.submit('Mérida y Irune');
    expect(brainHeard).toEqual(['Mérida y Irune']);
  });

  it('greets a single known name and asks who is here with several', async () => {
    const one = setup(['Irune']);
    one.conversation.greet();
    expect(one.last()).toBe('¡Hola, Irune! ¡Qué alegría verte!');
    const two = setup(['Mérida', 'Irune']);
    two.conversation.greet();
    expect(two.last()).toBe('¡Hola! ¿Quién eres hoy: Mérida o Irune?');
    await two.conversation.submit('las dos');
    expect(two.last()).toBe('¡Hola, Mérida e Irune! Qué bien, compañía doble.');
    await two.conversation.submit('¿quién soy?');
    expect(two.last()).toBe('¡Sois Mérida e Irune! Me acuerdo perfectamente.');
  });

  it('answers who is here with one name, soy, and everyone', async () => {
    const three = setup(['Mérida', 'Irune', 'Lucía']);
    three.conversation.greet();
    expect(three.last()).toBe('¡Hola! ¿Quién eres hoy: Mérida, Irune o Lucía?');
    await three.conversation.submit('soy Irune');
    expect(three.last()).toBe('¡Hola, Irune! Te había echado de menos.');
    expect(three.store.saved[0]).toBe('Irune');
    three.conversation.greet();
    await three.conversation.submit('todas');
    expect(three.last()).toContain('¡Hola, Irune, Mérida y Lucía!');
  });

  it('forgets mine and all', async () => {
    const { conversation, last, store } = setup(['Mérida', 'Irune']);
    await conversation.submit('me llamo Irune');
    await conversation.submit('olvida mi nombre');
    expect(last()).toBe('Hecho, ya no me acuerdo de tu nombre. Si quieres, me lo vuelves a decir.');
    expect(store.saved).toEqual(['Mérida']);
    await conversation.submit('olvida los nombres');
    expect(last()).toBe('Hecho, he olvidado todos los nombres. Empezamos de cero.');
    expect(store.saved).toEqual([]);
  });

  it('lets a serious phrase beat a name introduction', async () => {
    const { conversation, brainHeard, store } = setup();
    await conversation.submit('me llamo Irune y tengo miedo');
    await conversation.submit('me llamo Irune, tengo miedo');
    expect(brainHeard).toHaveLength(2);
    expect(store.saved).toEqual([]);
  });

  it('praises a right riddle answer with the current names', async () => {
    const { conversation, said, names } = setup(['Mérida', 'Irune']);
    conversation.greet();
    await conversation.submit('las dos');
    expect(names.current).toEqual(['Mérida', 'Irune']);
    await conversation.submit('una adivinanza');
    const riddle = RIDDLES.find((r) => said[said.length - 1].endsWith(r.question));
    await conversation.submit(riddle?.answers[0] ?? '');
    expect(said[said.length - 1]).toMatch(/^¡Has acertado, Mérida e Irune! /);
  });
});
