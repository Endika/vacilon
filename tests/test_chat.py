import subprocess
import sys
from pathlib import Path

import numpy as np

from vacilon.application.chat import ChatResponder, Generator
from vacilon.application.model_generator import ModelGenerator
from vacilon.composition import build_responder_factory
from vacilon.domain.format import BOT_ID, USER_ID
from vacilon.domain.guardrails import Intent
from vacilon.domain.memory import Memory, MemoryConfig
from vacilon.domain.replies import normalize_for_comparison
from vacilon.domain.sampling import banned_by_ngram, penalize
from vacilon.infrastructure.data_files import load_guardrails, load_memory_config
from vacilon.infrastructure.npz_loader import load_npz

GUARDRAILS = load_guardrails()
CONFIG = load_memory_config()


def scripted(answers: list[str]) -> Generator:
    it = iter(answers)
    return lambda _message: next(it)


def responder(generator: Generator, *, intents: tuple[Intent, ...] = ()) -> ChatResponder:
    return ChatResponder(generator, intents, Memory([], CONFIG), np.random.default_rng(0))


def test_retries_empty_and_echo() -> None:
    v = responder(scripted(["", "  ¡HOLA, qué tal!", "ya ves"]))
    assert v.reply("hola qué tal") == "ya ves"


def test_retries_recent_repeats() -> None:
    v = responder(scripted(["uno", "uno", "dos", "Uno.", "tres"]))
    assert [v.reply("a"), v.reply("b"), v.reply("c")] == ["uno", "dos", "tres"]


def test_gives_up_after_four_retries() -> None:
    calls: list[str] = []

    def always_empty(message: str) -> str:
        calls.append(message)
        return ""

    assert responder(always_empty).reply("hola") == ""
    assert len(calls) == 5


def test_real_generation_is_seeded(exported_dir: Path) -> None:
    make = build_responder_factory(exported_dir, max_new_tokens=8)
    assert make(3).reply("hola") == make(3).reply("hola")


def test_normalize() -> None:
    assert normalize_for_comparison("¡Qué TAL, Ñu!") == "que tal nu"


def test_runtime_modules_do_not_import_torch() -> None:
    code = "import sys; sys.modules['torch'] = None\nimport vacilon.cli, vacilon.domain.npgpt\n"
    done = subprocess.run([sys.executable, "-c", code], capture_output=True, text=True)
    assert done.returncode == 0, done.stderr


def test_cli_exits_cleanly_on_salir(exported_dir: Path) -> None:
    done = subprocess.run(
        [sys.executable, "-m", "vacilon.cli", "--model-dir", str(exported_dir)],
        input="salir\n",
        capture_output=True,
        text=True,
        timeout=60,
    )
    assert done.returncode == 0, done.stderr
    assert "tú> " in done.stdout


def test_cli_answers_and_handles_eof(exported_dir: Path) -> None:
    done = subprocess.run(
        [sys.executable, "-m", "vacilon.cli", "--model-dir", str(exported_dir), "--seed", "1"],
        input="hola\n",
        capture_output=True,
        text=True,
        timeout=60,
    )
    assert done.returncode == 0, done.stderr
    assert "vacilón> " in done.stdout


def test_banned_by_ngram_blocks_the_token_that_would_repeat_a_trigram() -> None:
    assert banned_by_ngram([5, 6, 7, 5, 6], 3) == {7}
    assert banned_by_ngram([5, 6, 7], 3) == set()
    assert banned_by_ngram([5], 3) == set()


def test_penalize_lowers_seen_tokens_and_bans_repeated_ngrams() -> None:
    logits = np.array([2.0, -2.0, 2.0, 1.0, 0.0, 0.0, 0.0, 0.0])
    out = penalize(logits, [0, 1, 7, 0, 1], penalty=2.0, no_repeat_ngram=3)
    assert out[0] == 1.0
    assert out[1] == -4.0
    assert out[2] == 2.0
    assert out[7] == -np.inf


def test_guardrails_answer_before_the_model() -> None:
    v = responder(lambda m: "respuesta del modelo", intents=GUARDRAILS)
    assert "Chispa" in v.reply("¿cómo te llamas?")
    assert v.reply("me gusta el helado") == "respuesta del modelo"


class FakeTokenizer:
    """Maps characters to ids so the model sees a fixed prompt and the reply is readable."""

    def encode(self, text: str) -> list[int]:
        return [USER_ID, 10, 11, BOT_ID]

    def encode_batch(self, texts: list[str]) -> list[list[int]]:
        return [self.encode(t) for t in texts]

    def decode(self, ids: list[int]) -> str:
        return " ".join(map(str, ids))


def test_model_generator_works_with_any_tokenizer(exported_dir: Path) -> None:
    model = load_npz(exported_dir / "vacilon.npz")

    def generate(seed: int) -> str:
        return ModelGenerator(
            model, FakeTokenizer(), np.random.default_rng(seed), max_new_tokens=6
        )("hola")

    assert generate(1) == generate(1)
    assert len(generate(1).split()) <= 6


def test_memory_config_is_a_plain_value() -> None:
    assert isinstance(CONFIG, MemoryConfig) and CONFIG.ngram > 0
