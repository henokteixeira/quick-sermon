"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getDetection, retryDetection } from "@/lib/api/detection";
import { Detection } from "@/lib/types/detection";
import { formatTime } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const CONFIDENCE_THRESHOLD = 80;

interface DetectionCardProps {
  videoId: string;
}

export function DetectionCard({ videoId }: DetectionCardProps) {
  const t = useTranslations("videos.detection");
  const queryClient = useQueryClient();

  const { data: detection, isLoading } = useQuery({
    queryKey: ["detection", videoId],
    queryFn: () => getDetection(videoId),
    refetchInterval: (query) =>
      query.state.data?.status === "running" ? 3_000 : false,
  });

  const retryMutation = useMutation({
    mutationFn: () => retryDetection(videoId),
    onSuccess: (next) => {
      queryClient.setQueryData(["detection", videoId], next);
    },
  });

  if (isLoading) {
    return <Skeleton className="h-24 rounded-xl" />;
  }
  if (!detection) {
    return null;
  }

  if (detection.status === "running") {
    return <DetectionRunning label={t("detecting")} />;
  }
  if (detection.status === "skipped") {
    return <DetectionSkipped label={t("skipped")} />;
  }
  if (detection.status === "failed") {
    return (
      <DetectionFailed
        label={t("failed")}
        retryLabel={t("retry")}
        onRetry={() => retryMutation.mutate()}
        isRetrying={retryMutation.isPending}
      />
    );
  }
  return (
    <DetectionCompleted
      videoId={videoId}
      detection={detection}
      labels={{
        detected: t("detected"),
        useSuggested: t("useSuggested"),
        editManually: t("editManually"),
        confidence: t("confidence"),
        confidenceLow: t("confidenceLow"),
        from: t("from"),
        to: t("to"),
      }}
    />
  );
}

function DetectionRunning({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Levaremos alguns minutos para identificar o trecho da pregação.
        </p>
      </div>
    </div>
  );
}

function DetectionSkipped({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function DetectionFailed({
  label,
  retryLabel,
  onRetry,
  isRetrying,
}: {
  label: string;
  retryLabel: string;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-3 flex-wrap">
      <p className="text-sm text-muted-foreground">{label}</p>
      <button
        onClick={onRetry}
        disabled={isRetrying}
        className="h-8 px-3 rounded-lg border border-input text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
      >
        {isRetrying ? "..." : retryLabel}
      </button>
    </div>
  );
}

function DetectionCompleted({
  videoId,
  detection,
  labels,
}: {
  videoId: string;
  detection: Detection;
  labels: Record<string, string>;
}) {
  const start = detection.start_seconds ?? 0;
  const end = detection.end_seconds ?? 0;
  const confidence = detection.confidence ?? 0;
  const lowConfidence = confidence < CONFIDENCE_THRESHOLD;

  const clipUrl = `/videos/${videoId}/clip/new?suggested_start=${start}&suggested_end=${end}`;

  return (
    <div
      className={cn(
        "rounded-xl border p-4 sm:p-5",
        lowConfidence
          ? "border-amber-500/30 bg-amber-500/[0.04]"
          : "border-emerald-500/30 bg-emerald-500/[0.04]"
      )}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={cn(
                "inline-flex items-center justify-center w-6 h-6 rounded-full",
                lowConfidence
                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                  : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
              )}
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {lowConfidence ? (
                  <>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </>
                ) : (
                  <polyline points="20 6 9 17 4 12" />
                )}
              </svg>
            </span>
            <p className="text-sm font-semibold text-foreground">
              {labels.detected}
            </p>
            <span className="text-xs text-muted-foreground tabular-nums">
              {labels.confidence}: {confidence}%
            </span>
          </div>
          <p className="text-sm text-foreground tabular-nums">
            {labels.from}{" "}
            <strong className="font-semibold">{formatTime(start)}</strong>{" "}
            {labels.to}{" "}
            <strong className="font-semibold">{formatTime(end)}</strong>
          </p>
          {lowConfidence && (
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
              {labels.confidenceLow}
            </p>
          )}
        </div>
        <Link
          href={clipUrl}
          className={cn(
            "h-9 px-4 rounded-lg text-xs font-semibold transition-all whitespace-nowrap inline-flex items-center",
            lowConfidence
              ? "border border-input hover:bg-muted text-foreground"
              : "bg-amber-500 text-stone-950 hover:bg-amber-400 shadow-sm shadow-amber-500/20 active:scale-[0.97]"
          )}
        >
          {lowConfidence ? labels.editManually : labels.useSuggested}
        </Link>
      </div>
    </div>
  );
}
