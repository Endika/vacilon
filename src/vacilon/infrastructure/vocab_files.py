import gzip
from pathlib import Path

from vacilon.domain.vocab import ALWAYS_KNOWN, count_words_in_lines, frequent_words

SUBS_LINES = 2_000_000
SUBS_MIN_COUNT = 3


def read_head(path: Path, limit: int) -> list[str]:
    out: list[str] = []
    with path.open(encoding="utf-8", errors="replace") as f:
        for _, line in zip(range(limit), f, strict=False):
            out.append(line)
    return out


def build_vocab(
    subs: Path, corpus_dir: Path, subs_lines: int = SUBS_LINES, min_count: int = SUBS_MIN_COUNT
) -> set[str]:
    """Words seen at least `min_count` times in the subtitles head, plus every corpus word."""
    known = frequent_words(count_words_in_lines(read_head(subs, subs_lines)), min_count)
    for path in sorted(corpus_dir.glob("*.tsv")):
        known |= set(count_words_in_lines(path.read_text(encoding="utf-8").splitlines()))
    return known | set(ALWAYS_KNOWN)


def save_vocab(vocab: set[str], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with gzip.open(path, "wt", encoding="utf-8") as f:
        f.write("\n".join(sorted(vocab)))


def load_vocab(path: Path) -> set[str]:
    with gzip.open(path, "rt", encoding="utf-8") as f:
        return set(f.read().split("\n"))


def ensure_vocab(path: Path, subs: Path, corpus_dir: Path) -> set[str]:
    if path.exists():
        return load_vocab(path)
    vocab = build_vocab(subs, corpus_dir)
    save_vocab(vocab, path)
    return vocab
