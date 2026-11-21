import json
from pathlib import Path

import numpy as np
import torch
from torch import Tensor

from vacilon.domain.examples import Example
from vacilon.domain.format import PAD_ID


def load_examples(path: Path, max_len: int) -> list[Example]:
    examples = []
    with path.open(encoding="utf-8") as f:
        for line in f:
            record = json.loads(line)
            if len(record["ids"]) <= max_len:
                examples.append(Example(record["ids"], record["bot_pos"]))
    return examples


def collate(examples: list[Example], device: torch.device) -> tuple[Tensor, Tensor, Tensor]:
    """Return (inputs, targets, mask); mask is True where the target is a reply token."""
    width = max(len(e.ids) for e in examples)
    ids = np.full((len(examples), width), PAD_ID, dtype=np.int64)
    mask = np.zeros((len(examples), width), dtype=bool)
    for row, e in enumerate(examples):
        ids[row, : len(e.ids)] = e.ids
        mask[row, e.bot_pos + 1 : len(e.ids)] = True
    tensor = torch.from_numpy(ids).to(device)
    return tensor[:, :-1], tensor[:, 1:], torch.from_numpy(mask).to(device)[:, 1:]
