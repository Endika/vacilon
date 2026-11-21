import math
from collections import Counter, defaultdict
from collections.abc import Collection, Iterable, Mapping
from dataclasses import dataclass, field

import numpy as np

from vacilon.domain.safety import normalize_for_filter
from vacilon.domain.spelling import respell, standard_vocabulary

Vector = dict[str, float]


@dataclass(frozen=True)
class MemoryConfig:
    threshold: float
    tie_margin: float
    ngram: int
    stopwords: frozenset[str]
    aliases: Mapping[str, str] = field(default_factory=dict)
    keep: frozenset[str] = frozenset()


def features(
    text: str, config: MemoryConfig, vocabulary: Collection[str] = frozenset()
) -> Counter[str]:
    """Content words plus character n-grams of each word, padded with underscores."""
    spelled = (respell(w, vocabulary, config.aliases) for w in normalize_for_filter(text).split())
    words = [w for w in spelled if w not in config.stopwords]
    counts = Counter(words)
    for word in words:
        padded = f"_{word}_"
        counts.update(padded[i : i + config.ngram] for i in range(len(padded) - config.ngram + 1))
    return counts


def unit(weights: Vector) -> Vector:
    norm = math.sqrt(sum(w * w for w in weights.values())) or 1.0
    return {k: w / norm for k, w in weights.items()}


class Memory:
    """Corpus replies retrievable by TF-IDF cosine similarity to the corpus messages."""

    def __init__(self, pairs: Iterable[tuple[str, str]], config: MemoryConfig) -> None:
        pairs = list(pairs)
        self.config = config
        self.replies = [reply for _, reply in pairs]
        words = {w for m, _ in pairs for w in normalize_for_filter(m).split()}
        self.vocabulary = standard_vocabulary(words, config.aliases, config.keep)
        docs = [features(message, config, self.vocabulary) for message, _ in pairs]
        document_frequency = Counter(k for doc in docs for k in doc)
        size = len(docs)
        self.idf = {k: math.log(size / df) for k, df in document_frequency.items()}
        self.unknown_idf = math.log(size) if size else 0.0
        self.postings: dict[str, list[tuple[int, float]]] = defaultdict(list)
        for index, doc in enumerate(docs):
            for k, w in unit(self.weigh(doc)).items():
                self.postings[k].append((index, w))

    def weigh(self, counts: Counter[str]) -> Vector:
        return {k: c * self.idf.get(k, self.unknown_idf) for k, c in counts.items()}

    def scores(self, message: str) -> dict[int, float]:
        query = unit(self.weigh(features(message, self.config, self.vocabulary)))
        scores: dict[int, float] = defaultdict(float)
        for k, qw in query.items():
            for index, w in self.postings.get(k, ()):
                scores[index] += qw * w
        return scores

    def lookup(self, message: str) -> tuple[float, list[str]]:
        """Best cosine and the distinct replies within the tie margin of it, in corpus order."""
        scores = self.scores(message)
        if not scores:
            return 0.0, []
        best = max(scores.values())
        near = sorted(i for i, s in scores.items() if s >= best - self.config.tie_margin)
        return best, list(dict.fromkeys(self.replies[i] for i in near))

    def recall(self, message: str, recent: Collection[str], rng: np.random.Generator) -> str | None:
        best, candidates = self.lookup(message)
        if best < self.config.threshold:
            return None
        fresh = [r for r in candidates if r not in recent] or candidates
        return fresh[int(rng.integers(len(fresh)))]
