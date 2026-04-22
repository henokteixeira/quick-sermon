import { cn } from "@/lib/utils";

interface AmberGlowProps {
  size?: number;
  opacity?: number;
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
  color?: "amber" | "deep";
  className?: string;
}

export function AmberGlow({
  size = 400,
  opacity = 0.08,
  top,
  left,
  right,
  bottom,
  color = "amber",
  className,
}: AmberGlowProps) {
  const bg =
    color === "deep"
      ? `rgba(180,83,9,${opacity})`
      : `rgba(245,158,11,${opacity})`;
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute z-0 rounded-full", className)}
      style={{
        top,
        left,
        right,
        bottom,
        width: size,
        height: size,
        background: bg,
        filter: `blur(${Math.round(size / 3.5)}px)`,
      }}
    />
  );
}
