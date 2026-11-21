import json
from pathlib import Path

import pytest

from vacilon.domain.safety import FALLBACK, ask_safely, is_safe, normalize_for_filter
from vacilon.infrastructure.data_files import load_blocklist

FIXTURE = Path(__file__).resolve().parents[1] / "web" / "test" / "fixtures" / "safety.json"
BANNED = load_blocklist()


@pytest.mark.parametrize(
    "case", json.loads(FIXTURE.read_text(encoding="utf-8")), ids=lambda c: c["text"]
)
def test_parity_fixture(case: dict[str, object]) -> None:
    assert is_safe(str(case["text"]), BANNED) is case["safe"]


def test_normalization_matches_the_app() -> None:
    assert normalize_for_filter("¡COÑO, Cabrón!") == "conyo cabron"
    assert normalize_for_filter("ｃｕｌｏ") == "culo"
    assert normalize_for_filter("  ") == ""


def test_enye_keeps_cono_safe() -> None:
    assert is_safe("un cono de fresa", BANNED)
    assert not is_safe("qué coño", BANNED)


def test_ask_safely_retries_then_returns_first_safe() -> None:
    answers = iter(["qué mierda", "joder", "hola"])
    assert ask_safely(lambda: next(answers), BANNED) == ("hola", 3)


def test_ask_safely_falls_back_after_three_unsafe() -> None:
    assert ask_safely(lambda: "mierda", BANNED) == (FALLBACK, 3)
