import { Chispa, type ChispaOptions } from '../../domain/brain/chispa';
import { Memory, type Pair } from '../../domain/brain/memory';
import type { Manifest } from '../../domain/brain/model';
import type { TokenizerJson } from '../../domain/brain/tokenizer';
import { readWithProgress, type Progress } from '../download';

async function fetchOk(url: string): Promise<Response> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response;
}

export async function loadChispa(
  baseUrl: string,
  options: Partial<ChispaOptions> = {},
  onProgress: Progress = () => undefined,
): Promise<Chispa> {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const [manifest, weights, tokenizer, pairs] = await Promise.all([
    fetchOk(base + 'manifest.json').then((r) => r.json() as Promise<Manifest>),
    fetchOk(base + 'weights.bin').then((r) => readWithProgress(r, onProgress)),
    fetchOk(base + 'tokenizer.json').then((r) => r.json() as Promise<TokenizerJson>),
    fetchOk(new URL('../memory.json', base).href).then((r) => r.json() as Promise<Pair[]>),
  ]);
  return Chispa.fromBuffers(manifest, weights, tokenizer, {
    memory: new Memory(pairs),
    ...options,
  });
}
