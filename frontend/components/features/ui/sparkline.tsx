import { cn } from "@/lib/utils";

interface SparklineProps {
  values: number[];
  className?: string;
  color?: string;
  height?: number;
}

export function Sparkline({
  values,
  className,
  color = "#f59e0b",
  height = 28,
}: SparklineProps) {
  if (values.length === 0) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = 100 / Math.max(values.length - 1, 1);

  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const path = `M ${points.join(" L ")}`;
  const areaPath = `${path} L 100,${height} L 0,${height} Z`;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      className={cn("block", className)}
    >
      <path d={areaPath} fill={color} opacity="0.08" />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </svg>
  );
}
