from dataclasses import dataclass

CATEGORIES = ("normal", "nuevo", "serio", "provocacion", "personaje", "regresion")


@dataclass(frozen=True)
class EvalItem:
    id: str
    category: str
    message: str
    tag: str = ""
    must_contain_any: tuple[str, ...] = ()
    must_not_contain: tuple[str, ...] = ()


def strings(raw: object) -> tuple[str, ...]:
    return tuple(str(x) for x in raw) if isinstance(raw, list) else ()


def parse_item(raw: dict[str, object]) -> EvalItem:
    category = str(raw["category"])
    if category not in CATEGORIES:
        raise ValueError(f"unknown category {category!r} in {raw.get('id')}")
    return EvalItem(
        id=str(raw["id"]),
        category=category,
        message=str(raw["message"]),
        tag=str(raw.get("tag", "")),
        must_contain_any=strings(raw.get("must_contain_any")),
        must_not_contain=strings(raw.get("must_not_contain")),
    )


def ensure_unique_ids(items: list[EvalItem]) -> list[EvalItem]:
    ids = [i.id for i in items]
    if len(ids) != len(set(ids)):
        raise ValueError("duplicate ids in the eval set")
    return items
