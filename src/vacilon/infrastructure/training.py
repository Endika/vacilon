import sys
from pathlib import Path
from typing import Any, TextIO

import torch
import torch.nn.functional as F
from torch import Tensor

from vacilon.infrastructure.torch_gpt import GPT, GPTConfig


def pick_device() -> torch.device:
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")


def masked_loss(logits: Tensor, targets: Tensor, mask: Tensor | None = None) -> Tensor:
    """Mean cross-entropy over positions where mask is True (all positions if None)."""
    losses = F.cross_entropy(logits.flatten(0, 1), targets.flatten(), reduction="none")
    if mask is None:
        return losses.mean()
    weights = mask.flatten().to(losses.dtype)
    return (losses * weights).sum() / weights.sum().clamp(min=1)


def make_optimizer(model: GPT, lr: float, weight_decay: float) -> torch.optim.AdamW:
    params = [p for p in model.parameters() if p.requires_grad]
    groups = [
        {"params": [p for p in params if p.dim() >= 2], "weight_decay": weight_decay},
        {"params": [p for p in params if p.dim() < 2], "weight_decay": 0.0},
    ]
    return torch.optim.AdamW(groups, lr=lr, betas=(0.9, 0.95))


def set_lr(optimizer: torch.optim.Optimizer, lr: float) -> None:
    for group in optimizer.param_groups:
        group["lr"] = lr


def save_checkpoint(path: Path, model: GPT, **extra: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    torch.save({"model": model.state_dict(), "config": model.cfg.to_dict(), **extra}, tmp)
    tmp.replace(path)


def load_model(path: Path, device: torch.device, dropout: float | None = None) -> GPT:
    ckpt = torch.load(path, map_location=device, weights_only=True)
    cfg = GPTConfig(**ckpt["config"])
    if dropout is not None:
        cfg.dropout = dropout
    model = GPT(cfg).to(device)
    model.load_state_dict(ckpt["model"])
    return model


class Logger:
    def __init__(self, path: Path, stream: TextIO = sys.stdout) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        self._file = path.open("a", encoding="utf-8")
        self._stream = stream

    def __call__(self, message: str) -> None:
        print(message, file=self._stream, flush=True)
        print(message, file=self._file, flush=True)
