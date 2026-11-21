from collections.abc import Iterator
from pathlib import Path

import numpy as np

_CHUNK = 1 << 24


def count_lines(path: Path) -> int:
    total = 0
    last = b"\n"
    with path.open("rb") as f:
        while chunk := f.read(_CHUNK):
            total += chunk.count(b"\n")
            last = chunk[-1:]
    return total + (last != b"\n")


def sample_pairs(path: Path, n: int, seed: int) -> Iterator[tuple[str, str]]:
    """Yield n distinct (message, reply) rows of a TSV, chosen reproducibly, in file order."""
    total = count_lines(path)
    keep = np.zeros(total, dtype=bool)
    keep[np.random.default_rng(seed).choice(total, size=min(n, total), replace=False)] = True
    with path.open(encoding="utf-8") as f:
        for selected, line in zip(keep, f, strict=False):
            if not selected:
                continue
            fields = line.rstrip("\n").split("\t")
            if len(fields) == 2:
                yield fields[0], fields[1]
