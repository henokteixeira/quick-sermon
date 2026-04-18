"use client";

import { useTranslations } from "next-intl";
import { ClipStatus } from "@/lib/types/clip";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  ClipStatus,
  { dot: string; bg: string; text: string; pulse?: boolean }
> = {
  pending: {
    dot: "bg-amber-500",
    bg: "bg-amber-500/10 border-amber-500/20",
    text: "text-amber-700 dark:text-amber-400",
  },
  downloading: {
    dot: "bg-blue-500",
    bg: "bg-blue-500/10 border-blue-500/20",
    text: "text-blue-700 dark:text-blue-400",
    pulse: true,
  },
  trimming: {
    dot: "bg-indigo-500",
    bg: "bg-indigo-500/10 border-indigo-500/20",
    text: "text-indigo-700 dark:text-indigo-400",
    pulse: true,
  },
  ready: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  uploading: {
    dot: "bg-cyan-500",
    bg: "bg-cyan-500/10 border-cyan-500/20",
    text: "text-cyan-700 dark:text-cyan-400",
    pulse: true,
  },
  awaiting_review: {
    dot: "bg-purple-500",
    bg: "bg-purple-500/10 border-purple-500/20",
    text: "text-purple-700 dark:text-purple-400",
  },
  published: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  discarded: {
    dot: "bg-stone-400",
    bg: "bg-stone-500/10 border-stone-500/20",
    text: "text-stone-600 dark:text-stone-400",
  },
  error: {
    dot: "bg-red-500",
    bg: "bg-red-500/10 border-red-500/20",
    text: "text-red-700 dark:text-red-400",
  },
};

export function ClipStatusBadge({ status }: { status: ClipStatus }) {
  const t = useTranslations("clips.status");
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border",
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
          className={cn(
            "relative inline-flex rounded-full h-1.5 w-1.5",
            config.dot
          )}
        />
      </span>
      {t(status)}
    </span>
  );
}
