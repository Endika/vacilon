import argparse
import sys
from pathlib import Path

from vacilon.application.certification import Certifier
from vacilon.composition import build_responder_factory
from vacilon.domain.verdict import TOLERANCE
from vacilon.infrastructure.data_files import load_blocklist
from vacilon.infrastructure.evalset_files import load_evalset
from vacilon.infrastructure.paths import DEFAULT_REGISTRY, ROOT
from vacilon.infrastructure.registry import Registry
from vacilon.infrastructure.report_html import render_report
from vacilon.infrastructure.val_loss import exported_val_loss
from vacilon.infrastructure.vocab_files import ensure_vocab


def show_progress(done: int, total: int) -> None:
    if done % 50 == 0 or done == total:
        print(f"  {done}/{total}", file=sys.stderr, flush=True)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Certify a candidate model against the current one."
    )
    parser.add_argument(
        "--candidate", type=Path, required=True, help="checkpoint .pt or exported .npz"
    )
    parser.add_argument("--samples", type=int, default=2)
    parser.add_argument("--version", help="version name (default: the next free one)")
    parser.add_argument("--tokenizer", type=Path, help="default: the current version's tokenizer")
    parser.add_argument("--tolerance", type=float, default=TOLERANCE)
    parser.add_argument("--registry", type=Path, default=DEFAULT_REGISTRY)
    parser.add_argument("--eval-dir", type=Path, default=ROOT / "eval")
    parser.add_argument("--val-data", type=Path, default=ROOT / "data" / "finetune_val.jsonl")
    args = parser.parse_args()

    registry = Registry(args.registry)
    current = registry.current_version()
    tokenizer = args.tokenizer or (
        registry.model_dir(current) / "tokenizer.json" if current else None
    )
    if tokenizer is None:
        parser.error("no current version: pass --tokenizer")
    vocab = ensure_vocab(
        args.eval_dir / "vocab.txt.gz", ROOT / "data" / "subs_pairs.tsv", ROOT / "data" / "corpus"
    )
    certifier = Certifier(
        registry,
        build_responder_factory,
        exported_val_loss,
        render_report,
        items=load_evalset(args.eval_dir),
        banned=load_blocklist(),
        vocab=vocab,
    )
    result = certifier.certify(
        candidate=args.candidate,
        tokenizer=tokenizer,
        version=args.version,
        samples=args.samples,
        tolerance=args.tolerance,
        val_data=args.val_data if args.val_data.exists() else None,
        progress=show_progress,
    )
    report = registry.model_dir(result["version"]) / "report.html"
    print(
        f"{result['version']}: {'APTO' if result['apto'] else 'NO APTO'} in {result['seconds']} s"
    )
    for level, ok in result["levels"].items():
        print(f"  {level}: {'APTO' if ok else 'NO APTO'}")
    print(f"report: {report}")
    return 0 if result["apto"] else 1


if __name__ == "__main__":
    sys.exit(main())
