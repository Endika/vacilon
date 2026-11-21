import type { NeuralVoice, Voice } from './ports';
import type { Speaking } from './speaking';

export interface VoiceStartupDeps {
  voice: Pick<Voice, 'unlock' | 'prepare'>;
  neural: NeuralVoice;
  speaking: Pick<Speaking, 'resume'>;
  /** True when the device has a voice of its own to speak with. */
  systemVoice: () => boolean;
  onLoading(loading: boolean): void;
}

/**
 * The device's own voice comes first; the neural voice is only built when there is none. It waits for
 * the first gesture (audio needs it) and for the brain, so the two downloads never compete.
 */
export class VoiceStartup {
  private gestured = false;
  private brainReady = false;
  private audioOpen = false;
  private started = false;

  constructor(private readonly deps: VoiceStartupDeps) {}

  gesture(): void {
    if (this.gestured) return;
    this.gestured = true;
    this.deps.voice.unlock();
    this.audioOpen = this.deps.neural.open();
    this.prepare();
    this.deps.speaking.resume();
  }

  brainLoaded(): void {
    this.brainReady = true;
    this.prepare();
  }

  private prepare(): void {
    if (this.started || !this.gestured || !this.brainReady || !this.audioOpen) return;
    this.started = true;
    if (this.deps.systemVoice()) return;
    this.deps.onLoading(true);
    void this.deps.voice
      .prepare(() => this.deps.neural.build())
      .finally(() => this.deps.onLoading(false));
  }
}
