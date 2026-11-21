import json
from pathlib import Path
from typing import Any

import pytest

from vacilon.domain.spelling import respell, standard_vocabulary

VOCAB = frozenset(
    {"mucho", "tengo", "hola", "quiero", "aburro", "perro", "pero", "chispa", "noches"}
)
ALIASES = {"tng": "tengo", "q": "que"}


@pytest.mark.parametrize(
    ("word", "expected"),
    [
        ("muxo", "mucho"),
        ("tng", "tengo"),
        ("holaaa", "hola"),
        ("holaa", "hola"),
        ("kiero", "quiero"),
        ("aburrooo", "aburro"),
        ("muchisimo", "mucho"),
        ("perrito", "perro"),
        ("chispita", "chispa"),
        ("noxes", "noches"),
    ],
)
def test_kid_spellings_reach_a_known_word(word: str, expected: str) -> None:
    assert respell(word, VOCAB, ALIASES) == expected


def test_known_words_are_never_touched() -> None:
    assert respell("perro", VOCAB, ALIASES) == "perro"


def test_consonant_doubles_are_not_squeezed() -> None:
    assert respell("perro", VOCAB - {"perro"}, ALIASES) == "perro"


def test_short_words_keep_their_vowels() -> None:
    assert respell("lee", frozenset({"le"}), {}) == "lee"


def test_unknown_words_stay_as_they_are() -> None:
    assert respell("zarandaja", VOCAB, ALIASES) == "zarandaja"


def test_standard_vocabulary_drops_spellings_of_other_words_but_keeps_deliberate_ones() -> None:
    words = {"hola", "holaa", "holaaa", "kiero", "quiero", "tirita", "tira"}
    assert standard_vocabulary(words, {}, {"holaaa", "tirita"}) == {
        "hola",
        "holaaa",
        "quiero",
        "tirita",
        "tira",
    }


FIXTURE = Path(__file__).resolve().parents[1] / "web" / "test" / "fixtures" / "spelling.json"
PARITY = json.loads(FIXTURE.read_text(encoding="utf-8"))


@pytest.mark.parametrize("case", PARITY["respell"], ids=lambda c: c["word"])
def test_respell_parity_fixture(case: dict[str, Any]) -> None:
    got = respell(case["word"], frozenset(case["vocabulary"]), case["aliases"])
    assert got == case["expected"]


def test_standard_vocabulary_parity_fixture() -> None:
    case = PARITY["standardVocabulary"]
    got = standard_vocabulary(case["words"], case["aliases"], case["keep"])
    assert sorted(got) == case["expected"]
