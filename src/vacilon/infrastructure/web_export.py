import json
import shutil
from pathlib import Path

import numpy as np
from numpy.typing import NDArray

from vacilon.domain.format import BOT, USER
from vacilon.infrastructure.npz_loader import load_npz
from vacilon.infrastructure.tokenizer import VacilonTokenizer

ALIGN = 4
TOP_LOGITS = 50

FIXTURE_TEXTS = [
    "hola",
    "ola chispa k aces",
    "Hola Chispa, ¿qué tal estás?",
    "¡Qué pasada, mañana vamos al parque!",
    "me llamo Ñoña y tengo 7 años",
    "HOLA CHISPA!!!",
    "hola  chispa   con espacios dobles",
    "  espacios al principio y al final  ",
    "jajaja xD",
    "te quiero mucho 😀❤️",
    "🤖🥚✨",
    "una vez vi un abión muy grande",
    "kiero jugar a las muñekas",
    "ke tal tu dia hoy",
    "cuéntame un chiste, porfa",
    "¿tú eres un robot o un huevo?",
    "<u>hola<b>",
    "<u>hola<b>¡Bip!<eos>",
    "texto con <eos> en medio",
    "é con tilde combinada y ñ",
    "línea uno\nlínea dos\n\nlínea cuatro",
    "tab\tseparado",
    "",
    " ",
    "a",
    "1234567890",
    "precio: 3,50 € (IVA incl.)",
    "https://example.com/a?b=c&d=e",
    "don't stop, it's me",
    "日本語のテキスト",
    "Привет, мир",
]

TEMPLATES = [
    "{} chispa",
    "¿{}?",
    "{}!!",
    "¡{}!",
    "  {}  ",
    "{}, {}",
    "{} 😊",
]

WORDS = [
    "hola",
    "adiós",
    "quiero",
    "jugar",
    "pingüino",
    "cigüeña",
    "Ñandú",
    "MAÑANA",
    "perro",
    "gato",
    "kolores",
    "bisible",
    "hacer",
    "aser",
    "tengo",
    "ambre",
    "dormir",
    "cuántos",
    "años",
    "tienes",
]

SEQUENCE_PROMPTS = [
    "hola",
    "ola chispa k aces",
    "¿cómo te llamas?",
    "cuéntame un chiste",
    "te quiero mucho",
]


def build_fixture_texts() -> list[str]:
    texts = list(FIXTURE_TEXTS)
    i = 0
    while len(texts) < 200:
        template = TEMPLATES[i % len(TEMPLATES)]
        a, b = WORDS[i % len(WORDS)], WORDS[(i * 7 + 3) % len(WORDS)]
        texts.append(template.format(a, b))
        i += 1
    return texts


def _align(buf: bytearray) -> None:
    buf.extend(b"\0" * (-len(buf) % ALIGN))


def _append(buf: bytearray, data: bytes) -> int:
    _align(buf)
    offset = len(buf)
    buf.extend(data)
    return offset


def pack_weights(npz: Path) -> tuple[bytes, list[dict[str, object]], dict[str, object]]:
    buf = bytearray()
    tensors: list[dict[str, object]] = []
    with np.load(npz) as data:
        config = json.loads(bytes(data["config"]).decode("utf-8"))
        for key in data.files:
            if key == "config" or key.endswith(".s"):
                continue
            if key.endswith(".q"):
                name = key[:-2]
                q = np.ascontiguousarray(data[key], dtype=np.int8)
                scale = np.ascontiguousarray(data[name + ".s"].astype(np.float32))
                offset = _append(buf, q.tobytes())
                scale_offset = _append(buf, scale.astype("<f4").tobytes())
                tensors.append(
                    {
                        "name": name,
                        "dtype": "int8",
                        "shape": list(q.shape),
                        "offset": offset,
                        "scale_offset": scale_offset,
                    }
                )
            else:
                value = np.ascontiguousarray(data[key], dtype=np.float32)
                tensors.append(
                    {
                        "name": key,
                        "dtype": "float32",
                        "shape": list(value.shape),
                        "offset": _append(buf, value.astype("<f4").tobytes()),
                    }
                )
    _align(buf)
    return bytes(buf), tensors, config


def write_model_files(npz: Path, tokenizer: Path, out_dir: Path) -> int:
    """Write weights.bin, manifest.json and tokenizer.json; return the total size in bytes."""
    weights, tensors, config = pack_weights(npz)
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "weights.bin").write_bytes(weights)
    manifest = {
        "config": {
            "vocab_size": config["vocab_size"],
            "n_embd": config["n_embd"],
            "n_layer": config["n_layer"],
            "n_head": config["n_head"],
            "block_size": config["block_size"],
            "ln_eps": 1e-5,
        },
        "tensors": tensors,
    }
    (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=1), encoding="utf-8")
    shutil.copyfile(tokenizer, out_dir / "tokenizer.json")
    return sum(p.stat().st_size for p in out_dir.iterdir() if p.is_file())


def tokenizer_fixtures(tokenizer: VacilonTokenizer) -> list[dict[str, object]]:
    return [
        {"text": t, "ids": (ids := tokenizer.encode(t)), "decoded": tokenizer.decode(ids)}
        for t in build_fixture_texts()
    ]


def _top_logits(logits: NDArray[np.float32]) -> dict[str, object]:
    order = np.argsort(-logits)[:TOP_LOGITS]
    return {
        "argmax": int(logits.argmax()),
        "top_indices": [int(i) for i in order],
        "top_values": [float(logits[i]) for i in order],
    }


def logits_fixtures(npz: Path, tokenizer: VacilonTokenizer) -> list[dict[str, object]]:
    model = load_npz(npz)
    out: list[dict[str, object]] = []
    for prompt in SEQUENCE_PROMPTS:
        ids = tokenizer.encode(f"{USER}{prompt}{BOT}")
        last = model.forward(ids)[-1]
        out.append({"ids": ids, **_top_logits(last)})
    return out


def write_fixtures(npz: Path, tokenizer_path: Path, fixtures_dir: Path) -> None:
    tokenizer = VacilonTokenizer.load(tokenizer_path)
    fixtures_dir.mkdir(parents=True, exist_ok=True)
    (fixtures_dir / "tokenizer.json").write_text(
        json.dumps(tokenizer_fixtures(tokenizer), ensure_ascii=False, indent=1), encoding="utf-8"
    )
    (fixtures_dir / "logits.json").write_text(
        json.dumps(logits_fixtures(npz, tokenizer), indent=1), encoding="utf-8"
    )
