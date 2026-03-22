"use client";

import { useTranslations } from "next-intl";
import { VideoStatus } from "@/lib/types/video";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  VideoStatus,
  { dot: string; bg: string; text: string; pulse?: boolean }
> = {
  pending: {
    dot: "bg-amber-500",
    bg: "bg-amber-500/8 border-amber-500/20",
    text: "text-amber-700",
  },
  detecting: {
    dot: "bg-blue-500",
    bg: "bg-blue-500/8 border-blue-500/20",
    text: "text-blue-700",
    pulse: true,
  },
  processing: {
    dot: "bg-blue-500",
    bg: "bg-blue-500/8 border-blue-500/20",
    text: "text-blue-700",
    pulse: true,
  },
  awaiting_review: {
    dot: "bg-violet-500",
    bg: "bg-violet-500/8 border-violet-500/20",
    text: "text-violet-700",
  },
  published: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-500/8 border-emerald-500/20",
    text: "text-emerald-700",
  },
  error: {
    dot: "bg-red-500",
    bg: "bg-red-500/8 border-red-500/20",
    text: "text-red-700",
  },
};

export function VideoStatusBadge({ status }: { status: VideoStatus }) {
  const t = useTranslations("videos.status");
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        config.bg,
        config.text
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {config.pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
              config.dot
            )}
          />
        )}
        <span
          className={cn("relative inline-flex rounded-full h-1.5 w-1.5", config.dot)}
        />
      </span>
      {t(status)}
    </span>
  );
}
