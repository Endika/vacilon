// Run once from a scratch dir after `npm i @mintplex-labs/piper-tts-web@1.0.5 @diffusionstudio/piper-wasm@1.0.0`, with
// this file copied there as scripts/slim-espeak.mjs. The result is already vendored in the repo.
// Repacks piper_phonemize.data keeping only the Spanish dictionary (all other
// espeak-ng data is tiny). Rewrites the file table inside the vendored glue.
import { readFileSync, writeFileSync } from 'node:fs';

const KEEP_DICTS = new Set(['/espeak-ng-data/es_dict']);
const glue = 'src/vendor/piper-phonemize.js';
const src = readFileSync(
  'node_modules/@mintplex-labs/piper-tts-web/dist/piper-o91UDS6e.js',
  'utf8',
);
const full = readFileSync('node_modules/@diffusionstudio/piper-wasm/build/piper_phonemize.data');

const start = src.indexOf('loadPackage({');
const end = src.indexOf(');', src.indexOf('"remote_package_size"', start)) + 2;
const table = JSON.parse(src.slice(start + 'loadPackage('.length, end - 2));

let offset = 0;
const chunks = [];
const files = [];
for (const f of table.files) {
  if (f.filename.endsWith('_dict') && !KEEP_DICTS.has(f.filename)) continue;
  const bytes = full.subarray(f.start, f.end);
  files.push({ filename: f.filename, start: offset, end: offset + bytes.length });
  chunks.push(bytes);
  offset += bytes.length;
}
writeFileSync('public/voice/piper/piper_phonemize.data', Buffer.concat(chunks));
const next =
  src.slice(0, start) +
  'loadPackage(' +
  JSON.stringify({ files, remote_package_size: offset }) +
  ');' +
  src.slice(end);
writeFileSync(glue, next);
console.log(
  `kept ${files.length}/${table.files.length} files, ${offset} bytes (was ${full.length})`,
);
