import json
import shutil
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Any

from vacilon.domain.format import MODEL_FILE, TOKENIZER_FILE
from vacilon.domain.versions import RegistryError, next_version, sorted_versions
from vacilon.infrastructure.export import export_checkpoint
from vacilon.infrastructure.paths import DEFAULT_FINAL, DEFAULT_REGISTRY

CURRENT_FILE = "current"
HISTORY_FILE = "history"
CARD_FILE = "card.json"
REPORT_FILE = "report.json"
REPORT_HTML_FILE = "report.html"


def read_lines(path: Path) -> list[str]:
    return path.read_text(encoding="utf-8").split() if path.exists() else []


def copy_model(src: Path, dst: Path) -> None:
    dst.mkdir(parents=True, exist_ok=True)
    for name in (MODEL_FILE, TOKENIZER_FILE):
        shutil.copyfile(src / name, dst / name)


def new_card(version: str, source: str) -> dict[str, Any]:
    return {
        "version": version,
        "date": datetime.now().astimezone().isoformat(timespec="seconds"),
        "source_checkpoint": source,
        "verdict": None,
        "metrics": {},
    }


class Registry:
    """Model versions on disk: one directory each, plus the current pointer and its history."""

    def __init__(self, root: Path = DEFAULT_REGISTRY, final_dir: Path = DEFAULT_FINAL) -> None:
        self.root = root
        self.final_dir = final_dir

    def model_dir(self, version: str) -> Path:
        return self.root / version

    def current_version(self) -> str | None:
        lines = read_lines(self.root / CURRENT_FILE)
        return lines[0] if lines else None

    def history(self) -> list[str]:
        return read_lines(self.root / HISTORY_FILE)

    def set_current(self, version: str) -> None:
        self.root.mkdir(parents=True, exist_ok=True)
        (self.root / CURRENT_FILE).write_text(version + "\n", encoding="utf-8")

    def versions(self) -> list[str]:
        return sorted_versions(p.name for p in self.root.glob("v*") if p.is_dir())

    def next_version(self) -> str:
        return next_version(self.versions())

    def read_card(self, version: str) -> dict[str, Any]:
        path = self.model_dir(version) / CARD_FILE
        return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}

    def write_card(self, version: str, card: dict[str, Any]) -> None:
        path = self.model_dir(version) / CARD_FILE
        path.write_text(json.dumps(card, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    def ensure_card(self, version: str, source: str) -> None:
        if not self.read_card(version):
            self.write_card(version, new_card(version, source))

    def migrate_initial(self, source_dir: Path, source_checkpoint: str) -> str:
        """Register an already exported model directory as v1 and mark it current."""
        if self.versions():
            raise RegistryError("the registry already has versions")
        copy_model(source_dir, self.model_dir("v1"))
        self.write_card("v1", new_card("v1", source_checkpoint))
        self.set_current("v1")
        self.replace_history(["v1"])
        return "v1"

    def stage(self, version: str, candidate: Path, tokenizer: Path) -> None:
        """Export a .pt checkpoint, or copy an .npz, into the version directory."""
        with tempfile.TemporaryDirectory() as tmp:
            staging = Path(tmp)
            if candidate.suffix == ".npz":
                shutil.copyfile(candidate, staging / MODEL_FILE)
                shutil.copyfile(tokenizer, staging / TOKENIZER_FILE)
            else:
                export_checkpoint(candidate, tokenizer, staging)
            copy_model(staging, self.model_dir(version))

    def save_report(self, version: str, result: dict[str, Any], html: str) -> None:
        out_dir = self.model_dir(version)
        (out_dir / REPORT_FILE).write_text(
            json.dumps(result, ensure_ascii=False, indent=1), encoding="utf-8"
        )
        (out_dir / REPORT_HTML_FILE).write_text(html, encoding="utf-8")

    def record(self, version: str, apto: bool, metrics: dict[str, float]) -> None:
        card = self.read_card(version)
        card["verdict"] = "APTO" if apto else "NO APTO"
        card["metrics"] = metrics
        self.write_card(version, card)

    def has_model(self, version: str) -> bool:
        return (self.model_dir(version) / MODEL_FILE).exists()

    def is_certified(self, version: str) -> bool:
        path = self.model_dir(version) / REPORT_FILE
        if not path.exists():
            return False
        return bool(json.loads(path.read_text(encoding="utf-8")).get("apto"))

    def activate(self, version: str) -> None:
        copy_model(self.model_dir(version), self.final_dir)
        self.set_current(version)

    def append_history(self, version: str) -> None:
        with (self.root / HISTORY_FILE).open("a", encoding="utf-8") as f:
            f.write(version + "\n")

    def replace_history(self, trail: list[str]) -> None:
        (self.root / HISTORY_FILE).write_text("\n".join(trail) + "\n", encoding="utf-8")
