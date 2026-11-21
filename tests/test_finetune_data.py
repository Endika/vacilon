import numpy as np
import torch

from vacilon.domain.examples import Example, sample_subs_turn
from vacilon.domain.format import BOT_ID, EOS_ID, PAD_ID, USER_ID
from vacilon.infrastructure.finetune_batches import collate


def test_collate_masks_only_reply_tokens() -> None:
    short = Example([USER_ID, 10, 11, BOT_ID, 20, EOS_ID], bot_pos=3)
    long = Example([USER_ID, 10, BOT_ID, 20, 21, 22, EOS_ID], bot_pos=2)
    x, y, mask = collate([short, long], torch.device("cpu"))
    assert x.shape == y.shape == mask.shape == (2, 6)
    assert y[0][mask[0]].tolist() == [20, EOS_ID]
    assert y[1][mask[1]].tolist() == [20, 21, 22, EOS_ID]
    assert y[0, -1] == PAD_ID and not mask[0, -1]


def test_sample_subs_turn_returns_a_whole_turn() -> None:
    turn = [USER_ID, 10, 11, BOT_ID, 20, EOS_ID]
    tokens = np.array((turn + [7] * 3) * 400, dtype=np.uint16)
    found = sample_subs_turn(tokens, np.random.default_rng(0), 16)
    assert found is not None
    assert found.ids[0] == USER_ID and found.ids[-1] == EOS_ID
    assert found.ids[found.bot_pos] == BOT_ID
