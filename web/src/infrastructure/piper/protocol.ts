export type ToWorker =
  { type: 'load'; base: string } | { type: 'speak'; id: number; text: string } | { type: 'cancel' };

export type FromWorker =
  | { type: 'progress'; loaded: number; total: number | null }
  | { type: 'ready'; bytes: number; ms: number }
  | { type: 'chunk'; id: number; pcm: Float32Array; sampleRate: number }
  | { type: 'done'; id: number }
  | { type: 'error'; id: number | null; message: string };
