from vacilon.domain.subtitles import clean_line, pairs


def test_strips_tags_and_dialogue_dash() -> None:
    assert clean_line("- <i>Hola,   qué tal</i>") == "Hola, qué tal"
    assert clean_line("— {\\an8}¿Vienes?") == "¿Vienes?"


def test_rejects_symbols_only() -> None:
    assert clean_line("♪ ♪") is None
    assert clean_line("...") is None
    assert clean_line("123 !!") is None


def test_rejects_translator_credits_and_urls() -> None:
    assert clean_line("Subtítulos por Fulano") is None
    assert clean_line("Traducido por la comunidad") is None
    assert clean_line("Visita www.ejemplo.com") is None
    assert clean_line("http://algo.net/x") is None


def test_length_limits() -> None:
    assert clean_line("a") is None
    assert clean_line("ay") == "ay"
    assert clean_line("a" * 200) == "a" * 200
    assert clean_line("a" * 201) is None


def test_pairs_use_consecutive_valid_lines() -> None:
    assert list(pairs(["Hola", "¿Qué tal?", "Bien"])) == [
        ("Hola", "¿Qué tal?"),
        ("¿Qué tal?", "Bien"),
    ]


def test_pairs_skip_consecutive_repeats() -> None:
    assert list(pairs(["Hola", "Hola", "Adiós"])) == [("Hola", "Adiós")]


def test_pairs_do_not_bridge_invalid_lines() -> None:
    assert list(pairs(["Hola", "♪", "Adiós"])) == []
