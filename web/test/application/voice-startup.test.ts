import { describe, expect, it } from 'vitest';
import type { NeuralVoice, Speaker } from '../../src/application/ports';
import { VoiceStartup } from '../../src/application/voice-startup';

const piper = { name: 'piper' } as Speaker;

function setup(audio = true, systemVoice = false) {
  const events: string[] = [];
  const neural: NeuralVoice = {
    open: () => (events.push('open'), audio),
    build: async () => (events.push('build'), piper),
  };
  const startup = new VoiceStartup({
    voice: {
      unlock: () => void events.push('unlock'),
      prepare: async (build) => (events.push('prepare'), await build(), true),
    },
    neural,
    speaking: { resume: () => void events.push('resume') },
    systemVoice: () => systemVoice,
    onLoading: (loading) => void events.push(`loading:${loading}`),
  });
  return { startup, events };
}

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve));

describe('VoiceStartup', () => {
  it('waits for both the gesture and the brain before building the neural voice', async () => {
    const { startup, events } = setup();
    startup.gesture();
    expect(events).toEqual(['unlock', 'open', 'resume']);
    startup.brainLoaded();
    await flush();
    expect(events).toEqual([
      'unlock',
      'open',
      'resume',
      'loading:true',
      'prepare',
      'build',
      'loading:false',
    ]);
  });

  it('works in the other order and only once', async () => {
    const { startup, events } = setup();
    startup.brainLoaded();
    expect(events).toEqual([]);
    startup.gesture();
    startup.gesture();
    await flush();
    expect(events.filter((e) => e === 'build')).toHaveLength(1);
    expect(events.filter((e) => e === 'unlock')).toHaveLength(1);
  });

  it('keeps the system voice when the audio output cannot open', async () => {
    const { startup, events } = setup(false);
    startup.gesture();
    startup.brainLoaded();
    await flush();
    expect(events).not.toContain('build');
  });

  it('keeps the device voice and skips the neural download when the device has one', async () => {
    const { startup, events } = setup(true, true);
    startup.gesture();
    startup.brainLoaded();
    await flush();
    expect(events).toEqual(['unlock', 'open', 'resume']);
  });
});
