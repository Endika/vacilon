from collections.abc import Iterable, Iterator

import numpy as np
from numpy.typing import NDArray

from vacilon.application.ports import Tokenizer
from vacilon.domain.dataset_split import Row, batched
from vacilon.domain.format import BOT_ID, format_turn

BATCH_TURNS = 200_000

Tokens = NDArray[np.uint16]


def tokenize_pretrain(
    pairs: Iterable[tuple[str, str]], tokenizer: Tokenizer, *, val_frac: float, seed: int
) -> Iterator[tuple[Tokens, Tokens]]:
    """Per batch of turns, the (train, val) token arrays; each turn lands whole on one side."""
    rng = np.random.default_rng(seed)
    for batch in batched(pairs, BATCH_TURNS):
        turns = tokenizer.encode_batch([format_turn(m, r) for m, r in batch])
        encoded = [np.asarray(ids, dtype=np.uint16) for ids in turns]
        is_val = rng.random(len(encoded)) < val_frac
        yield (
            _concat([e for e, v in zip(encoded, is_val, strict=True) if not v]),
            _concat([e for e, v in zip(encoded, is_val, strict=True) if v]),
        )


def _concat(chunks: list[Tokens]) -> Tokens:
    return np.concatenate(chunks) if chunks else np.empty(0, dtype=np.uint16)


def finetune_records(rows: Iterable[Row], tokenizer: Tokenizer) -> Iterator[dict[str, object]]:
    for topic, message, reply in rows:
        ids = tokenizer.encode(format_turn(message, reply))
        yield {"topic": topic, "ids": ids, "bot_pos": ids.index(BOT_ID)}
