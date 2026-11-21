import argparse
from collections.abc import Iterator
from itertools import chain
from pathlib import Path

from vacilon.infrastructure.pair_sampling import sample_pairs
from vacilon.infrastructure.tokenizer import (
    VOCAB_SIZE,
    VacilonTokenizer,
    read_pair_lines,
    train_tokenizer,
)


def texts(data: Path, subs_pairs: int, seed: int) -> Iterator[str]:
    corpus = sorted((data / "corpus").glob("*.tsv"))
    subs = data / "subs_pairs.tsv"
    sampled = (
        chain.from_iterable(sample_pairs(subs, subs_pairs, seed)) if subs.exists() else iter(())
    )
    return chain(sampled, read_pair_lines(corpus))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=Path("data"))
    parser.add_argument("--out", type=Path, default=Path("models/tokenizer.json"))
    parser.add_argument("--vocab-size", type=int, default=VOCAB_SIZE)
    parser.add_argument("--subs-pairs", type=int, default=2_000_000)
    parser.add_argument("--seed", type=int, default=0)
    args = parser.parse_args()

    tokenizer = VacilonTokenizer(
        train_tokenizer(texts(args.data, args.subs_pairs, args.seed), args.vocab_size)
    )
    args.out.parent.mkdir(parents=True, exist_ok=True)
    tokenizer.save(args.out)
    print(f"{tokenizer.vocab_size} tokens -> {args.out}")


if __name__ == "__main__":
    main()
