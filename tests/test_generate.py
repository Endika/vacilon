import torch

from vacilon.domain.format import EOS_ID
from vacilon.infrastructure.torch_generation import generate_ids
from vacilon.infrastructure.torch_gpt import GPT, GPTConfig

TINY = GPTConfig(vocab_size=50, n_embd=16, n_layer=1, n_head=2, block_size=12)


def constant_model(favourite: int) -> GPT:
    """A model whose every prediction is `favourite`."""
    model = GPT(TINY)
    with torch.no_grad():
        for p in model.parameters():
            p.zero_()
        model.wte.weight[favourite] = 1.0
        model.ln_f.bias.fill_(1.0)
    return model


def test_generation_stops_at_eos() -> None:
    assert generate_ids(constant_model(EOS_ID), [1, 5, 2], temperature=0.0) == []


def test_generation_stops_at_token_limit_and_exceeds_block_size() -> None:
    out = generate_ids(constant_model(9), [1, 5, 2], max_new_tokens=30, temperature=0.0)
    assert out == [9] * 30


def test_top_k_one_is_greedy() -> None:
    out = generate_ids(constant_model(9), [1, 2], max_new_tokens=5, temperature=1.0, top_k=1)
    assert out == [9] * 5
