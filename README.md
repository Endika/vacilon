# Vacilon

Chispa is a little egg robot that talks Spanish with kids. It is an offline PWA with a tiny
language model of its own: it jokes, does tricks, listens through the microphone and answers
out loud.

**Live:** <https://endika.github.io/vacilon/>

Everything runs on the device. No audio or text ever leaves the browser, because there is no
backend to send it to. See [`.github/SECURITY.md`](.github/SECURITY.md).

The Spanish user guide is in [`GUIA.md`](GUIA.md).

## Features

- **Chispa, the egg robot.** An animated face that reacts, blinks, sleeps and wakes up.
- **Fixed safety phrases.** Sensitive topics are never improvised by the model: they get fixed,
  reviewed replies that point to a trusted adult. Everything the model generates also goes
  through an output filter.
- **Tricks.** Spins, songs and other small routines a child can ask for.
- **Offline voice and ear.** Speech is synthesised in the browser with Piper (ONNX, WASM) and
  speech is recognised with Vosk (WASM). Both can be installed for use without a connection.
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
