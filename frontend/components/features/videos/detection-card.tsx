"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { getDetection, retryDetection } from "@/lib/api/detection";
import { Detection } from "@/lib/types/detection";
import { formatTime } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { WaveformMini } from "@/components/features/ui/waveform";

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
    return <Skeleton className="h-[220px] rounded-xl" />;
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
    <div className="flex h-full min-h-[160px] flex-col justify-between rounded-xl border border-qs-line bg-qs-bg-elev p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(245,158,11,0.10)] text-qs-amber">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-qs-fg">{label}</p>
          <p className="mt-1 text-[11.5px] text-qs-fg-subtle">
            Levaremos alguns minutos para identificar o trecho da pregação.
          </p>
        </div>
      </div>
      <WaveformMini className="mt-4 opacity-60" />
    </div>
  );
}

function DetectionSkipped({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-[160px] items-center justify-center rounded-xl border border-qs-line bg-qs-bg-elev p-5">
      <p className="text-[13px] text-qs-fg-subtle">{label}</p>
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
    <div className="flex h-full min-h-[160px] flex-col justify-between rounded-xl border border-qs-line bg-qs-bg-elev p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(248,113,113,0.12)] text-qs-danger">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <p className="text-[13px] text-qs-fg-muted">{label}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="mt-3 inline-flex h-9 w-fit items-center gap-1.5 self-start rounded-lg border border-qs-line bg-transparent px-3 text-[12px] font-medium text-qs-fg-muted transition-colors hover:border-qs-line-strong disabled:opacity-50"
      >
        <RefreshCw className={cn("h-3.5 w-3.5", isRetrying && "animate-spin")} />
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
        "flex h-full min-h-[160px] flex-col justify-between rounded-xl border p-5",
        lowConfidence
          ? "border-[rgba(245,158,11,0.28)] bg-[rgba(245,158,11,0.06)]"
          : "border-qs-line bg-qs-bg-elev",
      )}
    >
      <div>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(196,181,253,0.15)] text-qs-purple">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <p className="text-[13px] font-semibold text-qs-fg">
            {labels.detected}
          </p>
          <span
            className={cn(
              "ml-auto inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10.5px]",
              lowConfidence
                ? "border-[rgba(245,158,11,0.28)] bg-[rgba(245,158,11,0.08)] text-qs-amber-bright"
                : "border-[rgba(52,211,153,0.28)] bg-[rgba(52,211,153,0.12)] text-qs-ok",
            )}
          >
            <Check className="h-2.5 w-2.5" />
            {confidence}% {labels.confidence.toLowerCase()}
          </span>
        </div>
        <p className="mt-3 font-mono text-[12px] text-qs-fg-muted">
          {labels.from}{" "}
          <span className="text-qs-fg">{formatTime(start)}</span>{" "}
          {labels.to} <span className="text-qs-fg">{formatTime(end)}</span>
        </p>
        {lowConfidence && (
          <p className="mt-2 text-[11px] text-qs-amber-bright">
            {labels.confidenceLow}
          </p>
        )}
      </div>

      <WaveformMini
        className="mt-4"
        selection={[Math.min(0.1, start / Math.max(end, 1)), 0.85]}
      />

      <Link
        href={clipUrl}
        className={cn(
          "mt-4 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold transition-colors",
          lowConfidence
            ? "border border-qs-line bg-transparent text-qs-fg-muted hover:border-qs-line-strong"
            : "bg-qs-amber text-[#0c0a09] shadow-[0_4px_14px_rgba(245,158,11,0.25)] hover:bg-qs-amber-bright",
        )}
      >
        {lowConfidence ? labels.editManually : labels.useSuggested}
      </Link>
    </div>
  );
}
