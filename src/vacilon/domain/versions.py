import re
from collections.abc import Iterable

VERSION_RE = re.compile(r"^v(\d+)$")


class RegistryError(Exception):
    pass


def sorted_versions(names: Iterable[str]) -> list[str]:
    return sorted((n for n in names if VERSION_RE.match(n)), key=lambda v: int(v[1:]))


def next_version(versions: list[str]) -> str:
    return f"v{int(versions[-1][1:]) + 1}" if versions else "v1"
