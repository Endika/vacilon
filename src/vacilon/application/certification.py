import time
from collections.abc import Callable, Collection, Sequence
from pathlib import Path
from typing import Any

from vacilon.application.chat import ResponderFactory
from vacilon.application.ports import CertificationStore
from vacilon.application.sample_generation import Progress, generate_samples
from vacilon.domain.evalset import EvalItem
from vacilon.domain.metrics import Metric, compute_metrics
from vacilon.domain.sample import Sample
from vacilon.domain.verdict import TOLERANCE, Check, evaluate, is_apto, level_verdicts

OpenModel = Callable[[Path], ResponderFactory]
ValLoss = Callable[[Path, Path], float]
RenderReport = Callable[
    [dict[str, Any], Sequence[Check], dict[str, bool], Sequence[Sample], Sequence[Sample] | None],
    str,
]


def metric_values(metrics: dict[str, Metric]) -> dict[str, float]:
    return {key: m.value for key, m in metrics.items()}


class Certifier:
    """Grades a candidate model against the current one and records the verdict."""

    def __init__(
        self,
        store: CertificationStore,
        open_model: OpenModel,
        val_loss: ValLoss,
        render_report: RenderReport,
        *,
        items: Sequence[EvalItem],
        banned: Collection[str],
        vocab: Collection[str],
    ) -> None:
        self.store = store
        self.open_model = open_model
        self.val_loss = val_loss
        self.render_report = render_report
        self.items = items
        self.banned = banned
        self.vocab = vocab

    def certify(
        self,
        *,
        candidate: Path,
        tokenizer: Path,
        version: str | None = None,
        samples: int = 2,
        tolerance: float = TOLERANCE,
        val_data: Path | None = None,
        progress: Progress | None = None,
    ) -> dict[str, Any]:
        started = time.monotonic()
        store = self.store
        current = store.current_version()
        version = version or store.next_version()
        out_dir = store.model_dir(version)
        store.stage(version, candidate, tokenizer)
        store.ensure_card(version, str(candidate))

        mine = self._samples(out_dir, samples, progress)
        same = current == version
        theirs = (
            mine
            if same or current is None
            else self._samples(store.model_dir(current), samples, progress)
        )
        mine_metrics = compute_metrics(self.items, mine, self.banned, self.vocab)
        their_metrics = (
            compute_metrics(self.items, theirs, self.banned, self.vocab) if current else None
        )
        if val_data is not None:
            self._attach_val_loss(mine_metrics, their_metrics, out_dir, val_data, current, same)

        checks = evaluate(mine_metrics, their_metrics, tolerance)
        levels = level_verdicts(checks)
        meta = {
            "version": version,
            "current": current,
            "date": time.strftime("%Y-%m-%d %H:%M"),
            "samples": samples,
            "items": len(self.items),
            "tolerance": tolerance,
            "candidate": str(candidate),
            "seconds": round(time.monotonic() - started, 1),
        }
        apto = is_apto(checks)
        answers = {"candidate": [s.to_dict() for s in mine]}
        if not same:
            answers["current"] = [s.to_dict() for s in theirs]
        result = {
            **meta,
            "apto": apto,
            "levels": levels,
            "checks": [c.to_dict() for c in checks],
            "answers": answers,
        }
        html = self.render_report(meta, checks, levels, mine, theirs)
        store.save_report(version, result, html)
        store.record(version, apto, metric_values(mine_metrics))
        return result

    def _samples(self, model_dir: Path, samples: int, progress: Progress | None) -> list[Sample]:
        return generate_samples(
            self.open_model(model_dir), self.items, samples, self.banned, progress
        )

    def _attach_val_loss(
        self,
        mine: dict[str, Metric],
        theirs: dict[str, Metric] | None,
        out_dir: Path,
        val_data: Path,
        current: str | None,
        same: bool,
    ) -> None:
        """Both models on today's validation set: an older stored value can't be compared."""
        mine["val_loss"] = Metric(self.val_loss(out_dir, val_data))
        if theirs is None or current is None:
            return
        value = (
            mine["val_loss"].value
            if same
            else self.val_loss(self.store.model_dir(current), val_data)
        )
        theirs["val_loss"] = Metric(value)
