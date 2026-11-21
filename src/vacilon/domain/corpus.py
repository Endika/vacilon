from collections.abc import Mapping
from dataclasses import dataclass, field

MESSAGE_MIN_CHARS = 1
MESSAGE_MAX_CHARS = 200
REPLY_MIN_CHARS = 2
REPLY_MAX_CHARS = 200
MIN_PAIRS_PER_TOPIC = 60


@dataclass(frozen=True)
class Pair:
    topic: str
    line_no: int
    message: str
    reply: str

    @property
    def where(self) -> str:
        return f"{self.topic}:{self.line_no}"


@dataclass
class CorpusReport:
    counts: dict[str, int] = field(default_factory=dict)
    errors: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.errors


def normalize(text: str) -> str:
    return " ".join(text.lower().split())


def parse_topic(topic: str, text: str) -> tuple[list[Pair], list[str]]:
    pairs: list[Pair] = []
    errors: list[str] = []
    for line_no, line in enumerate(text.splitlines(), start=1):
        fields = line.split("\t")
        if len(fields) != 2:
            errors.append(f"{topic}:{line_no}: expected 2 fields, got {len(fields)}")
            continue
        pairs.append(Pair(topic, line_no, fields[0], fields[1]))
    return pairs, errors


def check_pair(pair: Pair) -> list[str]:
    errors: list[str] = []
    if not MESSAGE_MIN_CHARS <= len(pair.message) <= MESSAGE_MAX_CHARS:
        errors.append(f"{pair.where}: message length {len(pair.message)} out of range")
    if not REPLY_MIN_CHARS <= len(pair.reply) <= REPLY_MAX_CHARS:
        errors.append(f"{pair.where}: reply length {len(pair.reply)} out of range")
    if normalize(pair.message) == normalize(pair.reply):
        errors.append(f"{pair.where}: reply repeats the message")
    return errors


def check_duplicates(pairs: list[Pair]) -> list[str]:
    errors: list[str] = []
    seen_pairs: dict[tuple[str, str], Pair] = {}
    seen_replies: dict[str, Pair] = {}
    for pair in pairs:
        reply_key = normalize(pair.reply)
        pair_key = (normalize(pair.message), reply_key)
        if pair_key in seen_pairs:
            errors.append(f"{pair.where}: duplicate pair (first at {seen_pairs[pair_key].where})")
        elif reply_key in seen_replies:
            errors.append(
                f"{pair.where}: duplicate reply (first at {seen_replies[reply_key].where})"
            )
        seen_pairs.setdefault(pair_key, pair)
        seen_replies.setdefault(reply_key, pair)
    return errors


def validate_corpus(corpus: Mapping[str, str]) -> CorpusReport:
    report = CorpusReport()
    if not corpus:
        report.errors.append("no topics found")
        return report
    all_pairs: list[Pair] = []
    for topic in sorted(corpus):
        pairs, errors = parse_topic(topic, corpus[topic])
        report.errors.extend(errors)
        report.counts[topic] = len(pairs)
        if len(pairs) < MIN_PAIRS_PER_TOPIC:
            report.errors.append(
                f"{topic}: {len(pairs)} pairs, at least {MIN_PAIRS_PER_TOPIC} required"
            )
        for pair in pairs:
            report.errors.extend(check_pair(pair))
        all_pairs.extend(pairs)
    report.errors.extend(check_duplicates(all_pairs))
    return report
