# Third-party components

Everything below ships inside the app (the PWA in `web/`). Licence texts live in `public/licenses/` (served with the app at `licenses/`).

## Voice (Piper)

| Component                                                                  | Version                     | Licence    | Where                                                                      |
| -------------------------------------------------------------------------- | --------------------------- | ---------- | -------------------------------------------------------------------------- |
| onnxruntime-web (JS, bundled in the voice worker)                          | 1.22.0                      | MIT        | `package.json`                                                             |
| ONNX Runtime WASM (`ort-wasm-simd-threaded.wasm` and `.mjs`)               | 1.22.0                      | MIT        | `public/voice/ort/`                                                        |
| piper_phonemize WASM glue, packaged by `@diffusionstudio/piper-wasm`       | 1.0.0                       | MIT        | `src/vendor/piper-phonemize.js`, `public/voice/piper/piper_phonemize.wasm` |
| espeak-ng (inside `piper_phonemize.wasm`) and its data, trimmed to Spanish | as built in piper-phonemize | GPL-3.0    | `public/voice/piper/piper_phonemize.data`                                  |
| Piper (VITS architecture and phoneme-to-id logic)                          | 1.x                         | MIT        | reimplemented in `src/infrastructure/piper/worker.ts`                      |
| Voice `es_MX-claude-high` (ONNX model and config), by HirCoir              | piper-voices                | Apache-2.0 | `public/voice/model/`                                                      |

## Ear (Vosk)

| Component                                       | Version | Licence    | Where                                                    |
| ----------------------------------------------- | ------- | ---------- | -------------------------------------------------------- |
| `@lichess-org/vosk-browser` (worker and WASM)   | 0.0.3   | Apache-2.0 | `package.json`, `public/ear/vosk.worker.js`, `vosk.wasm` |
| Model `vosk-model-small-es-0.42` (Alpha Cephei) | 0.42    | Apache-2.0 | `public/ear/` (downloaded by `npm run ear`, not in git)  |

## Fonts

| Font    | Licence | Where                             | Licence text                                 |
| ------- | ------- | --------------------------------- | -------------------------------------------- |
| Baloo 2 | OFL-1.1 | `public/fonts/baloo2-latin.woff2` | `public/licenses/LICENSE-Baloo2-OFL-1.1.txt` |
| Nunito  | OFL-1.1 | `public/fonts/nunito-latin.woff2` | `public/licenses/LICENSE-Nunito-OFL-1.1.txt` |

## Chispa's model

Chispa's own model (`public/model/`) was pre-trained on the Spanish monolingual part of the OpenSubtitles
v2018 corpus from OPUS (P. Lison and J. Tiedemann, 2016, «OpenSubtitles2016: Extracting Large Parallel
Corpora from Movie and TV Subtitles», LREC 2016) and fine-tuned on our own hand-written corpus
(`data/corpus/`). The subtitles themselves are not distributed, only the trained weights.

## Licence texts

`public/licenses/`: `LICENSE-onnxruntime-MIT.txt`, `LICENSE-piper-phonemize-MIT.txt`, `LICENSE-espeak-ng-GPL-3.0`,
`LICENSE-Apache-2.0.txt` (voice and Vosk), `LICENSE-Baloo2-OFL-1.1.txt`, `LICENSE-Nunito-OFL-1.1.txt`.

## Notes

- espeak-ng is GPL-3.0. Its code and data are shipped inside the `.wasm` and `.data` files, so the
  app is distributed under GPL-3-compatible terms (our own code is MIT) and these sources must stay
  available: espeak-ng at https://github.com/espeak-ng/espeak-ng and piper-phonemize at
  https://github.com/rhasspy/piper-phonemize.
- The `es_MX-claude-high` model card (rhasspy/piper-voices) declares Apache-2.0 and points to
  https://huggingface.co/spaces/HirCoir/Piper-TTS-Spanish, which also declares Apache-2.0 but does not
  say what recordings the voice was trained on. Checked on 2026-11-20.
- The trimmed espeak data is reproducible with `scripts/slim-espeak.mjs` (instructions in its header).
