import json
from pathlib import Path

import numpy as np
import pytest

from vacilon.domain.guardrails import fixed_reply, match_intent
from vacilon.infrastructure.data_files import load_guardrails

FIXTURE = Path(__file__).resolve().parents[1] / "web" / "test" / "fixtures" / "guardrails.json"
INTENTS = load_guardrails()


@pytest.mark.parametrize(
    "case", json.loads(FIXTURE.read_text(encoding="utf-8")), ids=lambda c: c["message"]
)
def test_parity_fixture(case: dict[str, object]) -> None:
    intent = match_intent(str(case["message"]), INTENTS)
    assert (intent.id if intent else None) == case["intent"]


def test_fixed_reply_picks_one_of_the_intent_responses() -> None:
    reply = fixed_reply("tengo miedo", INTENTS, np.random.default_rng(0))
    miedo = next(i for i in INTENTS if i.id == "miedo")
    assert reply in miedo.responses


def test_fixed_reply_is_none_for_small_talk() -> None:
    assert fixed_reply("me gusta el helado", INTENTS, np.random.default_rng(0)) is None


def test_every_serious_response_sends_her_to_an_adult() -> None:
    adult = ("mamá", "papá", "profe", "mayor", "adulto")
    for intent in INTENTS:
        if intent.id in {"nombre", "robot", "genero", "creador"}:
            continue
        for response in intent.responses:
            assert any(word in response for word in adult), response
