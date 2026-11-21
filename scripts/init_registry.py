import argparse
from pathlib import Path

from vacilon.infrastructure.paths import DEFAULT_FINAL, DEFAULT_REGISTRY
from vacilon.infrastructure.registry import Registry


def main() -> None:
    parser = argparse.ArgumentParser(description="Register models/final as v1 (once).")
    parser.add_argument("--source-dir", type=Path, default=DEFAULT_FINAL)
    parser.add_argument("--checkpoint", default="models/chispa_e16.pt")
    parser.add_argument("--registry", type=Path, default=DEFAULT_REGISTRY)
    args = parser.parse_args()
    version = Registry(args.registry).migrate_initial(args.source_dir, args.checkpoint)
    print(f"{version} registrado y vigente en {args.registry}")


if __name__ == "__main__":
    main()
