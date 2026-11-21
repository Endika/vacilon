<p align="center">
  <img src="./web/public/icons/favicon.svg" width="140" alt="Chispa, a white and pink egg robot with big eyes and an antenna" />
</p>

<h1 align="center">Vacilon</h1>

<p align="center">
  <b>Chispa</b> is a little egg robot that floats, blinks and chats in Spanish with kids.<br />
  Her own tiny language model, her own voice and ears, all on the device. No server, no accounts.
</p>

<p align="center">
  <a href="https://endika.github.io/vacilon/"><b>Talk to Chispa →</b></a>
</p>

<p align="center">
  <a href="https://github.com/Endika/vacilon/releases/latest"><img src="https://img.shields.io/github/v/release/Endika/vacilon?style=flat-square&color=f08bb4&label=release" alt="Latest release" /></a>
  <a href="https://github.com/Endika/vacilon/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/Endika/vacilon/ci.yml?style=flat-square&label=ci&branch=main" alt="CI" /></a>
  <a href="https://github.com/Endika/vacilon/commits/main"><img src="https://img.shields.io/github/last-commit/Endika/vacilon?style=flat-square" alt="Last commit" /></a>
  <a href="https://www.conventionalcommits.org"><img src="https://img.shields.io/badge/conventional_commits-1.0.0-FE5196?style=flat-square" alt="Conventional Commits" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/Endika/vacilon?style=flat-square" alt="MIT licence" /></a>
</p>

Everything runs on the device. No audio or text ever leaves the browser, because there is no
backend to send it to. See [`.github/SECURITY.md`](.github/SECURITY.md).

The Spanish user guide is in [`GUIA.md`](GUIA.md).

## Features

- **Chispa, the egg robot.** An animated face that reacts, blinks, dances, sleeps and wakes up.
- **Fixed safety phrases.** Sensitive topics are never improvised by the model: they get fixed,
  reviewed replies that point to a trusted adult. Everything the model generates also goes
  through an output filter.
- **Tricks.** Jokes, songs, dances, riddles, maths problems that level up, a calculator that is
  never wrong, fun facts, colours, Morse code and a little Basque and English.
- **Remembers who is talking.** Up to six names, kept only on the device.
- **Voice and ear.** She speaks with the device's own Spanish voice (network voices are never
  used) and falls back to Piper (ONNX, WASM) when there is none. She listens with Vosk (WASM):
  tap the microphone, talk, and she stops when you do.
- **Tiny own model plus corpus memory.** A small GPT trained from scratch and fine-tuned on a
  hand-written corpus, backed by a retrieval memory over that corpus.
- **Privacy.** Nothing leaves the device: no accounts, no analytics, no server.

## Running it

Python side (training, evaluation, terminal chat) uses the virtualenv at
`~/.local/venvs/vacilon`; the app is a Vite + TypeScript project in `web/`.

```bash
make dev      # app with live reload at http://localhost:5173
make test     # Python and web tests
make check    # every quality gate: ruff, mypy, pytest, prettier, eslint, tsc, vitest
make          # list all commands
```

The Vosk Spanish model is not in git. `npm run ear` (in `web/`) downloads it into
`~/.cache/vacilon-oido` and packages it for the app; CI does the same on deploy.

Enable the git hooks (commit hours and the quality gates) on a clone with `make hooks`.

## Structure

Both sides follow the same hexagonal layers; `domain` never imports from the outer layers.

```
src/vacilon/          Python package
  domain/             pure logic: safety phrases, memory, filter, sampling, metrics, corpus
  application/        use cases: chat, certification, data preparation, generation
  infrastructure/     torch, numpy, tokenizer, on-disk registry, export
scripts/              thin CLIs (composition roots); scripts/git-hooks/ for git hooks
tests/                pytest suite, including the layer-boundary test
data/corpus/          the hand-written corpus
eval/                 the exam set used to certify a new model
models/final/         the exported model
web/src/
  domain/             pure logic: conversation, safety, memory, tricks, face
  application/        use cases: answer a message, do a trick, speak, listen
  infrastructure/     brain worker, Piper, Vosk, audio capture, install
  ui/                 DOM: face, bubble, buttons
  main.ts             the single composition root
```

## Licences

Vacilon is MIT-licensed, see [`LICENSE`](LICENSE). The bundled third-party components (ONNX
Runtime, Piper, espeak-ng, the voice model, Vosk) have their own licences, listed in
[`web/THIRD_PARTY.md`](web/THIRD_PARTY.md); read it before distributing the app.
