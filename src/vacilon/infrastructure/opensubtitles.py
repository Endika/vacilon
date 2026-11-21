import shlex
import subprocess
from collections.abc import Iterator

URL = "https://object.pouta.csc.fi/OPUS-OpenSubtitles/v2018/mono/es.txt.gz"
DEFAULT_LINES = 25_000_000


def stream_lines(url: str, max_lines: int) -> Iterator[str]:
    cmd = f"curl -s {shlex.quote(url)} | gunzip | head -n {int(max_lines)}"
    with subprocess.Popen(
        cmd, shell=True, stdout=subprocess.PIPE, text=True, encoding="utf-8", errors="replace"
    ) as proc:
        assert proc.stdout is not None
        yield from proc.stdout
