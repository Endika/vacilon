import re
from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from typing import Any

import numpy as np

from vacilon.domain.safety import normalize_for_filter


@dataclass(frozen=True)
class Intent:
    id: str
    patterns: tuple[re.Pattern[str], ...]
    responses: tuple[str, ...]


def parse_guardrails(data: Mapping[str, Any]) -> tuple[Intent, ...]:
    intents: Iterable[Mapping[str, Any]] = data["intents"]
    return tuple(
        Intent(
            item["id"],
            tuple(re.compile(p) for p in item["patterns"]),
            tuple(item["responses"]),
        )
        for item in intents
    )


def match_intent(message: str, intents: tuple[Intent, ...]) -> Intent | None:
    text = normalize_for_filter(message)
    return next((i for i in intents if any(p.search(text) for p in i.patterns)), None)


def fixed_reply(message: str, intents: tuple[Intent, ...], rng: np.random.Generator) -> str | None:
    intent = match_intent(message, intents)
    return intent.responses[int(rng.integers(len(intent.responses)))] if intent else None
