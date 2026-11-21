from pathlib import Path

import numpy as np
import torch

from vacilon.infrastructure.finetune_batches import collate, load_examples
from vacilon.infrastructure.npz_loader import load_npz
from vacilon.infrastructure.training import load_model, masked_loss

BATCH = 32


@torch.no_grad()
def checkpoint_val_loss(checkpoint: Path, val_data: Path) -> float:
    """Mean reply-token loss of a checkpoint on the fine-tuning validation set, on CPU."""
    device = torch.device("cpu")
    model = load_model(checkpoint, device).eval()
    examples = load_examples(val_data, model.cfg.block_size)
    total, count = 0.0, 0
    for i in range(0, len(examples), BATCH):
        x, y, mask = collate(examples[i : i + BATCH], device)
        total += masked_loss(model(x), y, mask).item() * int(mask.sum())
        count += int(mask.sum())
    return total / count


def exported_val_loss(model_dir: Path, val_data: Path) -> float:
    """Same loss as `checkpoint_val_loss`, on the int8 model the app runs (a registry version)."""
    model = load_npz(model_dir / "vacilon.npz")
    total, count = 0.0, 0
    for e in load_examples(val_data, model.cfg.block_size):
        logits = model.forward(e.ids[:-1])
        logits = logits - logits.max(axis=1, keepdims=True)
        logp = logits - np.log(np.exp(logits).sum(axis=1, keepdims=True))
        targets = e.ids[e.bot_pos + 1 :]
        rows = logp[e.bot_pos : len(e.ids) - 1]
        total -= float(rows[np.arange(len(targets)), targets].sum())
        count += len(targets)
    return total / count
