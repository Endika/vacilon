import hashlib
from collections.abc import Iterable, Iterator

from vacilon.domain.guardrails import Intent, match_intent
from vacilon.domain.safety import normalize_for_filter

Topics = dict[str, list[tuple[str, str]]]
Row = tuple[str, str, str]


def batched[T](items: Iterable[T], size: int) -> Iterator[list[T]]:
    batch: list[T] = []
    for item in items:
        batch.append(item)
        if len(batch) == size:
            yield batch
            batch = []
    if batch:
        yield batch


def stable_key(seed: int, message: str) -> str:
    """Only the normalized message: editing a reply or its spelling never moves a row across."""
    return hashlib.sha256(f"{seed}\t{normalize_for_filter(message)}".encode()).hexdigest()


def split_by_topic(topics: Topics, val_frac: float, seed: int) -> tuple[list[Row], list[Row]]:
    """Stratified split into (topic, message, reply) rows; every topic keeps val rows.

    Each row's side depends only on its own message, so editing other rows or its reply never
    moves it across, and repeated messages always land on the same side.
    """
    train: list[Row] = []
    val: list[Row] = []
    for topic in sorted(topics):
        rows = sorted(topics[topic], key=lambda r: stable_key(seed, r[0]))
        n_val = max(1, round(len(rows) * val_frac)) if len(rows) > 1 else 0
        val.extend((topic, m, r) for m, r in rows[:n_val])
        train.extend((topic, m, r) for m, r in rows[n_val:])
    return train, val


def parse_pairs(text: str) -> list[tuple[str, str]]:
    """The two-field TSV lines of a topic file."""
    fields = (line.split("\t") for line in text.splitlines())
    return [(f[0], f[1]) for f in fields if len(f) == 2]


def without_guarded(topics: Topics, intents: tuple[Intent, ...]) -> Topics:
    """Drop pairs the fixed phrases already answer, so their tone does not leak elsewhere."""
    kept = {
        t: [(m, r) for m, r in rows if match_intent(m, intents) is None]
        for t, rows in topics.items()
    }
    return {t: rows for t, rows in kept.items() if rows}
