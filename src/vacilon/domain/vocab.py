from collections import Counter
from collections.abc import Iterable

from vacilon.domain.spanish import words

ALWAYS_KNOWN = ("chispa", "bip")


def count_words_in_lines(lines: Iterable[str]) -> Counter[str]:
    counts: Counter[str] = Counter()
    for line in lines:
        counts.update(words(line.replace("\t", " ")))
    return counts


def frequent_words(counts: Counter[str], min_count: int) -> set[str]:
    return {w for w, n in counts.items() if n >= min_count}
