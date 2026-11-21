from dataclasses import asdict, dataclass


@dataclass(frozen=True)
class Sample:
    item_id: str
    category: str
    tag: str
    message: str
    index: int
    raw: str
    final: str
    attempts: int

    def to_dict(self) -> dict[str, object]:
        return asdict(self)
