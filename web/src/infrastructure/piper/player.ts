import { mouthLevel } from './mouth';

const LEAD_S = 0.03;
const FFT_SIZE = 512;

export interface AudioOut {
  readonly currentTime: number;
  readonly destination: AudioNode;
  createBuffer(channels: number, length: number, sampleRate: number): AudioBuffer;
  createBufferSource(): AudioBufferSourceNode;
  createAnalyser(): AnalyserNode;
  resume(): Promise<void>;
}

/** Plays PCM chunks back to back on one clock and reports the real output level. */
export class ChunkPlayer {
  private analyser: AnalyserNode | null = null;
  private readonly samples = new Float32Array(FFT_SIZE);
  private nextStart = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private frame = 0;
  private onLevel: (level: number) => void = () => undefined;

  constructor(private readonly context: AudioOut) {}

  /** The context music reuses; null when it isn't a real AudioContext. */
  get audioContext(): AudioContext | null {
    return typeof AudioContext !== 'undefined' && this.context instanceof AudioContext
      ? this.context
      : null;
  }

  unlock(): void {
    void this.context.resume().catch(() => undefined);
    const silent = this.context.createBufferSource();
    silent.buffer = this.context.createBuffer(1, 1, 22050);
    silent.connect(this.context.destination);
    silent.start();
  }

  remainingSeconds(): number {
    return Math.max(0, this.nextStart - this.context.currentTime);
  }

  enqueue(pcm: Float32Array, sampleRate: number, onEnded?: () => void): void {
    const ctx = this.context;
    this.analyser ??= this.createAnalyser();
    const buffer = ctx.createBuffer(1, pcm.length, sampleRate);
    buffer.copyToChannel(pcm as Float32Array<ArrayBuffer>, 0);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.analyser);
    this.nextStart = Math.max(ctx.currentTime + LEAD_S, this.nextStart);
    source.onended = () => {
      this.sources.delete(source);
      onEnded?.();
    };
    source.start(this.nextStart);
    this.nextStart += buffer.duration;
    this.sources.add(source);
  }

  get playing(): boolean {
    return this.sources.size > 0;
  }

  watchLevel(onLevel: (level: number) => void): void {
    this.onLevel = onLevel;
    if (this.frame !== 0) return;
    const tick = (): void => {
      if (this.analyser) {
        this.analyser.getFloatTimeDomainData(this.samples);
        this.onLevel(mouthLevel(this.samples));
      }
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  stopWatching(): void {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.onLevel(0);
  }

  stop(): void {
    this.stopWatching();
    for (const source of this.sources) {
      source.onended = null;
      try {
        source.stop();
      } catch {
        // already stopped
      }
    }
    this.sources.clear();
    this.nextStart = 0;
  }

  private createAnalyser(): AnalyserNode {
    const analyser = this.context.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.connect(this.context.destination);
    return analyser;
  }
}
