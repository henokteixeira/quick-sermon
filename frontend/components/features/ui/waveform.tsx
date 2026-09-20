import { cn } from "@/lib/utils";

function seededBars(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const n =
      Math.sin(i * 0.3) * 0.2 +
      Math.sin(i * 0.9) * 0.25 +
      Math.cos(i * 0.15) * 0.3 +
      0.55;
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
