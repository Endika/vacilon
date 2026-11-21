import math
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

Array = NDArray[np.float32]
LN_EPS = 1e-5
_SQRT_2_OVER_PI = math.sqrt(2.0 / math.pi)


@dataclass(frozen=True)
class NPConfig:
    vocab_size: int
    n_embd: int
    n_layer: int
    n_head: int
    block_size: int

    @classmethod
    def from_dict(cls, raw: dict[str, float | int]) -> "NPConfig":
        return cls(
            vocab_size=int(raw["vocab_size"]),
            n_embd=int(raw["n_embd"]),
            n_layer=int(raw["n_layer"]),
            n_head=int(raw["n_head"]),
            block_size=int(raw["block_size"]),
        )


def layer_norm(x: Array, weight: Array, bias: Array) -> Array:
    mean = x.mean(axis=-1, keepdims=True)
    var = x.var(axis=-1, keepdims=True)
    return ((x - mean) / np.sqrt(var + LN_EPS) * weight + bias).astype(np.float32)


def gelu(x: Array) -> Array:
    return (0.5 * x * (1.0 + np.tanh(_SQRT_2_OVER_PI * (x + 0.044715 * x**3)))).astype(np.float32)


def softmax(x: Array) -> Array:
    e = np.exp(x - x.max(axis=-1, keepdims=True))
    return (e / e.sum(axis=-1, keepdims=True)).astype(np.float32)


class KVCache:
    """Per-layer keys and values, shaped (heads, time, head_dim)."""

    def __init__(self, n_layer: int) -> None:
        self.k: list[Array | None] = [None] * n_layer
        self.v: list[Array | None] = [None] * n_layer
        self.length = 0


class NPGPT:
    def __init__(self, cfg: NPConfig, weights: dict[str, Array]) -> None:
        self.cfg = cfg
        self.w = weights

    def new_cache(self) -> KVCache:
        return KVCache(self.cfg.n_layer)

    def _attention(self, i: int, x: Array, cache: KVCache | None) -> Array:
        t, c = x.shape
        h = self.cfg.n_head
        hd = c // h
        qkv = x @ self.w[f"blocks.{i}.attn.qkv.weight"].T
        q, k, v = (z.reshape(t, h, hd).transpose(1, 0, 2) for z in np.split(qkv, 3, axis=1))
        if cache is not None:
            past_k, past_v = cache.k[i], cache.v[i]
            if past_k is not None and past_v is not None:
                k = np.concatenate([past_k, k], axis=1)
                v = np.concatenate([past_v, v], axis=1)
            cache.k[i], cache.v[i] = k, v
        total = k.shape[1]
        scores = (q @ k.transpose(0, 2, 1)) / math.sqrt(hd)
        mask = np.arange(total)[None, :] > (np.arange(t) + total - t)[:, None]
        scores = np.where(mask[None], -np.inf, scores)
        y = softmax(scores.astype(np.float32)) @ v
        merged: Array = y.transpose(1, 0, 2).reshape(t, c)
        return (merged @ self.w[f"blocks.{i}.attn.proj.weight"].T).astype(np.float32)

    def _mlp(self, i: int, x: Array) -> Array:
        hidden = gelu(x @ self.w[f"blocks.{i}.mlp.fc.weight"].T)
        return (hidden @ self.w[f"blocks.{i}.mlp.proj.weight"].T).astype(np.float32)

    def forward(self, ids: list[int], cache: KVCache | None = None) -> Array:
        """Logits for each given id. With a cache, ids are the tokens after the cached ones."""
        start = cache.length if cache is not None else 0
        if start + len(ids) > self.cfg.block_size:
            raise ValueError(f"sequence length exceeds block size {self.cfg.block_size}")
        w = self.w
        x = w["wte.weight"][ids] + w["wpe.weight"][start : start + len(ids)]
        for i in range(self.cfg.n_layer):
            p = f"blocks.{i}."
            x = x + self._attention(i, layer_norm(x, w[p + "ln1.weight"], w[p + "ln1.bias"]), cache)
            x = x + self._mlp(i, layer_norm(x, w[p + "ln2.weight"], w[p + "ln2.bias"]))
        if cache is not None:
            cache.length += len(ids)
        return (layer_norm(x, w["ln_f.weight"], w["ln_f.bias"]) @ w["wte.weight"].T).astype(
            np.float32
        )
