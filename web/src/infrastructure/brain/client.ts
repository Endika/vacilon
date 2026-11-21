import type { Progress } from '../download';
import type { WorkerRequest, WorkerResponse } from './protocol';

export interface WorkerLike {
  postMessage(message: WorkerRequest): void;
  onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null;
}

type Listener = (message: WorkerResponse) => void;

export class BrainClient {
  private listener: Listener | null = null;

  constructor(private readonly worker: WorkerLike) {
    worker.onmessage = (event) => this.listener?.(event.data);
  }

  load(baseUrl: string, onProgress: Progress): Promise<void> {
    return this.request({ type: 'load', baseUrl }, (message, settle) => {
      if (message.type === 'progress') onProgress(message.loaded, message.total);
      if (message.type === 'ready') settle.resolve('');
    }).then(() => undefined);
  }

  reply(text: string, onToken: (text: string) => void): Promise<string> {
    return this.request({ type: 'reply', text }, (message, settle) => {
      if (message.type === 'token') onToken(message.text);
      if (message.type === 'done') settle.resolve(message.text);
    });
  }

  private request(
    message: WorkerRequest,
    handle: (response: WorkerResponse, settle: { resolve: (text: string) => void }) => void,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.listener = (response) => {
        if (response.type === 'error') {
          this.listener = null;
          reject(new Error(response.message));
          return;
        }
        handle(response, {
          resolve: (text) => {
            this.listener = null;
            resolve(text);
          },
        });
      };
      this.worker.postMessage(message);
    });
  }
}
