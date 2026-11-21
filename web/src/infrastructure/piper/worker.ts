/// <reference lib="webworker" />
import * as ort from 'onnxruntime-web/wasm';
import { createPiperPhonemize, type PiperPhonemizeModule } from '../../vendor/piper-phonemize.js';
import {
  LENGTH_SCALE,
  MODEL,
  PEAK_OUT,
  PEAK_RAW,
  PITCH_FACTOR,
  ROBOT_DEPTH,
  ROBOT_RATE_HZ,
} from './config';
import { concat, contentLength, readChunks, type Progress } from '../download';
import { normalize, pitchUp, robotize } from './effects';
import type { FromWorker, ToWorker } from './protocol';
import { splitSentences } from './sentences';

interface ModelConfig {
  audio: { sample_rate: number };
  espeak: { voice: string };
  inference: { noise_scale: number; noise_w: number };
}

let session: ort.InferenceSession | null = null;
let config: ModelConfig | null = null;
let phonemizer: PiperPhonemizeModule | null = null;
let pendingIds: ((ids: number[]) => void) | null = null;
let activeId = -1;

const post = (message: FromWorker, transfer: Transferable[] = []): void =>
  self.postMessage(message, transfer);

async function fetchBytes(url: string, onProgress?: Progress): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`${url}: ${res.status}`);
  const total = contentLength(res);
  return concat(await readChunks(res.body, (loaded) => onProgress?.(loaded, total)));
}

async function load(base: string): Promise<void> {
  const t0 = performance.now();
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.wasmPaths = {
    mjs: `${base}ort/ort-wasm-simd-threaded.mjs`,
    wasm: `${base}ort/ort-wasm-simd-threaded.wasm`,
  };
  const [model, configBytes] = await Promise.all([
    fetchBytes(`${base}model/${MODEL}.onnx`, (loaded, total) =>
      post({ type: 'progress', loaded, total }),
    ),
    fetchBytes(`${base}model/${MODEL}.onnx.json`),
  ]);
  config = JSON.parse(new TextDecoder().decode(configBytes)) as ModelConfig;
  phonemizer = await createPiperPhonemize({
    print: (line) => pendingIds?.((JSON.parse(line) as { phoneme_ids: number[] }).phoneme_ids),
    printErr: (message) => console.warn('phonemize:', message),
    locateFile: (name) => `${base}piper/${name}`,
  });
  session = await ort.InferenceSession.create(model, { executionProviders: ['wasm'] });
  post({ type: 'ready', bytes: model.length, ms: performance.now() - t0 });
}

function phonemize(text: string): Promise<number[]> {
  return new Promise((resolve) => {
    pendingIds = resolve;
    phonemizer?.callMain([
      '-l',
      config?.espeak.voice ?? 'es-419',
      '--input',
      JSON.stringify([{ text }]),
      '--espeak_data',
      '/espeak-ng-data',
    ]);
  });
}

async function synthesize(text: string): Promise<Float32Array> {
  if (!session || !config) throw new Error('voice not loaded');
  const ids = await phonemize(text);
  const out = await session.run({
    input: new ort.Tensor('int64', BigInt64Array.from(ids.map(BigInt)), [1, ids.length]),
    input_lengths: new ort.Tensor('int64', BigInt64Array.from([BigInt(ids.length)])),
    scales: new ort.Tensor(
      'float32',
      Float32Array.from([config.inference.noise_scale, LENGTH_SCALE, config.inference.noise_w]),
    ),
  });
  return new Float32Array(out.output.data as Float32Array);
}

async function speak(id: number, text: string): Promise<void> {
  activeId = id;
  const sampleRate = config?.audio.sample_rate ?? 22050;
  let offset = 0;
  for (const sentence of splitSentences(text)) {
    const raw = await synthesize(sentence);
    if (activeId !== id) return;
    normalize(raw, PEAK_RAW);
    const pcm = pitchUp(raw, PITCH_FACTOR);
    robotize(pcm, sampleRate, ROBOT_DEPTH, ROBOT_RATE_HZ, offset);
    normalize(pcm, PEAK_OUT);
    offset += pcm.length;
    post({ type: 'chunk', id, pcm, sampleRate }, [pcm.buffer]);
  }
  if (activeId === id) post({ type: 'done', id });
}

let queue: Promise<void> = Promise.resolve();

self.onmessage = (event: MessageEvent<ToWorker>): void => {
  const message = event.data;
  if (message.type === 'cancel') {
    activeId = -1;
    return;
  }
  const id = message.type === 'speak' ? message.id : null;
  const run = (): Promise<void> =>
    message.type === 'load' ? load(message.base) : speak(message.id, message.text);
  queue = queue.then(run).catch((error: unknown) => {
    post({ type: 'error', id, message: String((error as Error)?.stack ?? error) });
  });
};
