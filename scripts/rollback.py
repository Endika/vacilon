import argparse
import sys
from pathlib import Path

from vacilon.application.promotion import rollback
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
    parser = argparse.ArgumentParser(description="Go back to the previous model version.")
    parser.add_argument("--registry", type=Path, default=DEFAULT_REGISTRY)
    parser.add_argument("--final-dir", type=Path, default=DEFAULT_FINAL)
    parser.add_argument("--web-model", type=Path, default=DEFAULT_WEB_MODEL)
    parser.add_argument("--fixtures-dir", type=Path, default=DEFAULT_FIXTURES)
    args = parser.parse_args()
    try:
        version = rollback(Registry(args.registry, args.final_dir))
    except RegistryError as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    publish_to_web(args.final_dir, args.web_model, args.fixtures_dir, version)
    print(f"Vuelta a {version} (app: {args.web_model})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
