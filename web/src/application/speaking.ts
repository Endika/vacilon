import type { FaceMachine } from '../domain/face/machine';
import type { Voice } from './ports';

const SILENT_MS_PER_CHAR = 55;
const GUARD_MS_PER_CHAR = 120;
const GUARD_BASE_MS = 3000;

export interface SpeakingDeps {
  voice: Voice;
  face: Pick<FaceMachine, 'startSpeaking' | 'stopSpeaking' | 'syllable' | 'setMouthLevel'>;
}

/** Speaks with the voice while the face mouths along; holds back until the first user gesture. */
export class Speaking {
  private resumed = false;
  private pending: string | null = null;
  private silentTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly deps: SpeakingDeps) {}

  /** Resolves when speech ends, or after a safety timeout so a lost end never locks the UI. */
  speak(text: string): Promise<void> {
    const { voice, face } = this.deps;
    clearTimeout(this.silentTimer);
    if (!this.resumed) {
      this.pending = text;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      const end = (): void => {
        clearTimeout(guard);
        face.stopSpeaking();
        resolve();
      };
      const guard = setTimeout(end, text.length * GUARD_MS_PER_CHAR + GUARD_BASE_MS);
      if (!voice.canSpeak) {
        face.startSpeaking();
        this.silentTimer = setTimeout(end, text.length * SILENT_MS_PER_CHAR);
        return;
      }
      const waitsForAudio = voice.startsWithAudio;
      if (!waitsForAudio) face.startSpeaking();
      voice.speak(text, {
        onStart: () => waitsForAudio && face.startSpeaking(),
        onBoundary: () => face.syllable(),
        onLevel: (level) => face.setMouthLevel(level),
        onEnd: end,
      });
    });
  }

  /** Called on the first user gesture: speaks what was waiting for it. */
  resume(): void {
    this.resumed = true;
    const text = this.pending;
    this.pending = null;
    if (text !== null) void this.speak(text);
  }

  silence(): void {
    this.deps.voice.cancel();
    clearTimeout(this.silentTimer);
  }

  toggleMute(): void {
    const { voice, face } = this.deps;
    voice.setMuted(!voice.muted);
    if (voice.muted) face.stopSpeaking();
  }
}
