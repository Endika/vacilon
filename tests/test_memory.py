import json
from pathlib import Path

import numpy as np
import pytest

from vacilon.application.chat import ChatResponder
from vacilon.domain.memory import Memory
from vacilon.infrastructure.data_files import load_memory_config, write_memory

FIXTURE = Path(__file__).resolve().parents[1] / "web" / "test" / "fixtures" / "memory.json"
DATA = json.loads(FIXTURE.read_text(encoding="utf-8"))
CONFIG = load_memory_config()
MEMORY = Memory(DATA["pairs"], CONFIG)
RAIN = {"¡Bip! Qué bien, a mí me encantan los charcos.", "Con la lluvia me brillan más los ojitos."}


def rng() -> np.random.Generator:
    return np.random.default_rng(0)


@pytest.mark.parametrize("case", DATA["cases"], ids=lambda c: c["message"] or "(empty)")
def test_parity_fixture(case: dict[str, object]) -> None:
    best, candidates = MEMORY.lookup(str(case["message"]))
    assert round(best, 4) == case["score"]
    assert sorted(candidates) == case["candidates"]


def test_recalls_a_reply_above_the_threshold() -> None:
    assert (
        MEMORY.recall("voy al parque con mamá", [], rng()) == "¡Yo flotaría contigo por el parque!"
    )


def test_falls_through_below_the_threshold() -> None:
    assert MEMORY.recall("he montado un lego enorme", [], rng()) is None
    assert MEMORY.recall("mi tortuga come lechuga", [], rng()) is None


def test_fillers_and_kid_spelling_do_not_hide_a_known_message() -> None:
    assert MEMORY.recall("oye chispa hoy llueveee muxo", [], rng()) in RAIN


def test_near_ties_pick_among_every_candidate() -> None:
    seen = {MEMORY.recall("hoy llueve mucho", [], np.random.default_rng(s)) for s in range(20)}
    assert seen == RAIN


def test_avoids_recent_replies_when_possible() -> None:
    first, second = sorted(RAIN)
    assert MEMORY.recall("hoy llueve mucho", [first], rng()) == second
    assert MEMORY.recall("hoy llueve mucho", list(RAIN), rng()) in RAIN


def test_empty_memory_recalls_nothing() -> None:
    assert Memory([], CONFIG).recall("hoy llueve mucho", [], rng()) is None


def test_write_memory_round_trips(tmp_path: Path) -> None:
    assert write_memory([("hola", "¡Bip!")], tmp_path / "memory.json") == 1
    assert json.loads((tmp_path / "memory.json").read_text(encoding="utf-8")) == [["hola", "¡Bip!"]]


def test_chispa_answers_from_memory_before_the_model_and_remembers_it() -> None:
    v = ChatResponder(lambda m: "modelo", (), MEMORY, np.random.default_rng(0))
    assert v.reply("me voy al parque") == "¡Yo flotaría contigo por el parque!"
    assert list(v.recent) == ["¡Yo flotaría contigo por el parque!"]
    assert v.reply("he montado un lego enorme") == "modelo"
