import type { FromWorker, ToWorker } from './protocol';

export interface SynthesisEvents {
  onChunk(pcm: Float32Array, sampleRate: number): void;
  onDone(): void;
  onError(message: string): void;
}

export interface WorkerLike {
  postMessage(message: ToWorker): void;
  onmessage: ((event: { data: FromWorker }) => void) | null;
  onerror: ((event: { message?: string }) => void) | null;
  terminate(): void;
}

export interface LoadReport {
  bytes: number;
  ms: number;
}

/** Talks to the synthesis worker: one load, then one synthesis at a time. */
export class PiperClient {
  private nextId = 1;
  private current: { id: number; events: SynthesisEvents } | null = null;
  private loading: {
    resolve: (report: LoadReport) => void;
    reject: (error: Error) => void;
    onProgress: (loaded: number, total: number | null) => void;
  } | null = null;

  constructor(private readonly worker: WorkerLike) {
    worker.onmessage = (event) => this.handle(event.data);
    worker.onerror = (event) => this.fail(event.message ?? 'worker error');
  }

  load(
    base: string,
    onProgress: (loaded: number, total: number | null) => void,
  ): Promise<LoadReport> {
    return new Promise((resolve, reject) => {
      this.loading = { resolve, reject, onProgress };
      this.worker.postMessage({ type: 'load', base });
    });
  }

  speak(text: string, events: SynthesisEvents): void {
    this.cancel();
    const id = this.nextId++;
    this.current = { id, events };
    this.worker.postMessage({ type: 'speak', id, text });
  }

  cancel(): void {
    if (!this.current) return;
    this.current = null;
    this.worker.postMessage({ type: 'cancel' });
  }

  dispose(): void {
    this.worker.terminate();
  }

  private handle(message: FromWorker): void {
    if (message.type === 'progress') return this.loading?.onProgress(message.loaded, message.total);
    if (message.type === 'ready') {
      this.loading?.resolve({ bytes: message.bytes, ms: message.ms });
      this.loading = null;
      return;
    }
    if (message.type === 'error' && message.id === null) return this.fail(message.message);
    const current = this.current;
    if (!current || ('id' in message && message.id !== current.id)) return;
    if (message.type === 'chunk') current.events.onChunk(message.pcm, message.sampleRate);
    else if (message.type === 'done') {
      this.current = null;
      current.events.onDone();
    } else if (message.type === 'error') {
      this.current = null;
      current.events.onError(message.message);
    }
  }

  private fail(message: string): void {
    const loading = this.loading;
    this.loading = null;
    loading?.reject(new Error(message));
    const current = this.current;
    this.current = null;
    current?.events.onError(message);
  }
}
