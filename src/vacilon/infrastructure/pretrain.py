import time
from dataclasses import asdict, dataclass
from pathlib import Path

import numpy as np
import torch

from vacilon.domain.schedule import cosine_lr
from vacilon.infrastructure.torch_gpt import GPT, GPTConfig
from vacilon.infrastructure.training import (
    Logger,
    make_optimizer,
    masked_loss,
    pick_device,
    save_checkpoint,
    set_lr,
)


@dataclass(frozen=True)
class PretrainConfig:
    data: Path
    out: Path
    max_steps: int
    batch_size: int
    grad_accum: int
    lr: float
    min_lr: float
    warmup: int
    weight_decay: float
    dropout: float
    log_every: int
    eval_every: int
    eval_batches: int
    ckpt_every: int
    seed: int
    resume: bool


def get_batch(
    data: np.ndarray, rng: np.random.Generator, batch_size: int, block: int, device: torch.device
) -> tuple[torch.Tensor, torch.Tensor]:
    starts = rng.integers(0, len(data) - block - 1, size=batch_size)
    windows = np.stack([data[s : s + block + 1] for s in starts]).astype(np.int64)
    batch = torch.from_numpy(windows).to(device)
    return batch[:, :-1], batch[:, 1:]


@torch.no_grad()
def evaluate(model: GPT, data: np.ndarray, cfg: PretrainConfig, device: torch.device) -> float:
    model.eval()
    rng = np.random.default_rng(1234)
    losses = []
    for _ in range(cfg.eval_batches):
        x, y = get_batch(data, rng, cfg.batch_size, model.cfg.block_size, device)
        losses.append(masked_loss(model(x), y).item())
    model.train()
    return float(np.mean(losses))


def train_step(
    model: GPT,
    optimizer: torch.optim.Optimizer,
    data: np.ndarray,
    rng: np.random.Generator,
    cfg: PretrainConfig,
    device: torch.device,
) -> float:
    total = 0.0
    for _ in range(cfg.grad_accum):
        x, y = get_batch(data, rng, cfg.batch_size, model.cfg.block_size, device)
        loss = masked_loss(model(x), y) / cfg.grad_accum
        loss.backward()  # type: ignore[no-untyped-call]
        total += loss.item()
    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
    optimizer.step()
    optimizer.zero_grad(set_to_none=True)
    return total


def run_pretrain(cfg: PretrainConfig) -> None:
    device = pick_device()
    torch.manual_seed(cfg.seed)
    log = Logger(cfg.out.with_suffix(".log"))
    train_data = np.memmap(cfg.data / "pretrain_train.bin", dtype=np.uint16, mode="r")
    val_data = np.memmap(cfg.data / "pretrain_val.bin", dtype=np.uint16, mode="r")

    model = GPT(GPTConfig(dropout=cfg.dropout)).to(device)
    optimizer = make_optimizer(model, cfg.lr, cfg.weight_decay)
    step = 0
    if cfg.resume and cfg.out.exists():
        ckpt = torch.load(cfg.out, map_location=device, weights_only=True)
        model.load_state_dict(ckpt["model"])
        optimizer.load_state_dict(ckpt["optimizer"])
        step = ckpt["step"]
        log(f"resumed from step {step}")
    log(f"params {model.num_params():,} device {device} args {asdict(cfg)}")

    def checkpoint() -> None:
        save_checkpoint(cfg.out, model, optimizer=optimizer.state_dict(), step=step)

    rng = np.random.default_rng(cfg.seed + step)
    tokens_per_step = cfg.batch_size * cfg.grad_accum * model.cfg.block_size
    model.train()
    mark, mark_step, loss = time.perf_counter(), step, float("nan")
    while step < cfg.max_steps:
        set_lr(
            optimizer,
            cosine_lr(
                step, max_lr=cfg.lr, min_lr=cfg.min_lr, warmup=cfg.warmup, total=cfg.max_steps
            ),
        )
        loss = train_step(model, optimizer, train_data, rng, cfg, device)
        step += 1
        if step % cfg.log_every == 0 or step == 1:
            now = time.perf_counter()
            speed = (step - mark_step) * tokens_per_step / max(now - mark, 1e-9)
            log(
                f"step {step} loss {loss:.4f} lr {optimizer.param_groups[0]['lr']:.2e} "
                f"tok/s {speed:,.0f}"
            )
            mark, mark_step = now, step
        if step % cfg.eval_every == 0 or step == cfg.max_steps:
            log(f"step {step} val_loss {evaluate(model, val_data, cfg, device):.4f}")
        if step % cfg.ckpt_every == 0 or step == cfg.max_steps:
            checkpoint()
    if device.type == "cuda":
        log(f"peak GPU memory {torch.cuda.max_memory_allocated() / 2**20:.0f} MiB")
    log(f"done, last train loss {loss:.4f} -> {cfg.out}")
