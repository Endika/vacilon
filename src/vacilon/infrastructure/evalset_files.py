import json
from pathlib import Path

from vacilon.domain.evalset import EvalItem, ensure_unique_ids, parse_item


def load_evalset(directory: Path) -> list[EvalItem]:
    items: list[EvalItem] = []
    for path in sorted(directory.glob("*.jsonl")):
        with path.open(encoding="utf-8") as f:
            items.extend(parse_item(json.loads(line)) for line in f if line.strip())
    return ensure_unique_ids(items)
