import json
from collections.abc import Iterable
from pathlib import Path

import numpy as np
from numpy.typing import NDArray

from vacilon.application.data_preparation import finetune_records
from vacilon.application.ports import Tokenizer
from vacilon.domain.dataset_split import Row

Tokens = NDArray[np.uint16]


def write_pretrain_bins(
    chunks: Iterable[tuple[Tokens, Tokens]], train_path: Path, val_path: Path
) -> tuple[int, int]:
    """Append each (train, val) chunk to its uint16 file; returns (train_tokens, val_tokens)."""
    counts = [0, 0]
    with train_path.open("wb") as train, val_path.open("wb") as val:
        for train_chunk, val_chunk in chunks:
            train_chunk.tofile(train)
            val_chunk.tofile(val)
            counts[0] += len(train_chunk)
            counts[1] += len(val_chunk)
    return counts[0], counts[1]


def write_jsonl(records: Iterable[dict[str, object]], path: Path) -> int:
    count = 0
    with path.open("w", encoding="utf-8") as f:
        for record in records:
            f.write(json.dumps(record) + "\n")
            count += 1
    return count


def write_finetune_sets(
    train: Iterable[Row], val: Iterable[Row], tokenizer: Tokenizer, data_dir: Path
) -> tuple[int, int]:
    n_train = write_jsonl(finetune_records(train, tokenizer), data_dir / "finetune_train.jsonl")
    n_val = write_jsonl(finetune_records(val, tokenizer), data_dir / "finetune_val.jsonl")
    return n_train, n_val
