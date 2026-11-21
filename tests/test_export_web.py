import json
from pathlib import Path

import numpy as np

from vacilon.infrastructure.tokenizer import VacilonTokenizer
from vacilon.infrastructure.web_export import (
    build_fixture_texts,
    write_fixtures,
    write_model_files,
)

REAL_DIR = Path(__file__).resolve().parents[1] / "models" / "final"


def test_manifest_matches_npz(exported_dir: Path, tmp_path: Path) -> None:
    out = tmp_path / "model"
    write_model_files(exported_dir / "vacilon.npz", exported_dir / "tokenizer.json", out)
    manifest = json.loads((out / "manifest.json").read_text(encoding="utf-8"))
    blob = (out / "weights.bin").read_bytes()
    with np.load(exported_dir / "vacilon.npz") as data:
        for t in manifest["tensors"]:
            assert t["offset"] % 4 == 0
            if t["dtype"] == "int8":
                q = data[t["name"] + ".q"]
                assert t["shape"] == list(q.shape)
                got = np.frombuffer(blob, np.int8, q.size, t["offset"]).reshape(q.shape)
                assert (got == q).all()
                scale = np.frombuffer(blob, "<f4", q.shape[0], t["scale_offset"])
                assert (scale == data[t["name"] + ".s"].astype(np.float32)).all()
            else:
                v = data[t["name"]]
                got = np.frombuffer(blob, "<f4", v.size, t["offset"]).reshape(v.shape)
                assert (got == v).all()
    assert manifest["config"]["n_layer"] == 2
    assert (out / "tokenizer.json").exists()


def test_fixtures_are_written(exported_dir: Path, tmp_path: Path) -> None:
    write_fixtures(exported_dir / "vacilon.npz", exported_dir / "tokenizer.json", tmp_path)
    tok = json.loads((tmp_path / "tokenizer.json").read_text(encoding="utf-8"))
    assert len(tok) == 200 == len(build_fixture_texts())
    logits = json.loads((tmp_path / "logits.json").read_text(encoding="utf-8"))
    assert len(logits) == 5
    assert all(len(f["top_indices"]) == 50 for f in logits)


def test_real_model_fits_the_web_budget(tmp_path: Path) -> None:
    out = tmp_path / "model"
    size = write_model_files(REAL_DIR / "vacilon.npz", REAL_DIR / "tokenizer.json", out)
    assert size < 20_000_000
    assert VacilonTokenizer.load(out / "tokenizer.json").vocab_size > 0
