import html
from collections.abc import Sequence
from typing import Any

from vacilon.domain.sample import Sample
from vacilon.domain.verdict import LEVELS, Check

LEVEL_TITLES = {
    "seguridad": "Seguridad",
    "personaje": "Personaje",
    "regresion": "Regresión",
    "calidad": "Calidad",
}
EXAMPLES = 30
STYLE = """
body{font-family:system-ui,sans-serif;max-width:60rem;margin:1.5rem auto;padding:0 1rem;
color:#222;background:#fffdf8}
h1{margin-bottom:.2rem}h2{margin-top:2rem}
table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:.35rem .5rem;
text-align:left;vertical-align:top}th{background:#f3efe6}
.ok{background:#dff3df}.mal{background:#f8d7d7}
.apto{color:#17692b}.noapto{color:#a11}
.pill{display:inline-block;padding:.1rem .6rem;border-radius:1rem;font-weight:700}
.pill.ok{background:#bfe7bf}.pill.mal{background:#f2b8b8}
details{margin:.8rem 0}summary{cursor:pointer;font-weight:600}
.fail{font-size:.85rem;color:#555;margin:.3rem 0 0 1rem}
td.msg{font-weight:600}
"""


def esc(text: object) -> str:
    return html.escape(str(text))


def fmt(value: float | None, percent: bool) -> str:
    if value is None:
        return "—"
    return (
        f"{value * 100:.1f} %"
        if percent
        else f"{value:g}"
        if value == int(value)
        else f"{value:.3f}"
    )


def verdict_pill(ok: bool) -> str:
    return f'<span class="pill {"ok" if ok else "mal"}">{"APTO" if ok else "NO APTO"}</span>'


def checks_table(checks: Sequence[Check], current: str | None) -> str:
    rows = []
    for c in checks:
        failing = "".join(f"<div>• {esc(f)}</div>" for f in c.failing[:5])
        extra = f'<div class="fail">{failing}</div>' if failing and not c.ok else ""
        rows.append(
            f'<tr class="{"ok" if c.ok else "mal"}"><td>{esc(c.label)}{extra}</td>'
            f"<td>{fmt(c.candidate, c.percent)}</td><td>{fmt(c.current, c.percent)}</td>"
            f"<td>{esc(c.limit)}</td><td>{'sí' if c.ok else 'NO'}</td></tr>"
        )
    head = (
        f"<tr><th>Métrica</th><th>Candidato</th><th>Vigente ({esc(current or '—')})</th>"
        "<th>Umbral</th><th>¿Pasa?</th></tr>"
    )
    return f"<table>{head}{''.join(rows)}</table>"


def levels_section(levels: dict[str, bool]) -> str:
    cells = "".join(
        f"<tr><td>{LEVEL_TITLES[lvl]}</td><td>{verdict_pill(levels[lvl])}</td></tr>"
        for lvl in LEVELS
    )
    return f"<table>{cells}</table>"


def pick_examples(samples: Sequence[Sample], n: int = EXAMPLES) -> list[Sample]:
    first = [s for s in samples if s.index == 0]
    if len(first) <= n:
        return first
    step = len(first) / n
    return [first[int(i * step)] for i in range(n)]


def side_by_side(candidate: Sequence[Sample], current: Sequence[Sample] | None) -> str:
    by_id = {s.item_id: s for s in current or [] if s.index == 0}
    rows = []
    for s in pick_examples(candidate):
        other = by_id.get(s.item_id)
        rows.append(
            f"<tr><td class='msg'>{esc(s.message)}<br><small>{esc(s.category)}</small></td>"
            f"<td>{esc(s.final)}</td><td>{esc(other.final) if other else '—'}</td></tr>"
        )
    head = "<tr><th>Mensaje</th><th>Candidato</th><th>Vigente</th></tr>"
    return f"<table>{head}{''.join(rows)}</table>"


def all_answers(candidate: Sequence[Sample], current: Sequence[Sample] | None) -> str:
    other = {(s.item_id, s.index): s for s in current or []}
    rows = []
    for s in candidate:
        o = other.get((s.item_id, s.index))
        rows.append(
            f"<tr><td>{esc(s.category)}</td><td>{esc(s.message)} <small>#{s.index}</small></td>"
            f"<td>{esc(s.final)}</td><td>{esc(o.final) if o else '—'}</td></tr>"
        )
    head = "<tr><th>Categoría</th><th>Mensaje</th><th>Candidato</th><th>Vigente</th></tr>"
    return (
        f"<details><summary>Todas las respuestas ({len(rows)})</summary>"
        f"<table>{head}{''.join(rows)}</table></details>"
    )


def render_report(
    meta: dict[str, Any],
    checks: Sequence[Check],
    levels: dict[str, bool],
    candidate: Sequence[Sample],
    current: Sequence[Sample] | None,
) -> str:
    apto = all(levels.values())
    cls = "apto" if apto else "noapto"
    subtitle = (
        f"Candidato {esc(meta['version'])} frente a {esc(meta['current'] or 'ningún modelo')} "
        f"· {esc(meta['date'])} · {meta['samples']} muestras por mensaje · "
        f"{meta['items']} mensajes"
    )
    return (
        "<!doctype html><html lang='es'><head><meta charset='utf-8'>"
        "<meta name='viewport' content='width=device-width,initial-scale=1'>"
        f"<title>Certificación {esc(meta['version'])}</title><style>{STYLE}</style></head><body>"
        f"<h1>Certificación de Chispa: "
        f"<span class='{cls}'>{'APTO' if apto else 'NO APTO'}</span></h1>"
        f"<p>{subtitle}</p><h2>Veredicto por nivel</h2>{levels_section(levels)}"
        f"<h2>Métricas</h2>{checks_table(checks, meta['current'])}"
        f"<h2>Respuestas de ejemplo</h2>{side_by_side(candidate, current)}"
        f"{all_answers(candidate, current)}</body></html>"
    )
