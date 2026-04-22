import { cn } from "@/lib/utils";

export type StatusState =
  | "pending"
  | "detecting"
  | "processing"
  | "downloading"
  | "trimming"
  | "uploading"
  | "review"
  | "awaiting_review"
  | "ready"
  | "published"
  | "completed"
  | "error"
  | "discarded";

const STATE_STYLES: Record<
  StatusState,
  { fg: string; bg: string; border: string; dot: string }
> = {
  pending: {
    fg: "text-qs-fg-subtle",
    bg: "bg-[rgba(168,162,158,0.1)]",
    border: "border-[rgba(168,162,158,0.25)]",
    dot: "bg-qs-fg-faint",
  },
  detecting: {
    fg: "text-[#93c5fd]",
    bg: "bg-[rgba(96,165,250,0.12)]",
    border: "border-[rgba(96,165,250,0.28)]",
    dot: "bg-qs-info",
  },
  processing: {
    fg: "text-qs-amber-bright",
    bg: "bg-[rgba(245,158,11,0.10)]",
    border: "border-[rgba(245,158,11,0.30)]",
    dot: "bg-qs-amber",
  },
  downloading: {
    fg: "text-qs-amber-bright",
    bg: "bg-[rgba(245,158,11,0.10)]",
    border: "border-[rgba(245,158,11,0.30)]",
    dot: "bg-qs-amber",
  },
  trimming: {
    fg: "text-qs-amber-bright",
    bg: "bg-[rgba(245,158,11,0.10)]",
    border: "border-[rgba(245,158,11,0.30)]",
    dot: "bg-qs-amber",
  },
  uploading: {
    fg: "text-qs-amber-bright",
    bg: "bg-[rgba(245,158,11,0.10)]",
    border: "border-[rgba(245,158,11,0.30)]",
    dot: "bg-qs-amber",
  },
  review: {
    fg: "text-[#c4b5fd]",
    bg: "bg-[rgba(167,139,250,0.12)]",
    border: "border-[rgba(167,139,250,0.28)]",
    dot: "bg-qs-purple",
  },
  awaiting_review: {
    fg: "text-[#c4b5fd]",
    bg: "bg-[rgba(167,139,250,0.12)]",
    border: "border-[rgba(167,139,250,0.28)]",
    dot: "bg-qs-purple",
  },
  ready: {
    fg: "text-qs-ok",
    bg: "bg-[rgba(52,211,153,0.12)]",
    border: "border-[rgba(52,211,153,0.28)]",
    dot: "bg-qs-ok",
  },
  published: {
    fg: "text-qs-ok",
    bg: "bg-[rgba(52,211,153,0.12)]",
    border: "border-[rgba(52,211,153,0.28)]",
    dot: "bg-qs-ok",
  },
  completed: {
    fg: "text-qs-ok",
    bg: "bg-[rgba(52,211,153,0.12)]",
    border: "border-[rgba(52,211,153,0.28)]",
    dot: "bg-qs-ok",
  },
  error: {
    fg: "text-qs-danger",
    bg: "bg-[rgba(248,113,113,0.12)]",
    border: "border-[rgba(248,113,113,0.28)]",
    dot: "bg-qs-danger",
  },
  discarded: {
    fg: "text-qs-fg-faint",
    bg: "bg-[rgba(120,113,108,0.15)]",
    border: "border-[rgba(120,113,108,0.30)]",
    dot: "bg-qs-fg-ghost",
  },
};

const ACTIVE_STATES: StatusState[] = [
  "processing",
  "downloading",
  "trimming",
  "uploading",
  "detecting",
];

interface StatusBadgeProps {
  state: StatusState;
  label: string;
  pulse?: boolean;
  className?: string;
}

export function StatusBadge({
  state,
  label,
  pulse,
  className,
}: StatusBadgeProps) {
  const styles = STATE_STYLES[state] ?? STATE_STYLES.pending;
  const isActive = pulse ?? ACTIVE_STATES.includes(state);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-[0.1px]",
        styles.fg,
        styles.bg,
        styles.border,
        className,
      )}
    >
      <span className="relative inline-flex h-1.5 w-1.5">
        {isActive && (
          <span
            className={cn(
              "absolute inset-0 rounded-full opacity-50 animate-qs-ping",
              styles.dot,
            )}
          />
        )}
        <span
          className={cn("relative h-1.5 w-1.5 rounded-full", styles.dot)}
        />
      </span>
      {label}
    </span>
  );
}
