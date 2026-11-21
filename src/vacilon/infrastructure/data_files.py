import json
from collections.abc import Iterable
from pathlib import Path

from vacilon.domain.guardrails import Intent, parse_guardrails
from vacilon.domain.memory import Memory, MemoryConfig
from vacilon.infrastructure.paths import (
    DEFAULT_BLOCKLIST,
    DEFAULT_GUARDRAILS,
    DEFAULT_MEMORY,
    DEFAULT_MEMORY_CONFIG,
)


def load_blocklist(path: Path = DEFAULT_BLOCKLIST) -> frozenset[str]:
    return frozenset(json.loads(path.read_text(encoding="utf-8")))


def load_guardrails(path: Path = DEFAULT_GUARDRAILS) -> tuple[Intent, ...]:
    return parse_guardrails(json.loads(path.read_text(encoding="utf-8")))


def load_memory_config(path: Path = DEFAULT_MEMORY_CONFIG) -> MemoryConfig:
    raw = json.loads(path.read_text(encoding="utf-8"))
    return MemoryConfig(
        threshold=raw["threshold"],
        tie_margin=raw["tieMargin"],
        ngram=raw["ngram"],
        stopwords=frozenset(raw["stopwords"]) | frozenset(raw.get("fillers", [])),
        aliases=dict(raw.get("aliases", {})),
        keep=frozenset(raw.get("keep", [])),
    )


def load_memory(path: Path = DEFAULT_MEMORY, config: MemoryConfig | None = None) -> Memory:
    pairs = json.loads(path.read_text(encoding="utf-8"))
    return Memory(((m, r) for m, r in pairs), config or load_memory_config())


def write_memory(pairs: Iterable[tuple[str, str]], path: Path) -> int:
    rows = [[m, r] for m, r in pairs]
    path.write_text(json.dumps(rows, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    return len(rows)
