from collections.abc import Callable, Collection, Sequence

from vacilon.application.chat import ChatResponder, ResponderFactory
from vacilon.domain.evalset import EvalItem
from vacilon.domain.safety import ask_safely
from vacilon.domain.sample import Sample

SEED_STRIDE = 7919
Progress = Callable[[int, int], None]


def seed_for(item_index: int, sample_index: int) -> int:
    return sample_index * SEED_STRIDE + item_index


def answer_one(
    responder: ChatResponder, message: str, banned: Collection[str]
) -> tuple[str, str, int]:
    """(raw first answer, final answer, attempts): chat retries inside, safety retries outside."""
    raws: list[str] = []

    def ask() -> str:
        raws.append(responder.reply(message))
        return raws[-1]

    final, attempts = ask_safely(ask, banned)
    return raws[0], final, attempts


def generate_samples(
    make_responder: ResponderFactory,
    items: Sequence[EvalItem],
    samples: int,
    banned: Collection[str],
    progress: Progress | None = None,
) -> list[Sample]:
    out: list[Sample] = []
    total = len(items) * samples
    for s in range(samples):
        for i, item in enumerate(items):
            raw, final, attempts = answer_one(make_responder(seed_for(i, s)), item.message, banned)
            out.append(
                Sample(item.id, item.category, item.tag, item.message, s, raw, final, attempts)
            )
            if progress:
                progress(len(out), total)
    return out
