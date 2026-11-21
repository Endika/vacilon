import re
from collections.abc import Iterable, Iterator

MIN_CHARS = 2
MAX_CHARS = 200

_TAGS = re.compile(r"<[^>]*>|\{[^}]*\}|\[[^\]]*\]")
_URL = re.compile(r"https?://|www\.|\.(?:com|org|net|es)\b", re.IGNORECASE)
_CREDITS = re.compile(
    r"subt[ií]tulos?|subtitulad[oa]|traducid[oa]|traducci[oó]n|sincroniz|opensubtitles|addic7ed",
    re.IGNORECASE,
)
_LEADING_DASHES = re.compile(r"^[\s\-–—]+")
_SPACES = re.compile(r"\s+")


def clean_line(line: str) -> str | None:
    text = _TAGS.sub(" ", line)
    text = _LEADING_DASHES.sub("", text)
    text = _SPACES.sub(" ", text).strip()
    if not MIN_CHARS <= len(text) <= MAX_CHARS:
        return None
    if not any(c.isalpha() for c in text):
        return None
    if _URL.search(text) or _CREDITS.search(text):
        return None
    return text


def pairs(lines: Iterable[str]) -> Iterator[tuple[str, str]]:
    """Yield (message, reply) from consecutive valid lines, skipping consecutive repeats."""
    previous: str | None = None
    for raw in lines:
        current = clean_line(raw)
        if current is None:
            previous = None
            continue
        if current == previous:
            continue
        if previous is not None:
            yield previous, current
        previous = current
