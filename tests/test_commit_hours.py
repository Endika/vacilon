import os
import subprocess
from pathlib import Path

import pytest

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "git-hooks" / "commit-hours.sh"


def run_hook(
    tmp_path: Path, dow: int, hour: int, enabled: bool = True
) -> subprocess.CompletedProcess[str]:
    config = tmp_path / "gitconfig"
    config.write_text("[vacilon]\n\tcommitHours = true\n" if enabled else "")
    env = {
        **os.environ,
        "GIT_CONFIG_GLOBAL": str(config),
        "GIT_CONFIG_NOSYSTEM": "1",
        "VACILON_NOW_DOW": str(dow),
        "VACILON_NOW_HOUR": f"{hour:02d}",
    }
    return subprocess.run(
        ["sh", str(SCRIPT)], env=env, cwd=tmp_path, capture_output=True, text=True, check=False
    )


def test_blocks_weekday_before_19(tmp_path: Path) -> None:
    result = run_hook(tmp_path, dow=3, hour=18)
    assert result.returncode == 1
    assert "a partir de las 19:00" in result.stderr


@pytest.mark.parametrize("hour", [0, 8, 9])
def test_blocks_early_hours_with_leading_zero(tmp_path: Path, hour: int) -> None:
    assert run_hook(tmp_path, dow=1, hour=hour).returncode == 1


def test_allows_weekday_from_19(tmp_path: Path) -> None:
    assert run_hook(tmp_path, dow=3, hour=19).returncode == 0


def test_allows_saturday_morning(tmp_path: Path) -> None:
    assert run_hook(tmp_path, dow=6, hour=10).returncode == 0


def test_allows_sunday(tmp_path: Path) -> None:
    assert run_hook(tmp_path, dow=7, hour=9).returncode == 0


def test_does_nothing_when_flag_unset(tmp_path: Path) -> None:
    assert run_hook(tmp_path, dow=3, hour=10, enabled=False).returncode == 0
