import json
import shutil
from pathlib import Path

import numpy as np
import torch
from numpy.typing import NDArray

from vacilon.domain.format import MODEL_FILE, TOKENIZER_FILE


def quantize_rows(w: NDArray[np.float32]) -> tuple[NDArray[np.int8], NDArray[np.float16]]:
    """Symmetric int8 quantization with one scale per output row."""
    raw = np.abs(w).max(axis=1) / 127.0
    scale = np.where(raw == 0, 1.0, raw).astype(np.float16)
    q = np.clip(np.rint(w / scale.astype(np.float32)[:, None]), -127, 127).astype(np.int8)
    return q, scale


def export_state(config: dict[str, float | int], state: dict[str, torch.Tensor], out: Path) -> None:
    arrays: dict[str, NDArray[np.generic]] = {
        "config": np.frombuffer(json.dumps(config).encode("utf-8"), dtype=np.uint8)
    }
    for name, tensor in state.items():
        value = tensor.detach().cpu().float().numpy()
        if value.ndim == 2:
            arrays[name + ".q"], arrays[name + ".s"] = quantize_rows(value)
        else:
            arrays[name] = value.astype(np.float32)
    out.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(out, **arrays)  # type: ignore[arg-type]


def export_checkpoint(checkpoint: Path, tokenizer: Path, out_dir: Path) -> int:
    """Write the int8 model and tokenizer to out_dir; return the total size in bytes."""
    ckpt = torch.load(checkpoint, map_location="cpu", weights_only=True)
    export_state(ckpt["config"], ckpt["model"], out_dir / MODEL_FILE)
    shutil.copyfile(tokenizer, out_dir / TOKENIZER_FILE)
    return sum(p.stat().st_size for p in out_dir.iterdir() if p.is_file())
