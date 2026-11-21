import ast
from pathlib import Path

PACKAGE = Path(__file__).resolve().parents[1] / "src" / "vacilon"
EXTERNAL_LIBRARIES = ("torch", "tokenizers")
IO_MODULES = ("json", "gzip", "shutil", "subprocess", "tempfile", "os", "io", "socket", "urllib")
DOMAIN_ONLY_IO_MODULES = ("pathlib",)
FORBIDDEN = {
    "domain": (
        "vacilon.application",
        "vacilon.infrastructure",
        "vacilon.composition",
        "vacilon.cli",
    ),
    "application": ("vacilon.infrastructure", "vacilon.composition", "vacilon.cli"),
}


def imported_modules(path: Path) -> set[str]:
    modules: set[str] = set()
    for node in ast.walk(ast.parse(path.read_text(encoding="utf-8"))):
        if isinstance(node, ast.Import):
            modules.update(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module and node.level == 0:
            modules.add(node.module)
    return modules


def is_inside(module: str, prefix: str) -> bool:
    return module == prefix or module.startswith(prefix + ".")


def violations(layer: str) -> list[str]:
    pure = layer == "domain"
    banned = (*FORBIDDEN[layer], *EXTERNAL_LIBRARIES, *IO_MODULES)
    banned += DOMAIN_ONLY_IO_MODULES if pure else ()
    return [
        f"{path.relative_to(PACKAGE)} imports {module}"
        for path in sorted((PACKAGE / layer).rglob("*.py"))
        for module in sorted(imported_modules(path))
        if any(is_inside(module, prefix) for prefix in banned)
    ]


def test_domain_depends_on_nothing_outside_itself() -> None:
    assert violations("domain") == []


def test_application_does_not_reach_into_infrastructure() -> None:
    assert violations("application") == []


def test_layers_exist_and_are_not_empty() -> None:
    for layer in ("domain", "application", "infrastructure"):
        assert any((PACKAGE / layer).glob("*.py")), layer
