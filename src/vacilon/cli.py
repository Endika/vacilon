import argparse
import sys
from collections.abc import Sequence
from contextlib import suppress
from pathlib import Path

from vacilon.application.chat import WELCOME
from vacilon.composition import build_responder_factory
from vacilon.infrastructure.paths import DEFAULT_MODEL_DIR


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="vacilon", description="Chatea con Vacilón.")
    parser.add_argument("--temperature", type=float, default=0.5)
    parser.add_argument("--top-k", type=int, default=20)
    parser.add_argument("--seed", type=int, default=None)
    parser.add_argument("--model-dir", type=Path, default=DEFAULT_MODEL_DIR)
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    bot = build_responder_factory(args.model_dir, temperature=args.temperature, top_k=args.top_k)(
        args.seed
    )
    print(WELCOME)
    print('(escribe "salir" para irte)')
    with suppress(KeyboardInterrupt):
        while True:
            try:
                line = input("tú> ").strip()
            except EOFError:
                break
            if line.lower() == "salir":
                break
            if line:
                print(f"vacilón> {bot.reply(line)}")
    print()
    return 0


if __name__ == "__main__":
    sys.exit(main())
