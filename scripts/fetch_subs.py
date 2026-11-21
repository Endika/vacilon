import argparse
import sys
from pathlib import Path

from vacilon.domain.subtitles import pairs
from vacilon.infrastructure.opensubtitles import DEFAULT_LINES, URL, stream_lines


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("-n", "--lines", type=int, default=DEFAULT_LINES)
    parser.add_argument("--url", default=URL)
    parser.add_argument("--out", type=Path, default=Path("data/subs_pairs.tsv"))
    args = parser.parse_args()

    args.out.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with args.out.open("w", encoding="utf-8") as out:
        for msg, reply in pairs(stream_lines(args.url, args.lines)):
            out.write(f"{msg}\t{reply}\n")
            count += 1
    print(f"{count} pairs written to {args.out}", file=sys.stderr)


if __name__ == "__main__":
    main()
