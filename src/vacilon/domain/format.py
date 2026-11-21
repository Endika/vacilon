PAD = "<pad>"
USER = "<u>"
BOT = "<b>"
EOS = "<eos>"
SPECIAL_TOKENS = [PAD, USER, BOT, EOS]
MODEL_FILE = "vacilon.npz"
TOKENIZER_FILE = "tokenizer.json"


def format_turn(message: str, reply: str) -> str:
    return f"{USER}{message}{BOT}{reply}{EOS}"


PAD_ID, USER_ID, BOT_ID, EOS_ID = range(len(SPECIAL_TOKENS))
