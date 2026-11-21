import { afterEach, describe, expect, it, vi } from 'vitest';
import { PiperClient, type WorkerLike } from '../../../src/infrastructure/piper/client';
import type { SynthesisEvents } from '../../../src/infrastructure/piper/client';
import type { FromWorker, ToWorker } from '../../../src/infrastructure/piper/protocol';
import {
  PiperSpeaker,
  type Output,
  type Synthesizer,
} from '../../../src/infrastructure/piper/speaker';

class FakeSynth implements Synthesizer {
  events: SynthesisEvents | null = null;
  cancels = 0;
  speak(_text: string, events: SynthesisEvents): void {
    this.events = events;
  }
  cancel(): void {
    this.cancels++;
  }
}

class FakeOut implements Output {
  queued: { pcm: Float32Array; ended: () => void }[] = [];
  watching = false;
  stops = 0;
  remaining = 0.5;
  onLevel: (level: number) => void = () => undefined;
  enqueue(pcm: Float32Array, _sampleRate: number, ended: () => void): void {
    this.queued.push({ pcm, ended });
  }
  remainingSeconds(): number {
    return this.remaining;
  }
  watchLevel(onLevel: (level: number) => void): void {
    this.watching = true;
    this.onLevel = onLevel;
  }
  stopWatching(): void {
    this.watching = false;
  }
  stop(): void {
    this.stops++;
    this.watching = false;
  }
  unlock(): void {}
}

function setup() {
  const synth = new FakeSynth();
  const out = new FakeOut();
  const speaker = new PiperSpeaker(synth, out);
  const events: string[] = [];
  const levels: number[] = [];
  const handlers = {
    onStart: () => events.push('start'),
    onLevel: (level: number) => levels.push(level),
    onEnd: () => events.push('end'),
    onFail: () => events.push('fail'),
  };
  return { synth, out, speaker, events, levels, handlers };
}

afterEach(() => vi.useRealTimers());

describe('PiperSpeaker', () => {
  it('starts with the first chunk, reports the level and ends after the last chunk finishes', () => {
    const { synth, out, speaker, events, levels, handlers } = setup();
    speaker.speak('hola', handlers);
    expect(events).toEqual([]);
    synth.events?.onChunk(new Float32Array(10), 22050);
    expect(events).toEqual(['start']);
    expect(out.watching).toBe(true);
    out.onLevel(0.4);
    expect(levels).toEqual([0.4]);
    synth.events?.onChunk(new Float32Array(10), 22050);
    synth.events?.onDone();
    out.queued[0].ended();
    expect(events).toEqual(['start']);
    out.queued[1].ended();
    expect(events).toEqual(['start', 'end']);
    expect(out.watching).toBe(false);
  });

  it('ends at once when there is nothing to say', () => {
    const { synth, speaker, events, handlers } = setup();
    speaker.speak('...', handlers);
    synth.events?.onDone();
    expect(events).toEqual(['end']);
  });

  it('plays a chunk that arrives after the previous one finished', () => {
    const { synth, out, speaker, events, handlers } = setup();
    speaker.speak('uno. dos.', handlers);
    synth.events?.onChunk(new Float32Array(10), 22050);
    out.queued[0].ended();
    expect(events).toEqual(['start']);
    synth.events?.onChunk(new Float32Array(10), 22050);
    synth.events?.onDone();
    out.queued[1].ended();
    expect(events).toEqual(['start', 'end']);
  });

  it('ignores everything from a cancelled utterance', () => {
    const { synth, out, speaker, events, handlers } = setup();
    speaker.speak('uno', handlers);
    const old = synth.events;
    speaker.cancel();
    old?.onChunk(new Float32Array(10), 22050);
    old?.onDone();
    expect(out.queued).toHaveLength(0);
    expect(events).toEqual([]);
    expect(synth.cancels).toBeGreaterThan(0);
    expect(out.stops).toBeGreaterThan(0);
  });

  it('reports a synthesis error through onFail and stops the audio', () => {
    const { synth, out, speaker, events, handlers } = setup();
    speaker.speak('hola', handlers);
    synth.events?.onError('boom');
    expect(events).toEqual(['fail']);
    expect(out.watching).toBe(false);
  });

  it('uses onEnd when the caller gave no onFail', () => {
    const { synth, speaker, events, handlers } = setup();
    speaker.speak('hola', { onEnd: handlers.onEnd });
    synth.events?.onError('boom');
    expect(events).toEqual(['end']);
  });

  it('does not hang if the audio never reports the end (suspended context)', () => {
    vi.useFakeTimers();
    const { synth, out, speaker, events, handlers } = setup();
    speaker.speak('hola', handlers);
    synth.events?.onChunk(new Float32Array(10), 22050);
    synth.events?.onDone();
    expect(events).toEqual(['start']);
    vi.advanceTimersByTime(out.remaining * 1000 + 1_600);
    expect(events).toEqual(['start', 'end']);
  });
});

