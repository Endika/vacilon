import json
from pathlib import Path

import pytest

from vacilon.application.promotion import promote, rollback
from vacilon.domain.versions import RegistryError
from vacilon.infrastructure.registry import Registry, copy_model, new_card
from vacilon.infrastructure.web_publish import publish_to_web


def write_report(registry: Registry, version: str, apto: bool) -> None:
    (registry.model_dir(version) / "report.json").write_text(json.dumps({"apto": apto}))


def add_version(registry: Registry, version: str, source: Path) -> None:
    copy_model(source, registry.model_dir(version))
    registry.write_card(version, new_card(version, "x.pt"))


def disk(tmp_path: Path, exported_dir: Path) -> Registry:
    registry = Registry(tmp_path / "registry", tmp_path / "final")
    registry.migrate_initial(exported_dir, "x.pt")
    return registry


def test_migrate_marks_v1_current(tmp_path: Path, exported_dir: Path) -> None:
    registry = disk(tmp_path, exported_dir)
    assert registry.current_version() == "v1"
    assert registry.read_card("v1")["source_checkpoint"] == "x.pt"
    assert registry.next_version() == "v2"
    with pytest.raises(RegistryError):
        registry.migrate_initial(exported_dir, "again")


def test_promote_requires_apto_report(tmp_path: Path, exported_dir: Path) -> None:
    registry = disk(tmp_path, exported_dir)
    add_version(registry, "v2", exported_dir)
    with pytest.raises(RegistryError):
        promote(registry, "v2")
    write_report(registry, "v2", False)
    with pytest.raises(RegistryError):
        promote(registry, "v2")
    assert registry.current_version() == "v1"


def test_promote_then_rollback(tmp_path: Path, exported_dir: Path) -> None:
    registry = disk(tmp_path, exported_dir)
    final = tmp_path / "final"
    add_version(registry, "v2", exported_dir)
    (registry.model_dir("v2") / "vacilon.npz").write_bytes(b"v2 bytes")
    write_report(registry, "v2", True)
    assert promote(registry, "v2") is False
    assert registry.current_version() == "v2"
    assert (final / "vacilon.npz").read_bytes() == b"v2 bytes"
    assert rollback(registry) == "v1"
    assert registry.current_version() == "v1"
    assert (final / "vacilon.npz").read_bytes() == (exported_dir / "vacilon.npz").read_bytes()
    with pytest.raises(RegistryError):
        rollback(registry)


def test_force_promotes_uncertified(tmp_path: Path, exported_dir: Path) -> None:
    registry = disk(tmp_path, exported_dir)
    add_version(registry, "v2", exported_dir)
    assert promote(registry, "v2", force=True) is True
    assert registry.current_version() == "v2"


def test_publish_to_web_stamps_the_version(tmp_path: Path, exported_dir: Path) -> None:
    web, fixtures = tmp_path / "web", tmp_path / "fixtures"
    publish_to_web(exported_dir, web, fixtures, "v7")
    manifest = json.loads((web / "manifest.json").read_text())
    assert manifest["model_version"] == "v7"
    assert (web / "weights.bin").exists() and (fixtures / "logits.json").exists()


class InMemoryStore:
    def __init__(self, models: dict[str, bool]) -> None:
        self.models = models
        self.trail = ["v1"]
        self.active = "v1"

    def has_model(self, version: str) -> bool:
        return version in self.models

    def is_certified(self, version: str) -> bool:
        return self.models[version]

    def history(self) -> list[str]:
        return list(self.trail)

    def activate(self, version: str) -> None:
        self.active = version

    def append_history(self, version: str) -> None:
        self.trail.append(version)

    def replace_history(self, trail: list[str]) -> None:
        self.trail = trail


def test_promotion_rules_hold_without_a_disk() -> None:
    store = InMemoryStore({"v1": True, "v2": False, "v3": True})
    with pytest.raises(RegistryError):
        promote(store, "v9")
    with pytest.raises(RegistryError):
        promote(store, "v2")
    assert promote(store, "v3") is False
    assert (store.active, store.trail) == ("v3", ["v1", "v3"])
    assert rollback(store) == "v1"
    assert (store.active, store.trail) == ("v1", ["v1"])
