import unicodedata
from typing import Any

from app.core.config import settings

SERMON_KEYWORDS = (
    "pregacao",
    "mensagem",
    "palavra de deus",
    "sermao",
    "ministracao",
    "estudo biblico",
)

PhaseResult = tuple[int | None, int | None, int]


def _normalize(text: str) -> str:
    nfkd = unicodedata.normalize("NFKD", text or "")
    return "".join(c for c in nfkd if not unicodedata.combining(c)).lower()


def is_plausible_sermon_duration(start: float, end: float) -> bool:
    duration = end - start
    return settings.SERMON_MIN_DURATION <= duration <= settings.SERMON_MAX_DURATION


def compute_confidence_from_chapters(chapters: list[dict[str, Any]]) -> PhaseResult:
    if not chapters:
        return None, None, 0
    candidates = [
        c
        for c in chapters
        if any(_normalize(k) in _normalize(c.get("title", "")) for k in SERMON_KEYWORDS)
    ]
    if not candidates:
        return None, None, 0
    best = max(candidates, key=lambda c: c.get("end_time", 0) - c.get("start_time", 0))
    start = int(best.get("start_time", 0))
    end = int(best.get("end_time", 0))
    if not is_plausible_sermon_duration(start, end):
        return None, None, 0
    return start, end, 92


def _largest_block(
    spans: list[tuple[float, float]], gap_tolerance: float
) -> tuple[float, float] | None:
    if not spans:
        return None
    blocks: list[tuple[float, float]] = []
    current_start, last_end = spans[0]
    for span_start, span_end in spans[1:]:
        if span_start - last_end <= gap_tolerance:
            last_end = max(last_end, span_end)
        else:
            blocks.append((current_start, last_end))
            current_start, last_end = span_start, span_end
    blocks.append((current_start, last_end))
    return max(blocks, key=lambda b: b[1] - b[0])


def compute_confidence_from_captions(
    cues: list[dict[str, Any]],
    total_duration: int,
) -> PhaseResult:
    if not cues:
        return None, None, 0
    spans = [(c["start"], c["end"]) for c in cues]
    for gap in (5.0, 10.0):
        block = _largest_block(spans, gap_tolerance=gap)
        if block is None or not is_plausible_sermon_duration(block[0], block[1]):
            continue
        duration_min = max(1.0, (block[1] - block[0]) / 60.0)
        cues_inside = sum(1 for c in cues if block[0] <= c["start"] <= block[1])
        density = cues_inside / duration_min
        confidence = max(40, min(82, int(40 + density * 4)))
        return int(block[0]), int(block[1]), confidence
    return None, None, 0


def _ranges_agree(
    a: PhaseResult, b: PhaseResult, tolerance_seconds: int = 120
) -> bool:
    if a[0] is None or b[0] is None:
        return False
    return abs(a[0] - b[0]) <= tolerance_seconds and abs(a[1] - b[1]) <= tolerance_seconds


def combine_confidence(
    **phase_results: PhaseResult,
) -> tuple[int | None, int | None, int, str]:
    valid = [
        (method, result) for method, result in phase_results.items() if result[0] is not None
    ]
    if not valid:
        return None, None, 0, "cascade"
    best_method, best = max(valid, key=lambda item: item[1][2])
    agreements = sum(
        1 for method, result in valid if method != best_method and _ranges_agree(best, result)
    )
    bonus = min(15, agreements * 5)
    final_conf = min(99, best[2] + bonus)
    return best[0], best[1], final_conf, best_method
