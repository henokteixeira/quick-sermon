import { Sparkles } from "lucide-react";
import { formatTime } from "@/lib/formatters";
import type { Clip, ClipStatus } from "@/lib/types/clip";

interface ClipsMapProps {
  clips: Clip[];
  videoDuration: number;
  currentTime?: number;
}

const ACTIVE_STATES: ClipStatus[] = [
  "pending",
  "downloading",
  "trimming",
  "uploading",
];

function colorForStatus(status: ClipStatus): string {
  if (status === "published") return "#34d399"; // ok
  if (status === "awaiting_review") return "#fbbf24"; // amber-bright
  if (status === "ready") return "#f59e0b"; // amber
  if (ACTIVE_STATES.includes(status)) return "#f59e0b";
  return "#78716c"; // fg-faint (discarded, error)
}

// Deterministic waveform bars (seeded by Math.sin for visual consistency)
function waveformBars(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const n =
      Math.sin(i * 0.5) * 0.3 +
      Math.sin(i * 1.7) * 0.25 +
      Math.cos(i * 0.3) * 0.35 +
      0.5;
    return Math.max(0.15, Math.min(1, n));
  });
}

export function ClipsMap({
  clips,
  videoDuration,
  currentTime = 0,
}: ClipsMapProps) {
  const bars = waveformBars(120);
  const safeDuration = Math.max(videoDuration, 1);
  const playheadPct = Math.max(
    0,
    Math.min(100, (currentTime / safeDuration) * 100),
  );

  return (
    <div className="rounded-xl border border-qs-line bg-qs-bg-elev p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-qs-amber-bright" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[1px] text-qs-fg-subtle">
            Mapa de clipes
          </span>
        </div>
        <span className="font-mono text-[10px] text-qs-fg-faint">
          00:00 — {formatTime(videoDuration)}
        </span>
      </div>

      <div className="rounded-md border border-qs-line bg-qs-bg-elev-2 p-2.5">
        <div className="relative h-12">
          {/* Waveform base */}
          <div className="absolute inset-0 flex items-center gap-[1.5px]">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-[1px] bg-qs-fg-ghost opacity-50"
                style={{ height: `${h * 100}%`, minHeight: 2 }}
              />
            ))}
          </div>

          {/* Markers per clip */}
          {clips.map((clip) => {
            const color = colorForStatus(clip.status);
            const startPct = (clip.start_time / safeDuration) * 100;
            const widthPct = Math.max(
              0.5,
              ((clip.end_time - clip.start_time) / safeDuration) * 100,
            );
            const op = clip.status === "discarded" ? 0.25 : 0.9;
            return (
              <div
                key={clip.id}
                className="absolute inset-y-0 rounded-[2px]"
                style={{
                  left: `${startPct}%`,
                  width: `${widthPct}%`,
                  background: color,
                  opacity: op * 0.25,
                  borderLeft: `1.5px solid ${color}`,
                  borderRight: `1.5px solid ${color}`,
                }}
                title={`${formatTime(clip.start_time)} → ${formatTime(clip.end_time)}`}
              />
            );
          })}

          {/* Playhead */}
          {videoDuration > 0 && (
            <div
              className="absolute w-[2px] bg-qs-amber"
              style={{
                top: -4,
                bottom: -4,
                left: `${playheadPct}%`,
              }}
            >
              <div
                className="absolute rounded-full bg-qs-amber"
                style={{ top: -3, left: -3, width: 8, height: 8 }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2.5 flex flex-wrap gap-3.5 text-[10.5px] text-qs-fg-faint">
        <LegendDot color="#34d399" label="Publicado" />
        <LegendDot color="#fbbf24" label="Revisão" />
        <LegendDot color="#f59e0b" label="Pronto / processando" />
        <LegendDot color="#78716c" label="Descartado" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-2 w-2 rounded-[2px]"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}
