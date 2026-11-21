import type { Song } from '../domain/tricks/content/types';
import type { ScheduledNote } from '../domain/tricks/music';

export interface SpeakHandlers {
  onStart?: () => void;
  onBoundary?: () => void;
  onLevel?: (level: number) => void;
  onEnd: () => void;
  /** The engine could not produce this utterance; the caller may retry with another one. */
  onFail?: () => void;
}

export interface Speaker {
  readonly name: string;
  /** True when `onStart` fires with the first sound, so the face can wait for it. */
  readonly startsWithAudio: boolean;
  readonly canSpeak: boolean;
  unlock(): void;
  speak(text: string, handlers: SpeakHandlers): void;
  cancel(): void;
}

/** The speaker the app talks through: the best engine ready, plus the mute switch. */
export interface Voice extends Speaker {
  readonly muted: boolean;
  setMuted(muted: boolean): void;
  /** Builds a better engine in the background and switches to it; resolves false when it fails. */
  prepare(build: () => Promise<Speaker>): Promise<boolean>;
}

/** The neural voice and the audio output it needs, which only exists after a user gesture. */
export interface NeuralVoice {
  /** Opens the audio output; false when the browser has none. */
  open(): boolean;
  build(): Promise<Speaker>;
}

export interface Brain {
  reply(text: string, onToken: (text: string) => void): Promise<string>;
}

export interface Bubble {
  set(text: string): void;
  thinking(on: boolean): void;
}

export const SAMPLE_RATE = 16000;

export interface Engine {
  /** Reports the model download as a fraction between 0 and 1. */
  load(onProgress: (fraction: number) => void): Promise<void>;
  /** Starts an utterance; `onPartial` receives the text recognised so far. */
  begin(onPartial: (text: string) => void): void;
  /** Takes 16 kHz mono samples. */
  feed(chunk: Float32Array): void;
  /** Ends the utterance and resolves with the final text. */
  finish(): Promise<string>;
}

export interface Capture {
  /** Rejects with a `NotAllowedError` when the microphone is denied. */
  start(onChunk: (chunk: Float32Array) => void): Promise<void>;
  stop(): void;
}

export interface SongHandlers {
  onLine?(line: number): void;
  onNote?(note: ScheduledNote): void;
}

export interface SongPlayback {
  done: Promise<void>;
  stop(): void;
}

export type SongPlayer = (song: Song, handlers: SongHandlers) => SongPlayback;

export interface NameStore {
  load(): string[];
  save(names: readonly string[]): void;
}
