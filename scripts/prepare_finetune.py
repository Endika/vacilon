import argparse
from pathlib import Path

from vacilon.domain.dataset_split import split_by_topic, without_guarded
from vacilon.infrastructure.corpus_files import read_topics
from vacilon.infrastructure.data_files import load_guardrails
from vacilon.infrastructure.dataset_files import write_finetune_sets
from vacilon.infrastructure.tokenizer import VacilonTokenizer


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=Path("data"))
    parser.add_argument("--tokenizer", type=Path, default=Path("models/tokenizer.json"))
    parser.add_argument("--val-frac", type=float, default=0.1)
    parser.add_argument("--seed", type=int, default=0)
    args = parser.parse_args()

    tokenizer = VacilonTokenizer.load(args.tokenizer)
    train, val = split_by_topic(
        without_guarded(read_topics(args.data / "corpus"), load_guardrails()),
        args.val_frac,
        args.seed,
    )
    n_train, n_val = write_finetune_sets(train, val, tokenizer, args.data)
    print(f"finetune: {n_train} train turns, {n_val} val turns")


if __name__ == "__main__":
    main()
