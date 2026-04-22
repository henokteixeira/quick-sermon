import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "./sparkline";

interface MetricTileProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number;
  sparkline?: number[];
  accent?: boolean;
  className?: string;
}

export function MetricTile({
  label,
  value,
  unit,
  trend,
  sparkline,
  accent = false,
  className,
}: MetricTileProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-[18px]",
        accent
          ? "border-[rgba(245,158,11,0.22)] bg-gradient-to-br from-[rgba(245,158,11,0.10)] to-transparent"
          : "border-qs-line bg-qs-bg-elev",
        className,
      )}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-[1px] text-qs-fg-faint">
          {label}
        </div>
        {typeof trend === "number" && (
          <div
            className={cn(
              "flex items-center gap-1 font-mono text-[11px] font-semibold",
              trend >= 0 ? "text-qs-ok" : "text-qs-danger",
            )}
          >
            <TrendingUp className="h-[11px] w-[11px]" />
            {trend > 0 ? "+" : ""}
            {trend}%
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <div className="font-serif text-[32px] leading-none tracking-[-0.8px] text-qs-fg">
          {value}
        </div>
        {unit && (
          <div className="text-[13px] font-medium text-qs-fg-faint">{unit}</div>
        )}
      </div>
      {sparkline && sparkline.length > 0 && (
        <Sparkline values={sparkline} className="mt-2.5" />
      )}
    </div>
  );
}
