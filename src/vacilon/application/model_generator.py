import numpy as np

from vacilon.application.ports import Tokenizer
from vacilon.domain.format import BOT, BOT_ID, EOS_ID, USER
from vacilon.domain.npgpt import NPGPT
from vacilon.domain.sampling import penalize, sample_next


class ModelGenerator:
    """Samples a reply to one message from the runtime model, token by token."""

    def __init__(
        self,
        model: NPGPT,
        tokenizer: Tokenizer,
        rng: np.random.Generator,
        *,
        temperature: float = 0.5,
        top_k: int = 20,
        top_p: float = 0.0,
        max_new_tokens: int = 60,
        repetition_penalty: float = 1.3,
        no_repeat_ngram: int = 3,
    ) -> None:
        self.model = model
        self.tokenizer = tokenizer
        self.rng = rng
        self.temperature = temperature
        self.top_k = top_k
        self.top_p = top_p
        self.max_new_tokens = max_new_tokens
        self.repetition_penalty = repetition_penalty
        self.no_repeat_ngram = no_repeat_ngram

    def __call__(self, message: str) -> str:
        block = self.model.cfg.block_size
        ids = self.tokenizer.encode(f"{USER}{message}{BOT}")
        assert ids[-1] == BOT_ID
        out: list[int] = []
        cache = self.model.new_cache()
        logits = self.model.forward(ids[-block:], cache)[-1]
        for _ in range(self.max_new_tokens):
            adjusted = penalize(logits, out, self.repetition_penalty, self.no_repeat_ngram)
            token = sample_next(adjusted, self.rng, self.temperature, self.top_k, self.top_p)
            if token == EOS_ID:
                break
            ids.append(token)
            out.append(token)
            if cache.length >= block:
                cache = self.model.new_cache()
                logits = self.model.forward(ids[-block:], cache)[-1]
            else:
                logits = self.model.forward([token], cache)[-1]
        return self.tokenizer.decode(out).strip()
