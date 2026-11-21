export type WorkerRequest =
  { type: 'load'; baseUrl: string; seed?: number } | { type: 'reply'; text: string };

export type WorkerResponse =
  | { type: 'progress'; loaded: number; total: number | null }
  | { type: 'ready' }
  | { type: 'token'; text: string; count: number }
  | { type: 'done'; text: string }
  | { type: 'error'; message: string };
