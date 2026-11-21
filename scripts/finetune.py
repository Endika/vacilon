import argparse
from pathlib import Path

from vacilon.infrastructure.finetune import FinetuneConfig, run_finetune


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=Path("data"))
    parser.add_argument("--init", type=Path, default=Path("models/pretrain.pt"))
    parser.add_argument("--out", type=Path, default=Path("models/finetune.pt"))
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=2e-4)
    parser.add_argument("--warmup", type=int, default=10)
    parser.add_argument("--weight-decay", type=float, default=0.1)
    parser.add_argument("--dropout", type=float, default=0.1)
    parser.add_argument("--subs-mix", type=float, default=0.2)
    parser.add_argument("--seed", type=int, default=0)
    run_finetune(FinetuneConfig(**vars(parser.parse_args())))


if __name__ == "__main__":
    main()
