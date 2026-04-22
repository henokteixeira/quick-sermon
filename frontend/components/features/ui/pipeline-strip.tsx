import {
  Check,
  ChevronRight,
  Clock,
  Download,
  Scissors,
  Upload,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge, type StatusState } from "./status-badge";

type StageState = "done" | "active" | "pending";
type StageKey = "download" | "trim" | "upload";

interface PipelineStripProps {
  status: StatusState;
  statusLabel: string;
  stages: Record<StageKey, { state: StageState; progress?: number }>;
  etaLabel?: string | null;
  onOpenPipeline?: () => void;
  className?: string;
}

const STAGE_ICON: Record<StageKey, React.ComponentType<{ className?: string }>> = {
  download: Download,
  trim: Scissors,
  upload: Upload,
};

const STAGE_LABEL: Record<StageKey, string> = {
  download: "Download",
  trim: "Corte",
  upload: "Upload",
};

export function PipelineStrip({
  status,
  statusLabel,
  stages,
  etaLabel,
  onOpenPipeline,
  className,
}: PipelineStripProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3.5 rounded-xl border border-qs-line bg-qs-bg-elev px-3.5 py-2.5",
        className,
      )}
    >
      <div className="flex shrink-0 items-center gap-2">
        <Workflow className="h-3.5 w-3.5 text-qs-amber-bright" />
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[1px] text-qs-fg-subtle">
          Pipeline
        </span>
      </div>

      <StatusBadge state={status} label={statusLabel} />

      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {(Object.keys(stages) as StageKey[]).map((key, idx) => (
          <div key={key} className="flex items-center gap-1.5">
            <MicroStage
              Icon={STAGE_ICON[key]}
              label={STAGE_LABEL[key]}
              state={stages[key].state}
              progress={stages[key].progress}
            />
            {idx < 2 && <span className="h-px w-3 shrink-0 bg-qs-line" />}
          </div>
        ))}
      </div>

      {etaLabel && (
        <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-qs-fg-faint">
          <Clock className="h-2.5 w-2.5" />
          ETA{" "}
          <span className="font-mono font-semibold text-qs-fg">{etaLabel}</span>
        </span>
      )}

      {onOpenPipeline && (
        <button
          type="button"
          onClick={onOpenPipeline}
          className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-qs-amber-bright hover:text-qs-amber"
        >
          Ver completo
          <ChevronRight className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
}

function MicroStage({
  Icon,
  label,
  state,
  progress,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  state: StageState;
  progress?: number;
}) {
  const done = state === "done";
  const active = state === "active";

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-2.5 py-[3px]",
        done &&
          "border-[rgba(52,211,153,0.22)] bg-[rgba(52,211,153,0.12)] text-qs-ok",
        active &&
          "border-[rgba(245,158,11,0.25)] bg-[rgba(245,158,11,0.10)] text-qs-amber-bright",
        !done && !active && "border-qs-line text-qs-fg-ghost",
      )}
    >
      <span className="flex h-3.5 w-3.5 items-center justify-center">
        {done ? <Check className="h-2.5 w-2.5" /> : <Icon className="h-2.5 w-2.5" />}
      </span>
      <span
        className={cn(
          "text-[11px]",
          done || active ? "font-semibold" : "font-medium",
        )}
      >
        {label}
      </span>
      {active && progress !== undefined && (
        <span className="font-mono text-[10px] font-bold">{progress}%</span>
      )}
    </div>
  );
}
