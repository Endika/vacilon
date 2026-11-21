from pathlib import Path

import pytest

from vacilon.domain.format import BOT, BOT_ID, EOS, EOS_ID, PAD, PAD_ID, USER, USER_ID, format_turn
from vacilon.infrastructure.tokenizer import VacilonTokenizer, train_tokenizer

TEXTS = [
    "¿Qué tal, compañero? ¡Estás más perdido que un pulpo en un garaje!",
    "Mañana será otro día, y la niña pidió más piñas.",
    "El año pasado fui a España y no me enteré de nada.",
    "¡Qué pena! ¿Cómo que no? Sí, claro, está en camión.",
] * 20


@pytest.fixture(scope="module")
def tok() -> VacilonTokenizer:
    return VacilonTokenizer(train_tokenizer(TEXTS, vocab_size=400))


@pytest.mark.parametrize(
    "text",
    [
        "¿Qué tal, compañero?",
        "¡Estás más perdido que un pulpo!",
        "El año que viene, la niña come piña.",
        "Ñandú, ÁÉÍÓÚ, üñ",
    ],
)
def test_roundtrip_keeps_accents_and_punctuation(tok: VacilonTokenizer, text: str) -> None:
    assert tok.decode(tok.encode(text)) == text


def test_special_tokens_have_fixed_ids(tok: VacilonTokenizer) -> None:
    assert [tok.token_id(t) for t in (PAD, USER, BOT, EOS)] == [0, 1, 2, 3]


def test_turn_roundtrip(tok: VacilonTokenizer) -> None:
    turn = format_turn("¿Qué haces?", "Nada, ¡aquí, vacilando!")
    ids = tok.encode(turn)
    assert ids[0] == tok.token_id(USER)
    assert ids[-1] == tok.token_id(EOS)
    assert tok.decode(ids) == turn


def test_save_and_load(tok: VacilonTokenizer, tmp_path: Path) -> None:
    path = tmp_path / "tok.json"
    tok.save(path)
    loaded = VacilonTokenizer.load(path)
    assert loaded.encode("¿Mañana?") == tok.encode("¿Mañana?")


def test_special_token_ids_match_constants(tok: VacilonTokenizer) -> None:
    assert [tok.token_id(t) for t in (PAD, USER, BOT, EOS)] == [PAD_ID, USER_ID, BOT_ID, EOS_ID]
