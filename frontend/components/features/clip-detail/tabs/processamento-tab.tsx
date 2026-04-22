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
        <h2 className="font-serif text-[20px] leading-tight text-qs-fg">
          {t("heading")}
        </h2>
        <p className="mt-0.5 text-[12px] text-qs-fg-subtle">{t("subheading")}</p>
      </header>

      {isLoading ? (
        <div className="rounded-xl border border-qs-line bg-qs-bg-elev px-4 py-8 text-center text-[13px] text-qs-fg-subtle">
          {t("status.running")}...
        </div>
      ) : allPending ? (
        <div className="rounded-xl border border-dashed border-qs-line bg-qs-bg-elev px-4 py-12 text-center">
          <svg
            className="mx-auto mb-3 h-8 w-8 text-qs-fg-ghost"
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
          <p className="text-[13px] text-qs-fg-subtle">{t("emptyState")}</p>
        </div>
      ) : pipeline ? (
        <ol className="relative rounded-xl border border-qs-line bg-qs-bg-elev p-5">
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
                  className="inline-flex h-8 items-center rounded-lg border border-[rgba(96,165,250,0.3)] bg-[rgba(96,165,250,0.10)] px-3 text-[11px] font-medium text-qs-info transition-colors hover:bg-[rgba(96,165,250,0.18)] disabled:opacity-60"
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
                  className="inline-flex h-8 items-center rounded-lg border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.10)] px-3 text-[11px] font-medium text-qs-danger transition-colors hover:bg-[rgba(248,113,113,0.18)] disabled:opacity-60"
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
                        ? "bg-[rgba(52,211,153,0.4)]"
                        : "bg-qs-line",
                    )}
                  />
                )}

                <StageBubble
                  status={stage.status}
                  index={index}
                />

                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-[13px] font-semibold text-qs-fg">
                      {t(`stages.${key}`)}
                    </h3>
                    <span
                      className={cn(
                        "font-mono text-[11px] font-medium",
                        statusTextColor(stage.status),
                      )}
                    >
                      {t(`status.${stage.status}`)}
                    </span>
                  </div>

                  {stage.status === "running" && (
                    <div className="mt-2">
                      {stage.percent !== null && (
                        <div className="flex items-center justify-between font-mono text-[11px] tabular-nums text-qs-fg-faint">
                          <span className="font-medium text-qs-fg-muted">
                            {stage.percent.toFixed(0)}%
                          </span>
                          {stage.speed && <span>{stage.speed}</span>}
                        </div>
                      )}
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-qs-bg-elev-2">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            stage.percent === null
                              ? "w-full animate-pulse bg-qs-amber/40"
                              : "bg-qs-amber",
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
                    <p className="mt-1 font-mono text-[11px] text-qs-fg-faint">
                      {t("completedAt", {
                        date: formatDate(stage.completed_at),
                      })}
                    </p>
                  )}

                  {stage.status === "error" && errorText && (
                    <div className="mt-2 space-y-2">
                      <p className="rounded-lg border border-[rgba(248,113,113,0.28)] bg-[rgba(248,113,113,0.10)] px-3 py-2 text-[11px] text-qs-danger">
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
      return "border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.12)] text-qs-ok";
    case "running":
      return "border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.10)] text-qs-amber-bright";
    case "error":
      return "border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.10)] text-qs-danger";
    default:
      return "border border-dashed border-qs-line bg-qs-bg-elev-2 text-qs-fg-faint";
  }
}

function statusTextColor(status: PipelineStageStatus) {
  switch (status) {
    case "completed":
      return "text-qs-ok";
    case "running":
      return "text-qs-amber-bright";
    case "error":
      return "text-qs-danger";
    default:
      return "text-qs-fg-faint";
  }
}
