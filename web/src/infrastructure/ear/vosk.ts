import { createVoskClient, type KaldiRecognizer, type VoskClient } from '@lichess-org/vosk-browser';
import { SAMPLE_RATE, type Engine } from '../../application/ports';
import { contentLength, readChunks } from '../download';

const MODEL = 'ear/vosk-model-small-es-0.42.tar.gz';

function asset(path: string): string {
  return new URL(path, document.baseURI).href;
}

async function readBlob(response: Response, onProgress: (fraction: number) => void): Promise<Blob> {
  const total = contentLength(response);
  if (!response.body || !total) return response.blob();
  const chunks = await readChunks(response.body, (loaded) =>
    onProgress(Math.min(loaded / total, 1)),
  );
  return new Blob(chunks);
}

/** Once installed, the service worker answers from its precache; before that nothing stays in the HTTP cache. */
async function fetchModel(onProgress: (fraction: number) => void): Promise<Blob> {
  const response = await fetch(asset(MODEL), { cache: 'no-store' });
  if (!response.ok) throw new Error(`Ear model: HTTP ${response.status}`);
  return readBlob(response, onProgress);
}

export class VoskEngine implements Engine {
  private client?: VoskClient;
  private recognizer?: KaldiRecognizer;
  private onFinal?: (text: string) => void;
  private chunks: string[] = [];

  async load(onProgress: (fraction: number) => void): Promise<void> {
    const blobUrl = URL.createObjectURL(await fetchModel(onProgress));
    try {
      this.client = await createVoskClient({
        modelUrl: blobUrl,
        workerUrl: asset('ear/vosk.worker.js'),
        wasmUrl: asset('ear/vosk.wasm'),
        logLevel: -1,
      });
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  }

  begin(onPartial: (text: string) => void, onPause: () => void): void {
    if (!this.client) throw new Error('Ear engine not loaded');
    this.recognizer?.remove();
    this.chunks = [];
    const recognizer = new this.client.KaldiRecognizer(SAMPLE_RATE);
    recognizer.on('partialresult', (message) => {
      if ('result' in message && 'partial' in message.result) {
        onPartial(this.join(message.result.partial));
      }
    });
    recognizer.on('result', (message) => {
      if (!('result' in message) || !('text' in message.result)) return;
      const done = this.onFinal;
      if (!done) {
        if (!message.result.text) return;
        this.chunks.push(message.result.text);
        onPause();
        return;
      }
      this.onFinal = undefined;
      done(this.join(message.result.text));
    });
    this.recognizer = recognizer;
  }

  feed(chunk: Float32Array): void {
    this.recognizer?.acceptWaveformFloat(chunk, SAMPLE_RATE);
  }

  finish(): Promise<string> {
    return new Promise((resolve) => {
      if (!this.recognizer) return resolve('');
      this.onFinal = resolve;
      this.recognizer.retrieveFinalResult();
    });
  }

  private join(tail: string): string {
    return [...this.chunks, tail].join(' ').trim();
  }
}
