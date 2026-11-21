import argparse
from pathlib import Path

from vacilon.domain.dataset_split import without_guarded
from vacilon.infrastructure.corpus_files import read_topics
from vacilon.infrastructure.data_files import load_guardrails, write_memory
from vacilon.infrastructure.paths import DEFAULT_MEMORY


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=Path("data"))
    parser.add_argument("--out", type=Path, default=DEFAULT_MEMORY)
    args = parser.parse_args()

    topics = without_guarded(read_topics(args.data / "corpus"), load_guardrails())
    count = write_memory((p for rows in topics.values() for p in rows), args.out)
    print(f"memory: {count} pairs -> {args.out}")


if __name__ == "__main__":
    main()
