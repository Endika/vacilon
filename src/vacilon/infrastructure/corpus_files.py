from pathlib import Path

from vacilon.domain.dataset_split import Topics, parse_pairs


def load_corpus(directory: Path) -> dict[str, str]:
    return {path.stem: path.read_text(encoding="utf-8") for path in sorted(directory.glob("*.tsv"))}


def read_topics(directory: Path) -> Topics:
    parsed = {topic: parse_pairs(text) for topic, text in load_corpus(directory).items()}
    return {topic: pairs for topic, pairs in parsed.items() if pairs}
