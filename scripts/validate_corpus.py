import argparse
import sys
from pathlib import Path

from vacilon.domain.corpus import validate_corpus
from vacilon.infrastructure.corpus_files import load_corpus


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dir", type=Path, default=Path("data/corpus"))
    args = parser.parse_args()

    report = validate_corpus(load_corpus(args.dir))
    for topic, count in report.counts.items():
        print(f"{topic:<22} {count:>5}")
    print(f"{'total':<22} {sum(report.counts.values()):>5}")
    for error in report.errors:
        print(f"error: {error}", file=sys.stderr)
    print(f"{len(report.errors)} error(s)")
    return 0 if report.ok else 1


if __name__ == "__main__":
    sys.exit(main())
