import argparse
import sys
from pathlib import Path

from vacilon.application.promotion import promote
from vacilon.domain.versions import RegistryError
from vacilon.infrastructure.paths import (
    DEFAULT_FINAL,
    DEFAULT_FIXTURES,
    DEFAULT_REGISTRY,
    DEFAULT_WEB_MODEL,
)
from vacilon.infrastructure.registry import Registry
from vacilon.infrastructure.web_publish import publish_to_web


def main() -> int:
    parser = argparse.ArgumentParser(description="Install a certified version in the app.")
    parser.add_argument("version")
    parser.add_argument("--force", action="store_true", help="promote without an APTO report")
    parser.add_argument("--registry", type=Path, default=DEFAULT_REGISTRY)
    parser.add_argument("--final-dir", type=Path, default=DEFAULT_FINAL)
    parser.add_argument("--web-model", type=Path, default=DEFAULT_WEB_MODEL)
    parser.add_argument("--fixtures-dir", type=Path, default=DEFAULT_FIXTURES)
    args = parser.parse_args()
    try:
        forced = promote(Registry(args.registry, args.final_dir), args.version, args.force)
    except RegistryError as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    if forced:
        print(
            f"AVISO: {args.version} se instala sin certificación APTO (--force).", file=sys.stderr
        )
    publish_to_web(args.final_dir, args.web_model, args.fixtures_dir, args.version)
    print(f"{args.version} es ahora la versión vigente (app: {args.web_model})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
