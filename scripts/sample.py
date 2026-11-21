import argparse
from pathlib import Path

import torch

from vacilon.infrastructure.torch_generation import load_for_generation, reply

DEFAULT_MESSAGES = [
    "hola, qué tal",
    "me aburro",
    "hoy llego tarde al trabajo",
    "tengo hambre",
    "¿me quieres?",
]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("messages", nargs="*", default=DEFAULT_MESSAGES)
    parser.add_argument("--checkpoint", type=Path, default=Path("models/finetune.pt"))
    parser.add_argument("--tokenizer", type=Path, default=Path("models/tokenizer.json"))
    parser.add_argument("--temperature", type=float, default=0.8)
    parser.add_argument("--top-k", type=int, default=40)
    parser.add_argument("--max-new-tokens", type=int, default=60)
    parser.add_argument("--seed", type=int, default=0)
    args = parser.parse_args()

    torch.manual_seed(args.seed)
    model, tokenizer = load_for_generation(args.checkpoint, args.tokenizer)
    for message in args.messages:
        answer = reply(
            model,
            tokenizer,
            message,
            max_new_tokens=args.max_new_tokens,
            temperature=args.temperature,
            top_k=args.top_k,
        )
        print(f"> {message}\n{answer}\n")


if __name__ == "__main__":
    main()
