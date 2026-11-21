import type { SpeakHandlers, Speaker } from '../../application/ports';
import type { SynthesisEvents } from './client';

const END_MARGIN_MS = 1_500;

export interface Synthesizer {
  speak(text: string, events: SynthesisEvents): void;
  cancel(): void;
}

export interface Output {
  enqueue(pcm: Float32Array, sampleRate: number, onEnded: () => void): void;
  remainingSeconds(): number;
  watchLevel(onLevel: (level: number) => void): void;
  stopWatching(): void;
  stop(): void;
  unlock(): void;
}

export class PiperSpeaker implements Speaker {
  readonly name = 'piper';
  readonly startsWithAudio = true;
  readonly canSpeak = true;
  private generation = 0;

  constructor(
    private readonly synth: Synthesizer,
    private readonly out: Output,
  ) {}

  unlock(): void {
    this.out.unlock();
  }

  cancel(): void {
    this.generation++;
    this.synth.cancel();
    this.out.stop();
  }

  speak(text: string, handlers: SpeakHandlers): void {
    this.cancel();
    const generation = this.generation;
    let started = false;
    let finished = false;
    let ended = false;
    let pending = 0;
    let guard: ReturnType<typeof setTimeout> | undefined;

    const end = (): void => {
      if (ended || generation !== this.generation) return;
      ended = true;
      clearTimeout(guard);
      this.out.stopWatching();
      handlers.onEnd();
    };

    this.synth.speak(text, {
      onChunk: (pcm, sampleRate) => {
        if (generation !== this.generation) return;
        pending++;
        if (!started) {
          started = true;
          handlers.onStart?.();
          this.out.watchLevel((level) => handlers.onLevel?.(level));
        }
        this.out.enqueue(pcm, sampleRate, () => {
          pending--;
          if (finished && pending === 0) end();
        });
      },
      onDone: () => {
        if (generation !== this.generation) return;
        finished = true;
        if (pending === 0) return end();
        guard = setTimeout(end, this.out.remainingSeconds() * 1000 + END_MARGIN_MS);
      },
      onError: () => {
        if (generation !== this.generation) return;
        this.cancel();
        (handlers.onFail ?? handlers.onEnd)();
      },
    });
  }
}
