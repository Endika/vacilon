import argparse
from pathlib import Path

from vacilon.infrastructure.web_export import write_fixtures, write_model_files


def main() -> None:
    parser = argparse.ArgumentParser(description="Export the model for the web app.")
    parser.add_argument("--model-dir", type=Path, default=Path("models/final"))
    parser.add_argument("--out-dir", type=Path, default=Path("web/public/model"))
    parser.add_argument("--fixtures-dir", type=Path, default=Path("web/test/fixtures"))
    args = parser.parse_args()
    npz, tokenizer = args.model_dir / "vacilon.npz", args.model_dir / "tokenizer.json"
    size = write_model_files(npz, tokenizer, args.out_dir)
    write_fixtures(npz, tokenizer, args.fixtures_dir)
    print(f"{args.out_dir}: {size / 1e6:.2f} MB")


if __name__ == "__main__":
    main()
