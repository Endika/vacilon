import random
from dataclasses import asdict, dataclass
from pathlib import Path

import numpy as np
import torch

from vacilon.domain.examples import Example, sample_subs_turn
from vacilon.domain.schedule import cosine_lr
from vacilon.infrastructure.finetune_batches import collate, load_examples
from vacilon.infrastructure.torch_gpt import GPT
from vacilon.infrastructure.training import (
    Logger,
    load_model,
    make_optimizer,
    masked_loss,
    pick_device,
    save_checkpoint,
    set_lr,
)


@dataclass(frozen=True)
class FinetuneConfig:
    data: Path
    init: Path
    out: Path
    epochs: int
    batch_size: int
    lr: float
    warmup: int
    weight_decay: float
    dropout: float
    subs_mix: float
    seed: int


def batch_loss(model: GPT, examples: list[Example], device: torch.device) -> torch.Tensor:
    x, y, mask = collate(examples, device)
    return masked_loss(model(x), y, mask)


@torch.no_grad()
def evaluate(model: GPT, examples: list[Example], device: torch.device, batch_size: int) -> float:
    model.eval()
    total, count = 0.0, 0
    for i in range(0, len(examples), batch_size):
        chunk = examples[i : i + batch_size]
        x, y, mask = collate(chunk, device)
        total += masked_loss(model(x), y, mask).item() * int(mask.sum())
        count += int(mask.sum())
    model.train()
    return total / count


def draw_subs(subs: np.ndarray, rng: np.random.Generator, n: int, max_len: int) -> list[Example]:
    out: list[Example] = []
    while len(out) < n:
        turn = sample_subs_turn(subs, rng, max_len)
        if turn is not None:
            out.append(turn)
    return out


def run_finetune(cfg: FinetuneConfig) -> None:
    device = pick_device()
    random.seed(cfg.seed)
    torch.manual_seed(cfg.seed)
    rng = np.random.default_rng(cfg.seed)
    log = Logger(cfg.out.with_suffix(".log"))

    model = load_model(cfg.init, device, dropout=cfg.dropout)
    block = model.cfg.block_size
    train = load_examples(cfg.data / "finetune_train.jsonl", block)
    val = load_examples(cfg.data / "finetune_val.jsonl", block)
    n_subs = round(cfg.batch_size * cfg.subs_mix)
    subs = (
        np.memmap(cfg.data / "pretrain_train.bin", dtype=np.uint16, mode="r")
        if n_subs
        else np.empty(0, dtype=np.uint16)
    )
    n_own = cfg.batch_size - n_subs
    steps_per_epoch = -(-len(train) // n_own)
    total_steps = steps_per_epoch * cfg.epochs
    log(f"train {len(train)} val {len(val)} subs/batch {n_subs} args {asdict(cfg)}")

    optimizer = make_optimizer(model, cfg.lr, cfg.weight_decay)
    model.train()
    step, best = 0, float("inf")
    for epoch in range(1, cfg.epochs + 1):
        random.shuffle(train)
        for i in range(0, len(train), n_own):
            lr = cosine_lr(
                step, max_lr=cfg.lr, min_lr=cfg.lr / 10, warmup=cfg.warmup, total=total_steps
            )
            set_lr(optimizer, lr)
            batch = train[i : i + n_own] + draw_subs(subs, rng, n_subs, block)
            loss = batch_loss(model, batch, device)
            loss.backward()  # type: ignore[no-untyped-call]
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            optimizer.zero_grad(set_to_none=True)
            step += 1
        val_loss = evaluate(model, val, device, cfg.batch_size)
        saved = val_loss < best
        if saved:
            best = val_loss
            save_checkpoint(cfg.out, model, epoch=epoch, val_loss=val_loss)
        log(
            f"epoch {epoch} train_loss {loss.item():.4f} val_loss {val_loss:.4f}"
            f"{' (saved)' if saved else ''}"
        )
    log(f"best val_loss {best:.4f} -> {cfg.out}")
