import argparse
from pathlib import Path

from vacilon.application.data_preparation import tokenize_pretrain
from vacilon.domain.dataset_split import split_by_topic
from vacilon.infrastructure.corpus_files import read_topics
from vacilon.infrastructure.dataset_files import write_finetune_sets, write_pretrain_bins
from vacilon.infrastructure.pair_sampling import sample_pairs
from vacilon.infrastructure.tokenizer import VacilonTokenizer


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=Path("data"))
    parser.add_argument("--tokenizer", type=Path, default=Path("models/tokenizer.json"))
    parser.add_argument("--subs-pairs", type=int, default=10_000_000)
    parser.add_argument("--pretrain-val-frac", type=float, default=0.005)
    parser.add_argument("--finetune-val-frac", type=float, default=0.1)
    parser.add_argument("--seed", type=int, default=0)
    args = parser.parse_args()

    tokenizer = VacilonTokenizer.load(args.tokenizer)

    pairs = sample_pairs(args.data / "subs_pairs.tsv", args.subs_pairs, args.seed)
    chunks = tokenize_pretrain(pairs, tokenizer, val_frac=args.pretrain_val_frac, seed=args.seed)
    train_tokens, val_tokens = write_pretrain_bins(
        chunks, args.data / "pretrain_train.bin", args.data / "pretrain_val.bin"
    )
    print(f"pretrain: {train_tokens:,} train tokens, {val_tokens:,} val tokens")

    train, val = split_by_topic(
        read_topics(args.data / "corpus"), args.finetune_val_frac, args.seed
    )
    n_train, n_val = write_finetune_sets(train, val, tokenizer, args.data)
    print(f"finetune: {n_train} train turns, {n_val} val turns")


if __name__ == "__main__":
    main()
