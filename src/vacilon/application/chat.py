from collections import deque
from collections.abc import Callable

import numpy as np

from vacilon.domain.guardrails import Intent, fixed_reply
from vacilon.domain.memory import Memory
from vacilon.domain.replies import is_acceptable, normalize_for_comparison

RETRIES = 4
HISTORY = 5
WELCOME = "¡Bip! Soy Chispa, una robot huevito que flota. ¿Hablamos?"

Generator = Callable[[str], str]


class ChatResponder:
    """Fixed phrases first, then the corpus memory, then the model with retries."""

    def __init__(
        self,
        generator: Generator,
        guardrails: tuple[Intent, ...],
        memory: Memory,
        rng: np.random.Generator,
    ) -> None:
        self.generator = generator
        self.guardrails = guardrails
        self.memory = memory
        self.rng = rng
        self.recent: deque[str] = deque(maxlen=HISTORY)

    def reply(self, message: str) -> str:
        fixed = fixed_reply(message, self.guardrails, self.rng)
        if fixed is not None:
            return fixed
        remembered = self.memory.recall(message, self.recent, self.rng)
        if remembered is not None:
            self.recent.append(remembered)
            return remembered
        answer = self._generate(message)
        self.recent.append(answer)
        return answer

    def _generate(self, message: str) -> str:
        key = normalize_for_comparison(message)
        answer = ""
        for _ in range(RETRIES + 1):
            answer = self.generator(message)
            if is_acceptable(key, answer, self.recent):
                break
        return answer


ResponderFactory = Callable[[int | None], ChatResponder]
