import torch

from vacilon.domain.schedule import cosine_lr
from vacilon.infrastructure.torch_gpt import GPT, GPTConfig
from vacilon.infrastructure.training import masked_loss

TINY = GPTConfig(vocab_size=50, n_embd=16, n_layer=2, n_head=2, block_size=12)


def test_output_shape_and_default_size() -> None:
    model = GPT(TINY)
    assert model(torch.randint(0, 50, (3, 7))).shape == (3, 7, 50)
    assert 8_500_000 < GPT(GPTConfig()).num_params() < 9_000_000


def test_causality() -> None:
    torch.manual_seed(0)
    model = GPT(TINY).eval()
    a = torch.randint(0, 50, (1, 10))
    b = a.clone()
    b[0, 7] = (b[0, 7] + 1) % 50
    with torch.no_grad():
        la, lb = model(a), model(b)
    assert torch.allclose(la[:, :7], lb[:, :7], atol=1e-6)
    assert not torch.allclose(la[:, 7:], lb[:, 7:])


def test_masked_loss_ignores_unmasked_positions() -> None:
    logits = torch.randn(2, 5, 50)
    targets = torch.randint(0, 50, (2, 5))
    mask = torch.zeros(2, 5, dtype=torch.bool)
    mask[:, 3:] = True
    changed = targets.clone()
    changed[:, :3] = (changed[:, :3] + 1) % 50
    assert torch.equal(masked_loss(logits, targets, mask), masked_loss(logits, changed, mask))
    assert not torch.equal(masked_loss(logits, targets), masked_loss(logits, changed))


def test_cosine_lr_warms_up_then_decays() -> None:
    def lr(step: int) -> float:
        return cosine_lr(step, max_lr=1.0, min_lr=0.1, warmup=10, total=100)

    assert lr(0) < lr(9) == 1.0
    assert lr(100) == 0.1
    assert lr(50) < 1.0
