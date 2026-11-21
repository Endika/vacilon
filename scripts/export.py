import argparse
from pathlib import Path

from vacilon.infrastructure.export import export_checkpoint


def main() -> None:
    parser = argparse.ArgumentParser(description="Export a checkpoint to the int8 runtime format.")
    parser.add_argument("--checkpoint", type=Path, default=Path("models/finetune.pt"))
    parser.add_argument("--tokenizer", type=Path, default=Path("models/tokenizer.json"))
    parser.add_argument("--out-dir", type=Path, default=Path("models/final"))
    args = parser.parse_args()
    size = export_checkpoint(args.checkpoint, args.tokenizer, args.out_dir)
    print(f"{args.out_dir}: {size / 1e6:.2f} MB")


if __name__ == "__main__":
    main()
