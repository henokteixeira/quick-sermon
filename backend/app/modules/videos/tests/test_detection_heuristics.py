from app.modules.videos.services.detection_heuristics import (
    combine_confidence,
    compute_confidence_from_captions,
    compute_confidence_from_chapters,
    is_plausible_sermon_duration,
)


class TestPlausibleDuration:
    def test_under_15min_is_implausible(self):
        assert not is_plausible_sermon_duration(0, 800)

    def test_within_window_is_plausible(self):
        assert is_plausible_sermon_duration(600, 600 + 30 * 60)

    def test_over_75min_is_implausible(self):
        assert not is_plausible_sermon_duration(0, 80 * 60)


class TestChaptersHeuristic:
    def test_empty_returns_zero(self):
        assert compute_confidence_from_chapters([]) == (None, None, 0)

    def test_no_keyword_returns_zero(self):
        chapters = [
            {"title": "Abertura", "start_time": 0, "end_time": 300},
            {"title": "Louvor", "start_time": 300, "end_time": 1200},
            {"title": "Encerramento", "start_time": 1200, "end_time": 1500},
        ]
        assert compute_confidence_from_chapters(chapters) == (None, None, 0)

    def test_pregacao_keyword_returns_high_confidence(self):
        chapters = [
            {"title": "Abertura", "start_time": 0, "end_time": 600},
            {"title": "Pregação - Pr Joao", "start_time": 600, "end_time": 600 + 35 * 60},
            {"title": "Avisos", "start_time": 600 + 35 * 60, "end_time": 9000},
        ]
        start, end, conf = compute_confidence_from_chapters(chapters)
        assert (start, end) == (600, 600 + 35 * 60)
        assert conf >= 90

    def test_picks_longest_when_multiple_candidates(self):
        chapters = [
            {"title": "Mensagem inicial", "start_time": 0, "end_time": 900},
            {"title": "Pregação principal", "start_time": 1000, "end_time": 1000 + 40 * 60},
        ]
        start, end, conf = compute_confidence_from_chapters(chapters)
        assert start == 1000
        assert end == 1000 + 40 * 60
        assert conf >= 90

    def test_implausible_duration_returns_zero(self):
        chapters = [{"title": "Pregação rápida", "start_time": 0, "end_time": 300}]
        assert compute_confidence_from_chapters(chapters) == (None, None, 0)


class TestCaptionsHeuristic:
    def _build_dense_cues(self, start: float, end: float, gap: float = 2.0):
        cues = []
        t = start
        while t < end:
            cues.append({"start": t, "end": t + gap, "text": "lorem"})
            t += gap
        return cues

    def test_empty_returns_zero(self):
        assert compute_confidence_from_captions([], 7200) == (None, None, 0)

    def test_long_dense_block_within_window(self):
        cues = self._build_dense_cues(600, 600 + 30 * 60)
        start, end, conf = compute_confidence_from_captions(cues, 7200)
        assert start == 600
        assert end == 600 + 30 * 60
        assert conf > 0

    def test_short_block_returns_zero(self):
        cues = self._build_dense_cues(0, 300)
        assert compute_confidence_from_captions(cues, 7200) == (None, None, 0)


class TestCaptionsHybrid:
    def _build_dense_cues(self, start: float, end: float, gap: float = 2.0):
        cues = []
        t = start
        while t < end:
            cues.append({"start": t, "end": t + gap, "text": "lorem"})
            t += gap
        return cues

    def test_gap_5_finds_block(self):
        # Contínuo com gaps de até 3s: gap=5 já é suficiente
        cues = self._build_dense_cues(600, 600 + 30 * 60, gap=3.0)
        start, end, conf = compute_confidence_from_captions(cues, 7200)
        assert start == 600
        assert end == 600 + 30 * 60
        assert conf > 0

    def test_falls_back_to_gap_10_when_5_fragments(self):
        # Cues com gap de 7s entre cada um: gap=5 parte em vários blocos pequenos,
        # gap=10 une tudo num bloco plausível
        cues = []
        t = 600
        while t < 600 + 30 * 60:
            cues.append({"start": t, "end": t + 2, "text": "lorem"})
            t += 9  # 2s cue + 7s gap
        start, end, conf = compute_confidence_from_captions(cues, 7200)
        assert start == 600
        assert end is not None and end >= 600 + 15 * 60
        assert conf > 0

    def test_no_plausible_block_returns_zero(self):
        # Cues curtos e espalhados - nenhum gap forma bloco plausível
        cues = [
            {"start": 0, "end": 2, "text": "a"},
            {"start": 1000, "end": 1002, "text": "b"},
            {"start": 2000, "end": 2002, "text": "c"},
        ]
        assert compute_confidence_from_captions(cues, 7200) == (None, None, 0)


class TestCombineConfidence:
    def test_all_zero_returns_cascade(self):
        result = combine_confidence(
            chapters=(None, None, 0),
            captions=(None, None, 0),
        )
        assert result == (None, None, 0, "cascade")

    def test_only_chapters_wins(self):
        result = combine_confidence(
            chapters=(600, 2400, 92),
            captions=(None, None, 0),
        )
        assert result == (600, 2400, 92, "chapters")

    def test_agreement_bonus_applied(self):
        result = combine_confidence(
            chapters=(600, 2400, 92),
            captions=(610, 2410, 70),
        )
        start, end, conf, method = result
        assert method == "chapters"
        assert conf == 97
        assert (start, end) == (600, 2400)

    def test_disagreement_no_bonus(self):
        result = combine_confidence(
            chapters=(600, 2400, 92),
            captions=(4000, 6000, 60),
        )
        start, end, conf, method = result
        assert (start, end) == (600, 2400)
        assert conf == 92

    def test_captions_wins_when_no_chapters(self):
        result = combine_confidence(
            chapters=(None, None, 0),
            captions=(600, 2400, 75),
        )
        start, end, conf, method = result
        assert method == "captions"
        assert (start, end) == (600, 2400)
        assert conf == 75
