import { describe, expect, it } from 'vitest';
import { Ear, type EarLoading } from '../../src/application/ear';
import type { Capture, Engine } from '../../src/application/ports';

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

class FakeEngine implements Engine {
  gate?: ReturnType<typeof deferred>;
  final = 'hola chispa';
  fed = 0;
  begun = 0;
  onPartial: (text: string) => void = () => undefined;

  async load(onProgress: (fraction: number) => void): Promise<void> {
    onProgress(0.5);
    await this.gate?.promise;
  }
  begin(onPartial: (text: string) => void): void {
    this.begun++;
    this.onPartial = onPartial;
  }
  feed(): void {
    this.fed++;
  }
  async finish(): Promise<string> {
    return this.final;
  }
}

class FakeCapture implements Capture {
  running = false;
  starts = 0;
  failWith?: Error;
  gate?: ReturnType<typeof deferred>;
  emit: (chunk: Float32Array) => void = () => undefined;

  async start(onChunk: (chunk: Float32Array) => void): Promise<void> {
    this.starts++;
    await this.gate?.promise;
    if (this.failWith) throw this.failWith;
    this.running = true;
    this.emit = onChunk;
  }
  stop(): void {
    this.running = false;
  }
}

function setup(supported = true) {
  const engine = new FakeEngine();
  const capture = new FakeCapture();
  const engines: FakeEngine[] = [engine];
  const events: string[] = [];
  const loading: EarLoading[] = [];
  const partials: string[] = [];
  const ear = new Ear(
    {
      engine: () => engines.shift() ?? new FakeEngine(),
      capture: () => capture,
      supported: () => supported,
    },
    {
      onLoading: (state) => loading.push(state),
      onPartial: (text) => partials.push(text),
      onListening: (on) => events.push(on ? 'on' : 'off'),
    },
  );
  return { ear, engine, engines, capture, events, loading, partials };
}

describe('Ear', () => {
  it('reports availability from feature detection', () => {
    expect(setup(true).ear.available()).toBe(true);
    expect(setup(false).ear.available()).toBe(false);
  });

  it('returns unavailable on release when the browser cannot', async () => {
    const { ear, capture } = setup(false);
    await ear.press();
    expect(await ear.release()).toEqual({ kind: 'unavailable' });
    expect(capture.starts).toBe(0);
  });

  it('loads on first press, listens, streams partials and returns the text', async () => {
    const { ear, engine, capture, events, loading, partials } = setup();
    await ear.press();
    expect(loading).toEqual([
      { done: false, fraction: 0 },
      { done: false, fraction: 0.5 },
      { done: true },
    ]);
    expect(capture.running).toBe(true);
    expect(events).toEqual(['on']);

    capture.emit(new Float32Array(1600));
    engine.onPartial('hola');
    expect(engine.fed).toBe(1);
    expect(partials).toEqual(['hola']);

    expect(await ear.release()).toEqual({ kind: 'text', text: 'hola chispa' });
    expect(capture.running).toBe(false);
    expect(events).toEqual(['on', 'off']);
  });

  it('does not reload the engine on later presses', async () => {
    const { ear, loading, engine } = setup();
    await ear.press();
    await ear.release();
    const seen = loading.length;
    await ear.press();
    await ear.release();
    expect(loading).toHaveLength(seen);
    expect(engine.begun).toBe(2);
  });

  it('returns empty when nothing was recognised', async () => {
    const { ear, engine } = setup();
    engine.final = '  ';
    await ear.press();
    expect(await ear.release()).toEqual({ kind: 'empty' });
  });

  it('returns empty when released without a press', async () => {
    expect(await setup().ear.release()).toEqual({ kind: 'empty' });
  });

  it('ignores a press while already listening', async () => {
    const { ear, capture } = setup();
    await ear.press();
    await ear.press();
    expect(capture.starts).toBe(1);
    expect((await ear.release()).kind).toBe('text');
  });

  it('waits for the load on early release and never starts the capture', async () => {
    const { ear, engine, capture, events } = setup();
    engine.gate = deferred();
    const pressing = ear.press();
    const releasing = ear.release();
    engine.gate.resolve();
    await pressing;
    expect(await releasing).toEqual({ kind: 'empty' });
    expect(capture.starts).toBe(0);
    expect(events).toEqual([]);
  });

  it('stops a capture that finished starting after the release', async () => {
    const { ear, capture, events } = setup();
    capture.gate = deferred();
    const pressing = ear.press();
    await Promise.resolve();
    const releasing = ear.release();
    capture.gate.resolve();
    await pressing;
    expect(await releasing).toEqual({ kind: 'empty' });
    expect(capture.running).toBe(false);
    expect(events).toEqual([]);
  });

  it('reports denied when the microphone is refused', async () => {
    const { ear, capture, events } = setup();
    const refusal = new Error('refused');
    refusal.name = 'NotAllowedError';
    capture.failWith = refusal;
    await ear.press();
    expect(await ear.release()).toEqual({ kind: 'denied' });
    expect(events).toEqual([]);
  });

  it('reports error for other capture failures', async () => {
    const { ear, capture } = setup();
    capture.failWith = new Error('no device');
    await ear.press();
    expect(await ear.release()).toEqual({ kind: 'error' });
  });

  it('reports error when finishing fails', async () => {
    const { ear, engine } = setup();
    engine.finish = () => Promise.reject(new Error('worker died'));
    await ear.press();
    expect(await ear.release()).toEqual({ kind: 'error' });
  });

  it('reports error on a load failure and retries the load on the next press', async () => {
    const { ear, engine, engines, capture, loading } = setup();
    engine.gate = deferred();
    engine.gate.reject(new Error('offline'));
    const pressing = ear.press();
    const releasing = ear.release();
    await pressing;
    expect(await releasing).toEqual({ kind: 'error' });
    expect(loading.at(-1)).toEqual({ done: true });
    expect(capture.starts).toBe(0);

    engines.push(new FakeEngine());
    await ear.press();
    expect(capture.running).toBe(true);
    expect((await ear.release()).kind).toBe('text');
  });
});
