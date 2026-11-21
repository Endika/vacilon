import json
from pathlib import Path

from vacilon.domain.format import MODEL_FILE, TOKENIZER_FILE
from vacilon.infrastructure.web_export import write_fixtures, write_model_files


def publish_to_web(model_dir: Path, web_model: Path, fixtures_dir: Path, version: str) -> None:
    """Export a model directory for the app and stamp its version in manifest.json."""
    npz, tokenizer = model_dir / MODEL_FILE, model_dir / TOKENIZER_FILE
    write_model_files(npz, tokenizer, web_model)
    write_fixtures(npz, tokenizer, fixtures_dir)
    manifest_path = web_model / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["model_version"] = version
    manifest_path.write_text(json.dumps(manifest, indent=1), encoding="utf-8")
