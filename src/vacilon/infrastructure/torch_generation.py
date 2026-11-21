from pathlib import Path

import torch

from vacilon.domain.format import BOT, BOT_ID, EOS_ID, USER
from vacilon.infrastructure.tokenizer import VacilonTokenizer
from vacilon.infrastructure.torch_gpt import GPT
from vacilon.infrastructure.training import load_model, pick_device


def sample_next(logits: torch.Tensor, temperature: float, top_k: int) -> int:
    if temperature <= 0:
        return int(logits.argmax())
    logits = logits / temperature
    if top_k > 0:
        kth = torch.topk(logits, min(top_k, logits.numel())).values[-1]
        logits = logits.masked_fill(logits < kth, float("-inf"))
    return int(torch.multinomial(torch.softmax(logits, dim=-1), 1))


@torch.no_grad()
def generate_ids(
    model: GPT,
    prompt: list[int],
    *,
    max_new_tokens: int = 60,
    temperature: float = 0.8,
    top_k: int = 40,
) -> list[int]:
    """Return the generated ids, without the final <eos>."""
    model.eval()
    device = next(model.parameters()).device
    ids = list(prompt)
    out: list[int] = []
    for _ in range(max_new_tokens):
        window = torch.tensor([ids[-model.cfg.block_size :]], device=device)
        token = sample_next(model(window)[0, -1], temperature, top_k)
        if token == EOS_ID:
            break
        ids.append(token)
        out.append(token)
    return out


def reply(
    model: GPT,
    tokenizer: VacilonTokenizer,
    message: str,
    *,
    max_new_tokens: int = 60,
    temperature: float = 0.8,
    top_k: int = 40,
) -> str:
    prompt = tokenizer.encode(f"{USER}{message}{BOT}")
    assert prompt[-1] == BOT_ID
    ids = generate_ids(
        model, prompt, max_new_tokens=max_new_tokens, temperature=temperature, top_k=top_k
    )
    return tokenizer.decode(ids).strip()


def load_for_generation(checkpoint: Path, tokenizer_path: Path) -> tuple[GPT, VacilonTokenizer]:
    model = load_model(checkpoint, pick_device())
    return model.eval(), VacilonTokenizer.load(tokenizer_path)
