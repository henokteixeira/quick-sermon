import { cn } from "@/lib/utils";

function seededBars(count: number, shape: "flat" | "envelope" = "flat") {
  return Array.from({ length: count }, (_, i) => {
    const phase = i / count;
    const envelope =
      shape === "envelope" ? (phase > 0.1 && phase < 0.8 ? 0.8 : 0.3) : 1;
    const n =
      (Math.sin(i * 0.3) * 0.2 +
        Math.sin(i * 0.9) * 0.25 +
        Math.cos(i * 0.15) * 0.3 +
        0.55) *
      envelope;
    return Math.max(0.15, Math.min(1, n));
  });
}

interface WaveformMiniProps {
  bars?: number;
  selection?: [number, number];
  height?: number;
  className?: string;
}

export function WaveformMini({
  bars = 64,
  selection,
  height = 32,
  className,
}: WaveformMiniProps) {
  const values = seededBars(bars);
  return (
    <div
      className={cn("relative flex items-center gap-[1.5px]", className)}
      style={{ height }}
    >
      {values.map((v, i) => {
        const t = i / bars;
        const inSelection =
          selection && t >= selection[0] && t <= selection[1];
        return (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-[1px]",
              inSelection ? "bg-qs-amber opacity-100" : "bg-qs-fg-ghost opacity-50",
            )}
            style={{ height: `${v * 100}%`, minHeight: 2 }}
          />
        );
      })}
    </div>
  );
}

interface WaveformLargeProps {
  bars?: number;
  selection?: [number, number];
  selectionLabels?: [string, string];
  playhead?: number;
  className?: string;
  height?: number;
}

export function WaveformLarge({
  bars = 180,
  selection = [0.13, 0.67],
  selectionLabels,
  playhead,
  className,
  height = 72,
}: WaveformLargeProps) {
  const values = seededBars(bars, "envelope");
  const startPct = selection[0] * 100;
  const endPct = selection[1] * 100;

  return (
    <div
      className={cn("relative py-1.5", className)}
      style={{ height }}
    >
      <div className="absolute inset-0 rounded-md bg-qs-bg-elev-2" />
      <div className="relative flex h-full items-center gap-[1px] px-0.5">
        {values.map((v, i) => {
          const t = (i / bars) * 100;
          const inSel = t >= startPct && t <= endPct;
          return (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-[1px]",
                inSel ? "bg-qs-amber opacity-95" : "bg-qs-fg-ghost opacity-50",
              )}
              style={{ height: `${v * 100}%`, minHeight: 2 }}
            />
          );
        })}
      </div>

      {/* Selection overlay */}
      <div
        className="pointer-events-none absolute rounded border-[1.5px] border-qs-amber"
        style={{
          top: -2,
          bottom: -2,
          left: `${startPct}%`,
          width: `${endPct - startPct}%`,
          background: "rgba(245,158,11,.05)",
          boxShadow: "0 0 0 3px rgba(245,158,11,.08)",
        }}
      />

      {selectionLabels && (
        <>
          <SelectionHandle x={startPct} label={selectionLabels[0]} />
          <SelectionHandle x={endPct} label={selectionLabels[1]} right />
        </>
      )}

      {playhead !== undefined && (
        <div
          className="absolute"
          style={{
            top: -6,
            bottom: -6,
            left: `${playhead * 100}%`,
            width: 2,
            background: "#fbbf24",
            borderRadius: 1,
            boxShadow: "0 0 8px rgba(245,158,11,0.5)",
          }}
        >
          <div
            className="absolute"
            style={{
              top: -6,
              left: -3,
              width: 8,
              height: 8,
              borderRadius: 4,
              background: "#fbbf24",
              boxShadow: "0 0 8px #fbbf24",
            }}
          />
        </div>
      )}
    </div>
  );
}

function SelectionHandle({
  x,
  label,
  right,
}: {
  x: number;
  label: string;
  right?: boolean;
}) {
  return (
    <div
      className="absolute flex flex-col items-center"
      style={{
        top: -8,
        bottom: -8,
        left: `calc(${x}% - 5px)`,
        width: 10,
      }}
    >
      <span
        className="absolute inset-y-0 left-1/2 -translate-x-1/2 rounded-[2px] bg-qs-amber"
        style={{ width: 3 }}
      />
      <span
        className="absolute rounded-[3px] border-[1.5px] border-[#0c0a09] bg-qs-amber"
        style={{ top: -4, width: 10, height: 12 }}
      />
      <span
        className="absolute rounded-[3px] border-[1.5px] border-[#0c0a09] bg-qs-amber"
        style={{ bottom: -4, width: 10, height: 12 }}
      />
      <span
        className="absolute whitespace-nowrap rounded px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#0c0a09]"
        style={{
          top: -26,
          background: "#f59e0b",
          ...(right ? { left: 6 } : { right: 6 }),
        }}
      >
        {label}
      </span>
    </div>
  );
}
