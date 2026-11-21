import { pickVoice } from './voices';
import type { SpeakHandlers, Speaker } from '../../application/ports';

export const PITCH = 1.5;
export const RATE = 1.05;
const GUARD_BASE_MS = 2_000;
const GUARD_PER_CHAR_MS = 110;

/** The phone's own voice through speechSynthesis. */
export class Tts implements Speaker {
  readonly name = 'speechSynthesis';
  readonly startsWithAudio = false;
  private readonly synth: SpeechSynthesis | null = window.speechSynthesis ?? null;
  private unlocked = false;
  private current = 0;

  get canSpeak(): boolean {
    return this.synth !== null && this.synth.getVoices().length > 0;
  }

  unlock(): void {
    if (this.unlocked || !this.synth) return;
    this.unlocked = true;
    const silent = new SpeechSynthesisUtterance(' ');
    silent.volume = 0;
    this.synth.speak(silent);
  }

  cancel(): void {
    this.current++;
    this.synth?.cancel();
  }

  speak(text: string, handlers: SpeakHandlers): void {
    const synth = this.synth;
    if (!synth) return handlers.onEnd();
    this.cancel();
    const id = this.current;
    const utterance = this.utterance(text);
    let done = false;
    const finish = (): void => {
      if (done || id !== this.current) return;
      done = true;
      handlers.onEnd();
    };
    utterance.onstart = () => handlers.onStart?.();
    utterance.onboundary = () => handlers.onBoundary?.();
    utterance.onend = finish;
    utterance.onerror = finish;
    window.setTimeout(finish, GUARD_BASE_MS + text.length * GUARD_PER_CHAR_MS);
    synth.speak(utterance);
  }

  private utterance(text: string): SpeechSynthesisUtterance {
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickVoice(this.synth?.getVoices() ?? []);
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang ?? 'es-ES';
    utterance.pitch = PITCH;
    utterance.rate = RATE;
    return utterance;
  }
}
