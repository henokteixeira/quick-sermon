import asyncio
import json
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass
class CaptionCue:
    start: float
    end: float
    text: str


VTT_TIMESTAMP = re.compile(
    r"(\d{2}):(\d{2}):(\d{2})[\.,](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[\.,](\d{3})"
)


def _vtt_time_to_seconds(h: str, m: str, s: str, ms: str) -> float:
    return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000.0


def parse_vtt(content: str) -> list[CaptionCue]:
    cues: list[CaptionCue] = []
    blocks = re.split(r"\n\s*\n+", content.strip())
    for block in blocks:
        m = VTT_TIMESTAMP.search(block)
        if not m:
            continue
        start = _vtt_time_to_seconds(m.group(1), m.group(2), m.group(3), m.group(4))
        end = _vtt_time_to_seconds(m.group(5), m.group(6), m.group(7), m.group(8))
        text_lines = [
            line.strip()
            for line in block.split("\n")
            if "-->" not in line and line.strip() and not line.strip().isdigit()
        ]
        text = " ".join(text_lines).strip()
        if text:
            cues.append(CaptionCue(start=start, end=end, text=text))
    return cues


class CaptionsFetcher:
    async def fetch_pt_captions(self, source_url: str, output_dir: str) -> list[CaptionCue]:
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        output_template = os.path.join(output_dir, "captions.%(ext)s")
        proc = await asyncio.create_subprocess_exec(
            "yt-dlp",
            "--write-auto-sub",
            "--write-sub",
            "--sub-lang",
            "pt,pt-BR,pt-orig",
            "--sub-format",
            "vtt",
            "--skip-download",
            "--no-warnings",
            "--output",
            output_template,
            source_url,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        await proc.communicate()
        for vtt_file in sorted(Path(output_dir).glob("captions*.vtt")):
            return parse_vtt(vtt_file.read_text(encoding="utf-8"))
        return []


class ChaptersFetcher:
    async def fetch(self, source_url: str) -> dict[str, Any]:
        proc = await asyncio.create_subprocess_exec(
            "yt-dlp",
            "--dump-json",
            "--skip-download",
            "--no-warnings",
            source_url,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, _ = await proc.communicate()
        if not stdout:
            return {"chapters": [], "duration": 0, "is_live": False}
        try:
            data = json.loads(stdout.decode("utf-8"))
        except json.JSONDecodeError:
            return {"chapters": [], "duration": 0, "is_live": False}
        return {
            "chapters": data.get("chapters") or [],
            "duration": int(data.get("duration") or 0),
            "is_live": bool(data.get("is_live") or data.get("live_status") == "is_live"),
        }
