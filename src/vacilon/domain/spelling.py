"""Kid spelling: map a word the corpus never uses to one it does ("muxo" -> "mucho").

A word the corpus already knows is never touched, so deliberate spellings with their own
replies ("holaaa", "ola") keep them.
"""

import re
from collections.abc import Callable, Collection, Mapping

Rewrite = Callable[[str], str]
MIN_SQUEEZED = 4


def squeeze_long_runs(word: str) -> str:
    return re.sub(r"(.)\1{2,}", r"\1", word)


def squeeze_final_vowels(word: str) -> str:
    squeezed = re.sub(r"([aeiou])\1+$", r"\1", word)
    return squeezed if len(squeezed) >= MIN_SQUEEZED else word


def x_as_ch(word: str) -> str:
    return word.replace("x", "ch")


def k_as_qu_or_c(word: str) -> str:
    return re.sub(r"k(?=[ei])", "qu", word).replace("k", "c")


def drop_superlative(word: str) -> str:
    return re.sub(r"isim([oa]s?)$", r"\1", word)


def drop_diminutive(word: str) -> str:
    return re.sub(r"(?:it|ill)([oa]s?)$", r"\1", word)


REWRITES: tuple[Rewrite, ...] = (
    squeeze_long_runs,
    squeeze_final_vowels,
    x_as_ch,
    k_as_qu_or_c,
    drop_superlative,
    drop_diminutive,
)


def respell(word: str, vocabulary: Collection[str], aliases: Mapping[str, str]) -> str:
    """The first known form reached via the alias table or the stacked rewrites, else the word."""
    if word in vocabulary:
        return word
    alias = aliases.get(word)
    if alias is not None:
        return alias
    current = word
    for rewrite in REWRITES:
        current = rewrite(current)
        if current in vocabulary:
            return current
    return word


def standard_vocabulary(
    words: Collection[str], aliases: Mapping[str, str], keep: Collection[str]
) -> frozenset[str]:
    """The words that are not a kid spelling of another word in the same set."""
    known = frozenset(words)
    return frozenset(w for w in known if w in keep or respell(w, known - {w}, aliases) == w)
