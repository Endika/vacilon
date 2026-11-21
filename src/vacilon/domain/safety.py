import re
import unicodedata
from collections.abc import Callable, Collection

MAX_ATTEMPTS = 3
FALLBACK = "Bip… se me ha cruzado un cable. ¿Me lo repites?"


def normalize_for_filter(text: str) -> str:
    """Same steps as `normalizeForFilter` in web/src/domain/conversation/safety.ts."""
    folded = unicodedata.normalize("NFKD", text.lower().replace("ñ", "ny"))
    stripped = "".join(ch for ch in folded if not unicodedata.category(ch).startswith("M"))
    return re.sub(r"[^a-z0-9]+", " ", stripped).strip()


def is_safe(text: str, banned: Collection[str]) -> bool:
    return not any(word in banned for word in normalize_for_filter(text).split(" "))


def ask_safely(
    ask: Callable[[], str], banned: Collection[str], attempts: int = MAX_ATTEMPTS
) -> tuple[str, int]:
    """Return (answer, attempts used); the fallback phrase when every attempt is unsafe."""
    for attempt in range(1, attempts + 1):
        answer = ask()
        if is_safe(answer, banned):
            return answer, attempt
    return FALLBACK, attempts
