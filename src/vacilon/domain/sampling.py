from collections.abc import Sequence

import numpy as np

from vacilon.domain.npgpt import Array


def banned_by_ngram(generated: Sequence[int], n: int) -> set[int]:
    """Tokens that would repeat an n-gram already present in `generated`."""
    if n <= 0 or len(generated) < n - 1:
        return set()
    prefix = tuple(generated[len(generated) - n + 1 :]) if n > 1 else ()
    return {
        generated[i + n - 1]
        for i in range(len(generated) - n + 1)
        if tuple(generated[i : i + n - 1]) == prefix
    }


def penalize(
    logits: Array, generated: Sequence[int], penalty: float, no_repeat_ngram: int
) -> Array:
    """Repetition penalty on already generated tokens plus hard n-gram blocking."""
    out = logits.astype(np.float32, copy=True)
    if penalty != 1.0 and generated:
        seen = np.fromiter(set(generated), dtype=np.int64)
        out[seen] = np.where(out[seen] > 0, out[seen] / penalty, out[seen] * penalty)
    banned = banned_by_ngram(generated, no_repeat_ngram)
    if banned:
        out[list(banned)] = -np.inf
    return out


def sample_next(
    logits: Array, rng: np.random.Generator, temperature: float, top_k: int, top_p: float
) -> int:
    if temperature <= 0:
        return int(logits.argmax())
    scaled = logits.astype(np.float64) / temperature
    if top_k > 0 and top_k < scaled.size:
        kth = np.partition(scaled, -top_k)[-top_k]
        scaled = np.where(scaled < kth, -np.inf, scaled)
    probs = np.exp(scaled - scaled.max())
    probs /= probs.sum()
    if 0 < top_p < 1:
        order = np.argsort(-probs)
        keep = np.cumsum(probs[order]) - probs[order] < top_p
        mask = np.zeros_like(probs, dtype=bool)
        mask[order[keep]] = True
        probs = np.where(mask, probs, 0.0)
        probs /= probs.sum()
    return int(rng.choice(probs.size, p=probs))
