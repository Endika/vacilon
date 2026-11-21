import { describe, expect, it } from 'vitest';
import {
  Listening,
  MAX_LISTEN_MS,
  NO_SPEECH_MS,
  type StartTimer,
} from '../../src/application/listening';
import type { Capture, Engine } from '../../src/application/ports';
import { NOT_HEARD } from '../../src/domain/ear/phrases';

class FakeEngine implements Engine {
  final = 'hola chispa';
  onPartial: (text: string) => void = () => undefined;
  onPause: () => void = () => undefined;

  async load(): Promise<void> {}
  begin(onPartial: (text: string) => void, onPause: () => void): void {
    this.onPartial = onPartial;
    this.onPause = onPause;
  }
  feed(): void {}
  async finish(): Promise<string> {
    return this.final;
  }
}

class FakeCapture implements Capture {
  running = false;
  async start(): Promise<void> {
    this.running = true;
  }
  stop(): void {
    this.running = false;
  }
}

class FakeClock {
  private pending: Array<{ at: number; run: () => void }> = [];
  private now = 0;

  readonly timer: StartTimer = (run, ms) => {
    const entry = { at: this.now + ms, run };
    this.pending.push(entry);
    return () => {
      this.pending = this.pending.filter((other) => other !== entry);
    };
  };

  advance(ms: number): void {
    this.now += ms;
    const due = this.pending.filter((entry) => entry.at <= this.now);
    this.pending = this.pending.filter((entry) => entry.at > this.now);
    for (const entry of due) entry.run();
  }

  get scheduled(): number {
    return this.pending.length;
  }
}

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

function setup({ canListen = true } = {}) {
  const engine = new FakeEngine();
  const capture = new FakeCapture();
  const clock = new FakeClock();
  const submitted: string[] = [];
  const said: string[] = [];
  const listening = new Listening({
    engine: () => engine,
    capture: () => capture,
    supported: () => true,
    face: {
      stopSpeaking: () => undefined,
      startListening: () => undefined,
      stopListening: () => undefined,
    },
    canListen: () => canListen,
    silence: () => undefined,
    submit: (text) => submitted.push(text),
    say: (text) => said.push(text),
    view: {
      loading: () => undefined,
      partial: () => undefined,
      listening: () => undefined,
      hide: () => undefined,
    },
    timer: clock.timer,
  });
  return { listening, engine, capture, clock, submitted, said };
}

describe('Listening', () => {
  it('starts on a tap and sends what it heard on the next tap', async () => {
    const { listening, capture, submitted } = setup();
    listening.toggle();
    await settle();
    expect(capture.running).toBe(true);

    listening.toggle();
    await settle();
    expect(capture.running).toBe(false);
    expect(submitted).toEqual(['hola chispa']);
  });

  it('stops by itself when the speaker pauses after talking', async () => {
    const { listening, engine, capture, clock, submitted } = setup();
    listening.toggle();
    await settle();
    engine.onPartial('hola');
    engine.onPause();
    await settle();
    expect(capture.running).toBe(false);
    expect(submitted).toEqual(['hola chispa']);
    expect(clock.scheduled).toBe(0);
  });

  it('gives up kindly when nothing is said in time', async () => {
    const { listening, engine, capture, clock, submitted, said } = setup();
    engine.final = '';
    listening.toggle();
    await settle();
    clock.advance(NO_SPEECH_MS);
    await settle();
    expect(capture.running).toBe(false);
    expect(submitted).toEqual([]);
    expect(said).toEqual([NOT_HEARD]);
  });

  it('keeps listening past the silence limit once something was heard, up to the hard limit', async () => {
    const { listening, engine, capture, clock, submitted } = setup();
    listening.toggle();
    await settle();
    engine.onPartial('había una vez');
    clock.advance(NO_SPEECH_MS);
    await settle();
    expect(capture.running).toBe(true);

    clock.advance(MAX_LISTEN_MS - NO_SPEECH_MS);
    await settle();
    expect(capture.running).toBe(false);
    expect(submitted).toEqual(['hola chispa']);
  });

  it('ignores taps while a message is being answered', async () => {
    const { listening, capture } = setup({ canListen: false });
    listening.toggle();
    await settle();
    expect(capture.running).toBe(false);
  });
});
