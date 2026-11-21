import json
from pathlib import Path

import numpy as np
from numpy.typing import NDArray

from vacilon.domain.npgpt import NPGPT, Array, NPConfig


def dequantize(q: NDArray[np.int8], scale: NDArray[np.floating]) -> Array:
    return (q.astype(np.float32) * scale.astype(np.float32)[:, None]).astype(np.float32)


def load_npz(path: Path) -> NPGPT:
    with np.load(path) as data:
        cfg = NPConfig.from_dict(json.loads(bytes(data["config"]).decode("utf-8")))
        weights: dict[str, Array] = {}
        for key in data.files:
            if key.endswith(".q"):
                name = key[:-2]
                weights[name] = dequantize(data[key], data[name + ".s"])
            elif key != "config" and not key.endswith(".s"):
                weights[key] = data[key].astype(np.float32)
    return NPGPT(cfg, weights)
