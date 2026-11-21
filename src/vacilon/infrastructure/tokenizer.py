from collections.abc import Iterable, Iterator
from pathlib import Path

from tokenizers import Tokenizer, decoders, models, normalizers, pre_tokenizers, trainers

from vacilon.domain.format import SPECIAL_TOKENS

VOCAB_SIZE = 4096


def read_pair_lines(paths: Iterable[Path]) -> Iterator[str]:
    """Yield every message and reply of the given TSV files as separate texts."""
    for path in paths:
        with path.open(encoding="utf-8") as f:
            for line in f:
                yield from (part for part in line.rstrip("\n").split("\t") if part)


def train_tokenizer(texts: Iterable[str], vocab_size: int = VOCAB_SIZE) -> Tokenizer:
    tokenizer = Tokenizer(models.BPE())
    tokenizer.normalizer = normalizers.NFC()
    tokenizer.pre_tokenizer = pre_tokenizers.ByteLevel(add_prefix_space=False)
    tokenizer.decoder = decoders.ByteLevel()
    trainer = trainers.BpeTrainer(
        vocab_size=vocab_size,
        special_tokens=SPECIAL_TOKENS,
        initial_alphabet=pre_tokenizers.ByteLevel.alphabet(),
    )
    tokenizer.train_from_iterator(texts, trainer)
    return tokenizer


class VacilonTokenizer:
    def __init__(self, tokenizer: Tokenizer) -> None:
        self._tok = tokenizer

    @classmethod
    def load(cls, path: Path) -> "VacilonTokenizer":
        return cls(Tokenizer.from_file(str(path)))

    def save(self, path: Path) -> None:
        self._tok.save(str(path))

    @property
    def vocab_size(self) -> int:
        return self._tok.get_vocab_size()

    def token_id(self, token: str) -> int:
        found = self._tok.token_to_id(token)
        if found is None:
            raise KeyError(token)
        return found

    def encode(self, text: str) -> list[int]:
        return self._tok.encode(text).ids

    def encode_batch(self, texts: list[str]) -> list[list[int]]:
        return [e.ids for e in self._tok.encode_batch(texts)]

    def decode(self, ids: list[int]) -> str:
        return self._tok.decode(ids, skip_special_tokens=False)
