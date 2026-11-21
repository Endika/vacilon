import type { Chispa } from '../../domain/brain/chispa';
import { loadChispa } from './load';
import type { WorkerRequest, WorkerResponse } from './protocol';

let chispa: Chispa | null = null;

function post(message: WorkerResponse): void {
  self.postMessage(message);
}

async function handle(request: WorkerRequest): Promise<void> {
  if (request.type === 'load') {
    chispa = await loadChispa(request.baseUrl, { seed: request.seed }, (loaded, total) =>
      post({ type: 'progress', loaded, total }),
    );
    post({ type: 'ready' });
    return;
  }
  if (!chispa) throw new Error('model not loaded');
  const text = chispa.reply(request.text, (t) => post({ type: 'token', ...t }));
  post({ type: 'done', text });
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  handle(event.data).catch((e: unknown) =>
    post({ type: 'error', message: e instanceof Error ? e.message : String(e) }),
  );
};
