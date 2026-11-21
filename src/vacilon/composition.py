from pathlib import Path

import numpy as np

from vacilon.application.chat import ChatResponder, ResponderFactory
from vacilon.application.model_generator import ModelGenerator
from vacilon.domain.format import MODEL_FILE, TOKENIZER_FILE
from vacilon.infrastructure.data_files import load_guardrails, load_memory
from vacilon.infrastructure.npz_loader import load_npz
from vacilon.infrastructure.tokenizer import VacilonTokenizer


def build_responder_factory(
    model_dir: Path, *, temperature: float = 0.5, top_k: int = 20, max_new_tokens: int = 60
) -> ResponderFactory:
    """Load the exported model and the web app's data once; each call yields a fresh responder."""
    model = load_npz(model_dir / MODEL_FILE)
    tokenizer = VacilonTokenizer.load(model_dir / TOKENIZER_FILE)
    guardrails = load_guardrails()
    memory = load_memory()

    def make(seed: int | None) -> ChatResponder:
        rng = np.random.default_rng(seed)
        generator = ModelGenerator(
            model,
            tokenizer,
            rng,
            temperature=temperature,
            top_k=top_k,
            max_new_tokens=max_new_tokens,
        )
        return ChatResponder(generator, guardrails, memory, rng)

    return make
