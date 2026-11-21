"""Regenerate the cases of web/test/fixtures/memory.json with the Python Memory.

The corpus pairs and the queries stay as they are in the file; only the expected scores and
candidates are recomputed.
"""

import json
from pathlib import Path

from vacilon.domain.memory import Memory
from vacilon.infrastructure.data_files import load_memory_config

OUT = Path(__file__).resolve().parents[1] / "web" / "test" / "fixtures" / "memory.json"
MESSAGES = [
    "hoy llueve mucho",
    "Hoy llueve muchísimo",
    "me voy al parque",
    "voy al parque con mamá",
    "mi gato Ñoño",
    "he montado un lego enorme",
    "",
    "el helado de fresa",
    "tengo un perro",
    "llueve",
    "oye chispa hoy llueveee muxo",
    "tng un perrito",
    "me boy al parke",
    "ola chispa",
]


def main() -> None:
    pairs = json.loads(OUT.read_text(encoding="utf-8"))["pairs"]
    memory = Memory(pairs, load_memory_config())
    cases = []
    for message in MESSAGES:
        best, candidates = memory.lookup(message)
        cases.append(
            {"message": message, "score": round(best, 4), "candidates": sorted(candidates)}
        )
    OUT.write_text(
        json.dumps({"pairs": pairs, "cases": cases}, ensure_ascii=False, indent=1) + "\n",
        encoding="utf-8",
    )
    print(f"wrote {len(cases)} cases to {OUT}")


if __name__ == "__main__":
    main()
