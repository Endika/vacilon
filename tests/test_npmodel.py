from pathlib import Path

import numpy as np
import torch

from helpers import random_model
from vacilon.domain.npgpt import NPGPT, NPConfig
from vacilon.infrastructure.export import export_state
from vacilon.infrastructure.npz_loader import load_npz
from vacilon.infrastructure.torch_gpt import GPTConfig


def float_np_model(cfg: GPTConfig, seed: int = 0) -> tuple[NPGPT, torch.nn.Module]:
    model = random_model(cfg, seed)
    weights = {k: v.detach().numpy().astype(np.float32) for k, v in model.state_dict().items()}
    return NPGPT(NPConfig.from_dict(cfg.to_dict()), weights), model


def test_float_parity_with_torch(tiny_cfg: GPTConfig) -> None:
    npm, model = float_np_model(tiny_cfg)
    ids = list(range(5, 5 + tiny_cfg.block_size))
    with torch.no_grad():
        expected = model(torch.tensor([ids]))[0].numpy()
    assert np.allclose(npm.forward(ids), expected, atol=1e-4)


def test_cache_matches_full_forward(tiny_cfg: GPTConfig) -> None:
    npm, _ = float_np_model(tiny_cfg)
    ids = [3, 9, 27, 81, 100, 4, 4, 7, 250, 1]
    full = npm.forward(ids)
    cache = npm.new_cache()
    parts = [npm.forward(ids[:4], cache)] + [npm.forward([t], cache) for t in ids[4:]]
    assert np.allclose(np.concatenate(parts), full, atol=1e-5)


def test_int8_parity(exported_dir: Path, tiny_cfg: GPTConfig) -> None:
    quant = load_npz(exported_dir / "vacilon.npz")
    ref, _ = float_np_model(tiny_cfg)
    rng = np.random.default_rng(1)
    ids = rng.integers(4, tiny_cfg.vocab_size, size=tiny_cfg.block_size).tolist()
    a, b = ref.forward(ids), quant.forward(ids)
    corr = np.corrcoef(a.ravel(), b.ravel())[0, 1]
    agree = float((a.argmax(-1) == b.argmax(-1)).mean())
    print(f"int8 correlation={corr:.5f} argmax agreement={agree:.3f}")
    assert corr > 0.99
    assert agree >= 0.95


def test_real_config_export_is_under_20mb(tmp_path: Path) -> None:
    model = random_model(GPTConfig())
    out = tmp_path / "vacilon.npz"
    export_state(GPTConfig().to_dict(), model.state_dict(), out)
    size = out.stat().st_size
    print(f"real-config export: {size / 1e6:.2f} MB")
    assert size < 20_000_000
