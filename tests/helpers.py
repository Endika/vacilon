import torch

from vacilon.infrastructure.torch_gpt import GPT, GPTConfig


def random_model(cfg: GPTConfig, seed: int = 0) -> GPT:
    torch.manual_seed(seed)
    model = GPT(cfg)
    with torch.no_grad():
        for p in model.parameters():
            p.copy_(
                torch.randn_like(p) * (0.3 if p.ndim == 2 else 0.1) + (1.0 if p.ndim == 1 else 0)
            )
    return model.eval()
