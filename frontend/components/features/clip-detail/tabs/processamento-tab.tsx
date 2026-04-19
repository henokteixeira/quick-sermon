"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { getClipPipeline } from "@/lib/api/clips";
import { ClipPipeline, PipelineStageStatus } from "@/lib/types/clip";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type StageKey = "download" | "trim" | "upload";

interface ProcessamentoTabProps {
  clipId: string;
  onRetryDownload: () => void;
  retryingDownload: boolean;
  onRetryUpload: () => void;
  retryingUpload: boolean;
}

const STAGE_ORDER: StageKey[] = ["download", "trim", "upload"];

export function ProcessamentoTab({
  clipId,
  onRetryDownload,
  retryingDownload,
  onRetryUpload,
  retryingUpload,
}: ProcessamentoTabProps) {
  const t = useTranslations("clips.detail_page.processamento");
  const tErrors = useTranslations("clips.errors");
  const tUploadErrors = useTranslations("clips.uploadErrors");

  const { data: pipeline, isLoading } = useQuery<ClipPipeline>({
    queryKey: ["clip-pipeline", clipId],
    queryFn: () => getClipPipeline(clipId),
    refetchInterval: (query) => {
      const stages = query.state.data;
      if (!stages) return false;
      const anyRunning = STAGE_ORDER.some(
        (key) => stages[key].status === "running"
      );
      return anyRunning ? 2_000 : false;
    },
  });

  const allPending =
    pipeline &&
    STAGE_ORDER.every((key) => pipeline[key].status === "pending");

  return (
    <div className="space-y-4">
      <header>
        <h2 className="font-serif text-xl text-foreground">{t("heading")}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t("subheading")}
        </p>
      </header>

      {isLoading ? (
        <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          {t("status.running")}...
        </div>
      ) : allPending ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-12 text-center">
          <svg
            className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <p className="text-sm text-muted-foreground">{t("emptyState")}</p>
        </div>
      ) : pipeline ? (
        <ol className="relative">
          {STAGE_ORDER.map((key, index) => {
            const stage = pipeline[key];
            const isUploadStage = key === "upload";
            const isDownloadOrTrim = key === "download" || key === "trim";
            const isLast = index === STAGE_ORDER.length - 1;

            let retryCta: React.ReactNode = null;
            if (stage.status === "error" && isDownloadOrTrim) {
              retryCta = (
                <button
                  type="button"
                  onClick={onRetryDownload}
                  disabled={retryingDownload}
                  className="inline-flex h-8 items-center rounded-lg border border-blue-500/30 bg-blue-50 px-3 text-xs font-medium text-blue-700 transition-all duration-200 hover:bg-blue-100 active:scale-[0.98] disabled:opacity-60 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
                >
                  {retryingDownload ? t("retrying") : t("retryDownload")}
                </button>
              );
            }
            if (stage.status === "error" && isUploadStage) {
              retryCta = (
                <button
                  type="button"
                  onClick={onRetryUpload}
                  disabled={retryingUpload}
                  className="inline-flex h-8 items-center rounded-lg border border-red-500/30 bg-red-50 px-3 text-xs font-medium text-red-700 transition-all duration-200 hover:bg-red-100 active:scale-[0.98] disabled:opacity-60 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                >
                  {retryingUpload ? t("retrying") : t("retryUpload")}
                </button>
              );
            }

            const errorText = stage.error_code
              ? isUploadStage
                ? tUploadErrors.has(stage.error_code)
                  ? tUploadErrors(stage.error_code)
                  : stage.error_message || tUploadErrors("unknown")
                : tErrors.has(stage.error_code)
                ? tErrors(stage.error_code)
                : stage.error_message || tErrors("download_failed")
              : null;

            return (
              <li key={key} className="relative flex gap-4 pb-5 last:pb-0">
                {!isLast && (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-5 top-10 bottom-0 w-px",
                      stage.status === "completed"
                        ? "bg-emerald-400/60 dark:bg-emerald-500/40"
                        : "bg-border"
                    )}
                  />
                )}

                <StageBubble
                  status={stage.status}
                  index={index}
                />

                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      {t(`stages.${key}`)}
                    </h3>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        statusTextColor(stage.status)
                      )}
                    >
                      {t(`status.${stage.status}`)}
                    </span>
                  </div>

                  {stage.status === "running" && (
                    <div className="mt-2">
                      {stage.percent !== null && (
                        <div className="flex items-center justify-between text-xs tabular-nums text-muted-foreground">
                          <span className="font-mono font-medium text-foreground">
                            {stage.percent.toFixed(0)}%
                          </span>
                          {stage.speed && (
                            <span className="font-mono">{stage.speed}</span>
                          )}
                        </div>
                      )}
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            stage.percent === null
                              ? "w-full animate-pulse bg-gradient-to-r from-blue-500/40 to-blue-400/40"
                              : "bg-gradient-to-r from-blue-500 to-blue-400"
                          )}
                          style={
                            stage.percent !== null
                              ? { width: `${Math.min(stage.percent, 100)}%` }
                              : undefined
                          }
                        />
                      </div>
                    </div>
                  )}

                  {stage.status === "completed" && stage.completed_at && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("completedAt", {
                        date: formatDate(stage.completed_at),
                      })}
                    </p>
                  )}

                  {stage.status === "error" && errorText && (
                    <div className="mt-2 space-y-2">
                      <p className="rounded-lg border border-red-300/40 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                        {errorText}
                      </p>
                      {retryCta}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      ) : null}
    </div>
  );
}

function StageBubble({
  status,
  index,
}: {
  status: PipelineStageStatus;
  index: number;
}) {
  const classes = bubbleClasses(status);
  return (
    <div
      className={cn(
        "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-200",
        classes
      )}
    >
      {status === "completed" ? (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : status === "error" ? (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ) : status === "running" ? (
        <svg
          className="h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      ) : (
        <span className="tabular-nums">{index + 1}</span>
      )}
    </div>
  );
}

function bubbleClasses(status: PipelineStageStatus) {
  switch (status) {
    case "completed":
      return "border border-emerald-300/60 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300";
    case "running":
      return "border border-blue-300/60 bg-blue-50 text-blue-700 shadow-sm shadow-blue-500/10 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300";
    case "error":
      return "border border-red-300/60 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300";
    default:
      return "border border-dashed border-border bg-muted text-muted-foreground";
  }
}

function statusTextColor(status: PipelineStageStatus) {
  switch (status) {
    case "completed":
      return "text-emerald-600 dark:text-emerald-400";
    case "running":
      return "text-blue-600 dark:text-blue-400";
    case "error":
      return "text-red-600 dark:text-red-400";
    default:
      return "text-muted-foreground";
  }
}
