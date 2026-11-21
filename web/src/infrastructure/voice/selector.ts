import { loadMuted, saveMuted } from './mute';
import type { SpeakHandlers, Speaker, Voice } from '../../application/ports';

type Log = (message: string, detail?: unknown) => void;

/** Speaks with the best engine ready, keeps the mute switch for all of them. */
export class VoiceSelector implements Voice {
  private active: Speaker;
  muted: boolean;

  constructor(
    private readonly fallback: Speaker,
    private readonly storage: (Pick<Storage, 'getItem'> & Pick<Storage, 'setItem'>) | null,
    private readonly log: Log = (message, detail) => console.warn(message, detail),
  ) {
    this.active = fallback;
    this.muted = loadMuted(storage);
  }

  get name(): string {
    return this.active.name;
  }

  get startsWithAudio(): boolean {
    return this.active.startsWithAudio;
  }

  get canSpeak(): boolean {
    return !this.muted && this.active.canSpeak;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    saveMuted(this.storage, muted);
    if (muted) this.cancel();
  }

  unlock(): void {
    this.active.unlock();
    if (this.active !== this.fallback) this.fallback.unlock();
  }

  cancel(): void {
    this.active.cancel();
    if (this.active !== this.fallback) this.fallback.cancel();
  }

  /** Builds the better engine in the background and switches to it; failure keeps the current one. */
  async prepare(build: () => Promise<Speaker>): Promise<boolean> {
    try {
      this.active = await build();
      return true;
    } catch (error) {
      this.log('The neural voice is not available, keeping the system voice.', error);
      return false;
    }
  }

  speak(text: string, handlers: SpeakHandlers): void {
    const engine = this.active;
    let started = false;
    engine.speak(text, {
      ...handlers,
      onStart: () => {
        started = true;
        handlers.onStart?.();
      },
      onFail: () => {
        this.log(`The ${engine.name} voice failed.`);
        if (engine !== this.fallback && this.active === engine) this.active = this.fallback;
        if (started || engine === this.fallback) return handlers.onEnd();
        this.fallback.speak(text, handlers);
      },
    });
  }
}
