from pathlib import Path

import pytest

from helpers import random_model
from vacilon.infrastructure.export import export_checkpoint
from vacilon.infrastructure.tokenizer import train_tokenizer
from vacilon.infrastructure.torch_gpt import GPTConfig
from vacilon.infrastructure.training import save_checkpoint

TEXTS = ["hola qué tal", "pues ya ves tú", "vaya tela con eso", "no me digas nada"] * 20


@pytest.fixture
def tiny_cfg() -> GPTConfig:
    return GPTConfig(vocab_size=300, n_embd=32, n_layer=2, n_head=4, block_size=24)


@pytest.fixture
def exported_dir(tmp_path: Path, tiny_cfg: GPTConfig) -> Path:
    tokenizer = tmp_path / "tokenizer.json"
    train_tokenizer(TEXTS, vocab_size=tiny_cfg.vocab_size).save(str(tokenizer))
    ckpt = tmp_path / "ck.pt"
    save_checkpoint(ckpt, random_model(tiny_cfg))
    out = tmp_path / "final"
    export_checkpoint(ckpt, tokenizer, out)
    return out
