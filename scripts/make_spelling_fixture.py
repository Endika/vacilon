"""Regenerate web/test/fixtures/spelling.json from the Python domain (the source of truth)."""

import json
from pathlib import Path

from vacilon.domain.spelling import respell, standard_vocabulary

OUT = Path(__file__).resolve().parents[1] / "web" / "test" / "fixtures" / "spelling.json"
VOCABULARY = ["mucho", "tengo", "hola", "quiero", "aburro", "perro", "pero", "chispa", "noches"]
ALIASES = {"tng": "tengo", "q": "que"}
WORDS = [
    "muxo", "tng", "holaaa", "holaa", "kiero", "aburrooo", "muchisimo", "perrito", "chispita",
    "noxes", "perro", "zarandaja", "q", "lee", "kasa", "tengoo", "muuuucho", "pelillo",
]  # fmt: skip
STANDARD_WORDS = ["hola", "holaa", "holaaa", "kiero", "quiero", "tirita", "tira", "q", "que"]
KEEP = ["holaaa", "tirita"]


def build() -> dict[str, object]:
    cases = []
    for word in WORDS:
        vocabulary = ["le"] if word == "lee" else VOCABULARY
        aliases = {} if word == "lee" else ALIASES
        cases.append(
            {
                "word": word,
                "vocabulary": vocabulary,
                "aliases": aliases,
                "expected": respell(word, frozenset(vocabulary), aliases),
            }
        )
    return {
        "respell": cases,
        "standardVocabulary": {
            "words": STANDARD_WORDS,
            "aliases": ALIASES,
            "keep": KEEP,
            "expected": sorted(standard_vocabulary(STANDARD_WORDS, ALIASES, KEEP)),
        },
    }


if __name__ == "__main__":
    OUT.write_text(json.dumps(build(), ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"wrote {OUT}")