class FakeWorker implements WorkerLike {
  sent: ToWorker[] = [];
  terminated = false;
  onmessage: ((event: { data: FromWorker }) => void) | null = null;
  onerror: ((event: { message?: string }) => void) | null = null;
  postMessage(message: ToWorker): void {
    this.sent.push(message);
  }
  terminate(): void {
    this.terminated = true;
  }
  emit(data: FromWorker): void {
    this.onmessage?.({ data });
  }
}

describe('PiperClient', () => {
  it('loads, reporting progress, and resolves with the worker report', async () => {
    const worker = new FakeWorker();
    const client = new PiperClient(worker);
    const progress: [number, number | null][] = [];
    const loading = client.load('http://x/voice/', (loaded, total) =>
      progress.push([loaded, total]),
    );
    expect(worker.sent[0]).toEqual({ type: 'load', base: 'http://x/voice/' });
    worker.emit({ type: 'progress', loaded: 5, total: 10 });
    worker.emit({ type: 'ready', bytes: 10, ms: 1234 });
    expect(await loading).toEqual({ bytes: 10, ms: 1234 });
    expect(progress).toEqual([[5, 10]]);
  });

  it('rejects the load when the worker fails', async () => {
    const worker = new FakeWorker();
    const client = new PiperClient(worker);
    const loading = client.load('b/', () => undefined);
    worker.emit({ type: 'error', id: null, message: 'wasm trap' });
    await expect(loading).rejects.toThrow('wasm trap');
  });

  it('rejects the load on an uncaught worker error', async () => {
    const worker = new FakeWorker();
    const client = new PiperClient(worker);
    const loading = client.load('b/', () => undefined);
    worker.onerror?.({ message: 'script failed' });
    await expect(loading).rejects.toThrow('script failed');
  });

  it('routes chunks of the current synthesis only', () => {
    const worker = new FakeWorker();
    const client = new PiperClient(worker);
    const got: string[] = [];
    const events: SynthesisEvents = {
      onChunk: (pcm) => got.push(`chunk${pcm.length}`),
      onDone: () => got.push('done'),
      onError: (m) => got.push(`error:${m}`),
    };
    client.speak('uno', events);
    client.speak('dos', events);
    const [first, second] = worker.sent.filter((m) => m.type === 'speak');
    expect(first.type === 'speak' && second.type === 'speak' && second.id > first.id).toBe(true);
    expect(worker.sent.some((m) => m.type === 'cancel')).toBe(true);
    worker.emit({ type: 'chunk', id: 1, pcm: new Float32Array(3), sampleRate: 22050 });
    expect(got).toEqual([]);
    worker.emit({ type: 'chunk', id: 2, pcm: new Float32Array(4), sampleRate: 22050 });
    worker.emit({ type: 'done', id: 2 });
    expect(got).toEqual(['chunk4', 'done']);
  });

  it('sends a synthesis error to the current synthesis', () => {
    const worker = new FakeWorker();
    const client = new PiperClient(worker);
    const got: string[] = [];
    client.speak('uno', {
      onChunk: () => undefined,
      onDone: () => undefined,
      onError: (m) => got.push(m),
    });
    worker.emit({ type: 'error', id: 1, message: 'oom' });
    expect(got).toEqual(['oom']);
  });
});
