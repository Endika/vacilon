#!/usr/bin/env bash
# Puts the Spanish ear model in public/ear, packaged as .tar.gz (from ~/.cache/vacilon-oido,
# downloading it if missing). The Vosk worker and wasm come from node_modules via vite.config.ts.
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
CACHE="$HOME/.cache/vacilon-oido"
MODEL=vosk-model-small-es-0.42
DEST="$HERE/public/ear"
mkdir -p "$CACHE" "$DEST"

if [ ! -f "$CACHE/$MODEL.tar.gz" ]; then
  [ -f "$CACHE/$MODEL.zip" ] || curl -fL -o "$CACHE/$MODEL.zip" "https://alphacephei.com/vosk/models/$MODEL.zip"
  python3 - "$CACHE" "$MODEL" <<'PY'
import sys, tarfile, zipfile, tempfile
from pathlib import Path
cache, name = Path(sys.argv[1]), sys.argv[2]
with tempfile.TemporaryDirectory() as tmp:
    zipfile.ZipFile(cache / f"{name}.zip").extractall(tmp)
    with tarfile.open(cache / f"{name}.tar.gz", "w:gz") as t:
        t.add(Path(tmp) / name, arcname=name)
PY
fi
cp "$CACHE/$MODEL.tar.gz" "$DEST/"
