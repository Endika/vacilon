from dataclasses import dataclass

import numpy as np

from vacilon.domain.format import BOT_ID, EOS_ID, USER_ID


@dataclass(frozen=True)
class Example:
    ids: list[int]
    bot_pos: int


def sample_subs_turn(tokens: np.ndarray, rng: np.random.Generator, max_len: int) -> Example | None:
    """Pick a whole <u>...<eos> turn from a flat token array, or None if it doesn't fit."""
    start = int(rng.integers(0, len(tokens) - 4 * max_len))
    window = tokens[start : start + 4 * max_len].astype(np.int64)
    users = np.flatnonzero(window == USER_ID)
    if len(users) == 0:
        return None
    begin = int(users[0])
    ends = np.flatnonzero(window[begin:] == EOS_ID)
    if len(ends) == 0 or ends[0] + 1 > max_len:
        return None
    ids = window[begin : begin + int(ends[0]) + 1].tolist()
    bots = [i for i, t in enumerate(ids) if t == BOT_ID]
    return Example(ids, bots[0]) if bots else None
