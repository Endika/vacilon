import json
from pathlib import Path

import pytest

from vacilon.infrastructure.val_loss import checkpoint_val_loss, exported_val_loss


def write_val(path: Path) -> Path:
    rows = [
        {"topic": "t", "ids": [1, 40, 41, 42, 2, 50, 51, 3], "bot_pos": 4},
        {"topic": "t", "ids": [1, 60, 2, 70, 71, 72, 3], "bot_pos": 2},
    ]
    path.write_text("\n".join(json.dumps(r) for r in rows) + "\n", encoding="utf-8")
    return path


def test_exported_model_loss_matches_the_checkpoint(exported_dir: Path) -> None:
    val = write_val(exported_dir.parent / "val.jsonl")
    expected = checkpoint_val_loss(exported_dir.parent / "ck.pt", val)
    assert exported_val_loss(exported_dir, val) == pytest.approx(expected, rel=0.02)
