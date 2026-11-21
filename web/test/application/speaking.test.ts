import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SpeakHandlers, Voice } from '../../src/application/ports';
import { Speaking } from '../../src/application/speaking';

function setup(options: { canSpeak?: boolean; startsWithAudio?: boolean } = {}) {
  const events: string[] = [];
  let handlers: SpeakHandlers | undefined;
  const voice: Voice = {
    name: 'fake',
    startsWithAudio: options.startsWithAudio ?? false,
    canSpeak: options.canSpeak ?? true,
    muted: false,
    setMuted(muted) {
      (this as { muted: boolean }).muted = muted;
    },
    prepare: async () => true,
    unlock: () => undefined,
    cancel: () => void events.push('cancel'),
    speak: (text, h) => {
      events.push(`speak:${text}`);
      handlers = h;
    },
  };
  const face = {
    startSpeaking: () => void events.push('startSpeaking'),
    stopSpeaking: () => void events.push('stopSpeaking'),
    syllable: () => void events.push('syllable'),
    setMouthLevel: (level: number) => void events.push(`level:${level}`),
  };
  return { speaking: new Speaking({ voice, face }), events, voice, handlers: () => handlers };
}

describe('Speaking', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('holds the last text until the first gesture, then speaks it', () => {
    const { speaking, events } = setup();
    void speaking.speak('uno');
    void speaking.speak('dos');
    expect(events).toEqual([]);
    speaking.resume();
    expect(events).toEqual(['startSpeaking', 'speak:dos']);
  });

  it('moves the mouth with the voice and resolves when it ends', async () => {
    const { speaking, events, handlers } = setup();
    speaking.resume();
    const spoken = speaking.speak('hola');
    handlers()?.onBoundary?.();
    handlers()?.onLevel?.(0.5);
    handlers()?.onEnd();
    await spoken;
    expect(events).toEqual([
      'startSpeaking',
      'speak:hola',
      'syllable',
      'level:0.5',
      'stopSpeaking',
    ]);
  });

  it('waits for the first sound when the voice starts with audio', () => {
    const { speaking, events, handlers } = setup({ startsWithAudio: true });
    speaking.resume();
    void speaking.speak('hola');
    expect(events).toEqual(['speak:hola']);
    handlers()?.onStart?.();
    expect(events).toEqual(['speak:hola', 'startSpeaking']);
  });

  it('mouths along in silence for a while when the voice cannot speak', async () => {
    const { speaking, events } = setup({ canSpeak: false });
    speaking.resume();
    const spoken = speaking.speak('hola');
    expect(events).toEqual(['startSpeaking']);
    await vi.advanceTimersByTimeAsync(4 * 55);
    await spoken;
    expect(events).toEqual(['startSpeaking', 'stopSpeaking']);
  });

  it('still resolves through the guard when the voice never ends', async () => {
    const { speaking } = setup();
    speaking.resume();
    const spoken = speaking.speak('hola');
    await vi.advanceTimersByTimeAsync(4 * 120 + 3000);
    await spoken;
  });

  it('toggling the mute silences the face', () => {
    const { speaking, events, voice } = setup();
    speaking.toggleMute();
    expect(voice.muted).toBe(true);
    expect(events).toEqual(['stopSpeaking']);
    speaking.toggleMute();
    expect(voice.muted).toBe(false);
  });
});
