import { readFileSync } from 'node:fs';
import { Chispa } from '../src/domain/brain/chispa';
import { GPT, type Manifest } from '../src/domain/brain/model';
import type { TokenizerJson } from '../src/domain/brain/tokenizer';

const dir = new URL('../public/model/', import.meta.url);
const read = (name: string): Buffer => readFileSync(new URL(name, dir));

const t0 = performance.now();
const bin = read('weights.bin');
const weights = bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength) as ArrayBuffer;
const manifest = JSON.parse(read('manifest.json').toString()) as Manifest;
const tokenizer = JSON.parse(read('tokenizer.json').toString()) as TokenizerJson;
const chispa = Chispa.fromBuffers(manifest, weights, tokenizer, { seed: 1 });
console.log(`load: ${(performance.now() - t0).toFixed(0)} ms`);

const model = GPT.fromBuffers(manifest, weights);
const cache = model.newCache();
const steps = 100;
for (let i = 0; i < 5; i++) model.step(5, cache);
const t1 = performance.now();
for (let i = 0; i < steps; i++) model.step(5 + (i % 50), cache);
console.log(`forward: ${((performance.now() - t1) / steps).toFixed(2)} ms/token`);

const t2 = performance.now();
const answer = chispa.reply('ola chispa k aces');
console.log(`reply "${answer}": ${(performance.now() - t2).toFixed(0)} ms`);
