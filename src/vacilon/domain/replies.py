import re
import unicodedata
from collections.abc import Iterable


def normalize_for_comparison(text: str) -> str:
    folded = unicodedata.normalize("NFKD", text.lower())
    stripped = "".join(ch for ch in folded if not unicodedata.combining(ch))
    return re.sub(r"[^a-z0-9]+", " ", stripped).strip()


def is_acceptable(message_key: str, answer: str, recent: Iterable[str]) -> bool:
    """A non-empty answer that neither echoes the message nor repeats a recent reply."""
    key = normalize_for_comparison(answer)
    return (
        bool(key)
        and key != message_key
        and key not in {normalize_for_comparison(r) for r in recent}
    )
