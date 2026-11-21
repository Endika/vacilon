import { describe, expect, it } from 'vitest';
import { VoiceSelector } from '../../../src/infrastructure/voice/selector';
import type { SpeakHandlers, Speaker } from '../../../src/application/ports';

class FakeSpeaker implements Speaker {
  spoken: string[] = [];
  cancels = 0;
  unlocks = 0;
  failWith: 'before-start' | 'after-start' | null = null;
  canSpeak = true;

  constructor(
    readonly name: string,
    readonly startsWithAudio = false,
  ) {}

  unlock(): void {
    this.unlocks++;
  }

  cancel(): void {
    this.cancels++;
  }

  speak(text: string, handlers: SpeakHandlers): void {
    this.spoken.push(text);
    if (this.failWith === 'before-start') return handlers.onFail?.();
    handlers.onStart?.();
    if (this.failWith === 'after-start') return handlers.onFail?.();
    handlers.onEnd();
  }
}

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

function setup() {
  const system = new FakeSpeaker('speechSynthesis');
  const logs: string[] = [];
  const storage = memoryStorage();
  const voice = new VoiceSelector(system, storage, (message) => logs.push(message));
  const events: string[] = [];
  const handlers: SpeakHandlers = {
    onStart: () => events.push('start'),
    onEnd: () => events.push('end'),
  };
  return { system, voice, logs, storage, events, handlers };
}

describe('choosing the engine', () => {
  it('starts with the system voice', () => {
    const { voice, system, handlers } = setup();
    voice.speak('hola', handlers);
    expect(voice.name).toBe('speechSynthesis');
    expect(system.spoken).toEqual(['hola']);
  });

  it('switches to the neural voice by itself once it is ready', async () => {
    const { voice, system, handlers } = setup();
    const neural = new FakeSpeaker('piper', true);
    expect(await voice.prepare(() => Promise.resolve(neural))).toBe(true);
    voice.speak('hola', handlers);
    expect(voice.name).toBe('piper');
    expect(voice.startsWithAudio).toBe(true);
    expect(neural.spoken).toEqual(['hola']);
    expect(system.spoken).toEqual([]);
  });

  it('keeps speaking with the system voice while the neural one is still loading', async () => {
    const { voice, system, handlers } = setup();
    let release: (speaker: Speaker) => void = () => undefined;
    const pending = voice.prepare(() => new Promise<Speaker>((resolve) => (release = resolve)));
    voice.speak('uno', handlers);
    expect(system.spoken).toEqual(['uno']);
    release(new FakeSpeaker('piper', true));
    await pending;
    expect(voice.name).toBe('piper');
  });

  it('stays with the system voice and logs when the neural one cannot load', async () => {
    const { voice, system, handlers, logs } = setup();
    const ok = await voice.prepare(() => Promise.reject(new Error('wasm: out of memory')));
    expect(ok).toBe(false);
    expect(logs).toHaveLength(1);
    voice.speak('hola', handlers);
    expect(system.spoken).toEqual(['hola']);
  });

  it('falls back and retries the same text when the neural voice fails before any sound', async () => {
    const { voice, system, handlers, logs, events } = setup();
    const neural = new FakeSpeaker('piper', true);
    neural.failWith = 'before-start';
    await voice.prepare(() => Promise.resolve(neural));
    voice.speak('hola', handlers);
    expect(system.spoken).toEqual(['hola']);
    expect(events).toEqual(['start', 'end']);
    expect(voice.name).toBe('speechSynthesis');
    expect(logs).toHaveLength(1);
    voice.speak('otra', handlers);
    expect(neural.spoken).toEqual(['hola']);
    expect(system.spoken).toEqual(['hola', 'otra']);
  });

  it('ends cleanly, without repeating the text, when it fails after sound started', async () => {
    const { voice, system, handlers, events } = setup();
    const neural = new FakeSpeaker('piper', true);
    neural.failWith = 'after-start';
    await voice.prepare(() => Promise.resolve(neural));
    voice.speak('hola', handlers);
    expect(system.spoken).toEqual([]);
    expect(events).toEqual(['start', 'end']);
    expect(voice.name).toBe('speechSynthesis');
  });

  it('ends when even the system voice fails', () => {
    const { voice, system, handlers, events } = setup();
    system.failWith = 'before-start';
    voice.speak('hola', handlers);
    expect(system.spoken).toEqual(['hola']);
    expect(events).toEqual(['end']);
  });
});

describe('mute applies to both voices', () => {
  it('cancels whatever is playing and cannot speak while muted', async () => {
    const { voice, system } = setup();
    const neural = new FakeSpeaker('piper', true);
    await voice.prepare(() => Promise.resolve(neural));
    voice.setMuted(true);
    expect(voice.canSpeak).toBe(false);
    expect(neural.cancels).toBe(1);
    expect(system.cancels).toBe(1);
    voice.setMuted(false);
    expect(voice.canSpeak).toBe(true);
  });

  it('remembers the choice in storage', () => {
    const { voice, storage, system } = setup();
    voice.setMuted(true);
    const again = new VoiceSelector(system, storage);
    expect(again.muted).toBe(true);
  });

  it('cannot speak when the active engine cannot', () => {
    const { voice, system } = setup();
    system.canSpeak = false;
    expect(voice.canSpeak).toBe(false);
  });

  it('unlocks both engines inside the gesture', async () => {
    const { voice, system } = setup();
    const neural = new FakeSpeaker('piper', true);
    await voice.prepare(() => Promise.resolve(neural));
    voice.unlock();
    expect(neural.unlocks).toBe(1);
    expect(system.unlocks).toBe(1);
  });
});
