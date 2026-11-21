import json
from pathlib import Path

import numpy as np
import pytest

from vacilon.application.data_preparation import finetune_records, tokenize_pretrain
from vacilon.domain.dataset_split import split_by_topic, without_guarded
from vacilon.domain.format import BOT_ID, EOS_ID, USER_ID, format_turn
from vacilon.infrastructure.data_files import load_guardrails
from vacilon.infrastructure.dataset_files import write_jsonl, write_pretrain_bins
from vacilon.infrastructure.pair_sampling import count_lines, sample_pairs
from vacilon.infrastructure.tokenizer import VacilonTokenizer, train_tokenizer

PAIRS = [(f"mensaje número {i}", f"respuesta número {i}") for i in range(200)]


@pytest.fixture(scope="module")
def tok() -> VacilonTokenizer:
    texts = [t for pair in PAIRS for t in pair]
    return VacilonTokenizer(train_tokenizer(texts, vocab_size=300))


@pytest.fixture
def tsv(tmp_path: Path) -> Path:
    path = tmp_path / "pairs.tsv"
    path.write_text("".join(f"{m}\t{r}\n" for m, r in PAIRS), encoding="utf-8")
    return path


def test_sampling_is_reproducible_and_exact(tsv: Path) -> None:
    assert count_lines(tsv) == 200
    first = list(sample_pairs(tsv, 50, seed=1))
    assert first == list(sample_pairs(tsv, 50, seed=1))
    assert len(set(first)) == 50
    assert first != list(sample_pairs(tsv, 50, seed=2))
    assert len(list(sample_pairs(tsv, 1000, seed=1))) == 200


def test_pretrain_bins_hold_every_turn(tok: VacilonTokenizer, tmp_path: Path) -> None:
    train, val = tmp_path / "t.bin", tmp_path / "v.bin"
    chunks = tokenize_pretrain(PAIRS, tok, val_frac=0.2, seed=0)
    n_train, n_val = write_pretrain_bins(chunks, train, val)
    data = np.concatenate([np.fromfile(train, dtype=np.uint16), np.fromfile(val, dtype=np.uint16)])
    assert len(data) == n_train + n_val > 0
    assert n_val > 0
    assert (data == USER_ID).sum() == (data == BOT_ID).sum() == (data == EOS_ID).sum() == 200


def test_finetune_split_is_stratified_and_disjoint() -> None:
    topics = {
        "a": [(f"a{i}", f"ra{i}") for i in range(20)],
        "b": [(f"b{i}", f"rb{i}") for i in range(10)],
    }
    train, val = split_by_topic(topics, 0.1, seed=0)
    assert (train, val) == split_by_topic(topics, 0.1, seed=0)
    assert [t for t, *_ in val].count("a") == 2 and [t for t, *_ in val].count("b") == 1
    assert not set(train) & set(val)


def test_finetune_jsonl_marks_bot_position(tok: VacilonTokenizer, tmp_path: Path) -> None:
    path = tmp_path / "f.jsonl"
    assert write_jsonl(finetune_records([("t", "hola amigo", "adiós tronco")], tok), path) == 1
    record = json.loads(path.read_text())
    assert record["ids"] == tok.encode(format_turn("hola amigo", "adiós tronco"))
    assert record["ids"][record["bot_pos"]] == BOT_ID
    assert record["ids"][-1] == EOS_ID


def test_without_guarded_drops_pairs_the_fixed_phrases_answer() -> None:
    topics = {
        "emociones": [("tengo miedo", "abrazo"), ("estoy feliz", "bien")],
        "quien_eres": [("como te llamas", "Chispa")],
    }
    assert without_guarded(topics, load_guardrails()) == {"emociones": [("estoy feliz", "bien")]}


def test_finetune_split_is_stable_when_other_rows_change() -> None:
    rows = [(f"mensaje {i}", f"respuesta {i}") for i in range(30)]
    _, val = split_by_topic({"a": rows}, 0.1, seed=0)
    train_only = [r for r in rows if ("a", *r) not in val]
    shrunk = rows[:]
    shrunk.remove(train_only[0])
    shrunk.append(("mensaje nuevo", "respuesta nueva"))
    assert split_by_topic({"a": shrunk}, 0.1, seed=0)[1] == val


def test_editing_a_reply_never_moves_its_row_across() -> None:
    rows = [(f"mensaje {i}", f"respuesta {i}") for i in range(30)]
    _, val = split_by_topic({"a": rows}, 0.1, seed=0)
    edited = [(m, r + " ¿Y tú?") for m, r in rows]
    _, val_edited = split_by_topic({"a": edited}, 0.1, seed=0)
    assert [m for _, m, _ in val_edited] == [m for _, m, _ in val]
