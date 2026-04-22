import { Check, Loader2, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type StageState = "done" | "active" | "pending" | "error";

interface PipelineStageProps {
  label: string;
  state: StageState;
  progress?: number;
  detail?: string;
  className?: string;
}

const STATE_ICON = {
  done: Check,
  active: Loader2,
  pending: Minus,
  error: Minus,
};

const STATE_STYLES: Record<StageState, string> = {
  done: "text-qs-ok bg-[rgba(52,211,153,0.12)] border-[rgba(52,211,153,0.28)]",
  active:
    "text-qs-amber-bright bg-[rgba(245,158,11,0.10)] border-[rgba(245,158,11,0.30)]",
  pending: "text-qs-fg-ghost bg-qs-bg-elev-2 border-qs-line",
  error: "text-qs-danger bg-[rgba(248,113,113,0.12)] border-[rgba(248,113,113,0.28)]",
};

export function PipelineStage({
  label,
  state,
  progress,
  detail,
  className,
}: PipelineStageProps) {
  const Icon = STATE_ICON[state];
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-qs-line bg-qs-bg-elev p-3",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
          STATE_STYLES[state],
        )}
      >
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            state === "active" && "animate-spin",
          )}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-qs-fg-muted">
            {label}
          </span>
          {typeof progress === "number" && (
            <span className="font-mono text-[11px] text-qs-fg-faint">
              {Math.round(progress)}%
            </span>
          )}
        </div>
        {typeof progress === "number" && (
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-qs-bg-elev-2">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                state === "done"
                  ? "bg-qs-ok"
                  : state === "error"
                    ? "bg-qs-danger"
                    : "bg-qs-amber",
              )}
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
        )}
        {detail && (
          <div className="mt-1 font-mono text-[10.5px] text-qs-fg-faint">
            {detail}
          </div>
        )}
      </div>
    </div>
  );
}
