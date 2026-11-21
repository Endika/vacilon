import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Manifest } from '../src/domain/brain/model';
import type { TokenizerJson } from '../src/domain/brain/tokenizer';

const modelDir = fileURLToPath(new URL('../public/model/', import.meta.url));
const fixtureDir = fileURLToPath(new URL('./fixtures/', import.meta.url));

export function readModel(): {
  manifest: Manifest;
  weights: ArrayBuffer;
  tokenizer: TokenizerJson;
} {
  const bin = readFileSync(modelDir + 'weights.bin');
  return {
    manifest: JSON.parse(readFileSync(modelDir + 'manifest.json', 'utf-8')) as Manifest,
    weights: bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength) as ArrayBuffer,
    tokenizer: JSON.parse(readFileSync(modelDir + 'tokenizer.json', 'utf-8')) as TokenizerJson,
  };
}

export function readFixture<T>(name: string): T {
  return JSON.parse(readFileSync(fixtureDir + name, 'utf-8')) as T;
}
