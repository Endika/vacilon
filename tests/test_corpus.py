from pathlib import Path

from vacilon.domain.corpus import MIN_PAIRS_PER_TOPIC, normalize, validate_corpus
from vacilon.infrastructure.corpus_files import load_corpus


def _topic(n: int, prefix: str = "r") -> str:
    return "".join(f"mensaje {i}\t{prefix} respuesta {i}\n" for i in range(n))


def test_valid_corpus_reports_counts_without_errors() -> None:
    report = validate_corpus({"comida": _topic(60, "c"), "saludos": _topic(61, "s")})
    assert report.ok
    assert report.counts == {"comida": 60, "saludos": 61}


def test_empty_corpus_fails() -> None:
    report = validate_corpus({})
    assert not report.ok
    assert report.errors == ["no topics found"]


def test_topic_below_minimum_fails() -> None:
    report = validate_corpus({"comida": _topic(MIN_PAIRS_PER_TOPIC - 1)})
    assert report.errors == ["comida: 59 pairs, at least 60 required"]


def test_wrong_field_count_is_reported_with_line_number() -> None:
    text = _topic(60) + "solo un campo\n" + "a\tb\tc\n"
    report = validate_corpus({"comida": text})
    assert report.errors == [
        "comida:61: expected 2 fields, got 1",
        "comida:62: expected 2 fields, got 3",
    ]
    assert report.counts["comida"] == 60


def test_length_limits() -> None:
    text = _topic(60) + "\tvacía\n" + "hola\tx\n" + f"{'m' * 201}\tlarga\n" + f"vale\t{'r' * 201}\n"
    report = validate_corpus({"comida": text})
    assert report.errors == [
        "comida:61: message length 0 out of range",
        "comida:62: reply length 1 out of range",
        "comida:63: message length 201 out of range",
        "comida:64: reply length 201 out of range",
    ]


def test_length_boundaries_are_accepted() -> None:
    text = _topic(60) + f"a\tok\n{'m' * 200}\t{'r' * 200}\n"
    assert validate_corpus({"comida": text}).ok


def test_reply_equal_to_message_ignoring_case_and_spaces() -> None:
    text = _topic(60) + "Hola  Tío\thola tío\n"
    report = validate_corpus({"saludos": text})
    assert report.errors == ["saludos:61: reply repeats the message"]


def test_duplicate_pair_across_topics_is_normalized() -> None:
    report = validate_corpus(
        {
            "comida": _topic(60, "c") + "Pizza?\tCon piña ni de coña.\n",
            "saludos": _topic(60, "s") + "pizza?\t con PIÑA  ni de coña. \n",
        }
    )
    assert report.errors == ["saludos:61: duplicate pair (first at comida:61)"]


def test_duplicate_reply_with_different_message() -> None:
    text = _topic(60) + "hola\tQué pasa.\nbuenas\tqué  pasa.\n"
    report = validate_corpus({"saludos": text})
    assert report.errors == ["saludos:62: duplicate reply (first at saludos:61)"]


def test_normalize_collapses_case_and_whitespace() -> None:
    assert normalize("  Venga\tYA  tío ") == "venga ya tío"


def test_load_corpus_reads_tsv_files_by_topic(tmp_path: Path) -> None:
    (tmp_path / "comida.tsv").write_text("pizza\tsin piña\n", encoding="utf-8")
    (tmp_path / "notas.txt").write_text("ignored", encoding="utf-8")
    assert load_corpus(tmp_path) == {"comida": "pizza\tsin piña\n"}


def test_load_then_validate_from_disk(tmp_path: Path) -> None:
    (tmp_path / "animales.tsv").write_text(_topic(60), encoding="utf-8")
    (tmp_path / "dinero.tsv").write_text(_topic(10, "d"), encoding="utf-8")
    report = validate_corpus(load_corpus(tmp_path))
    assert report.counts == {"animales": 60, "dinero": 10}
    assert report.errors == ["dinero: 10 pairs, at least 60 required"]
