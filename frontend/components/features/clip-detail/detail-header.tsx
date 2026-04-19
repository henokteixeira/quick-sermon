"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { getClipYouTubeStats } from "@/lib/api/clips";
import { Clip, ClipReviewData } from "@/lib/types/clip";
import { ClipStatusBadge } from "@/components/features/clips/clip-status-badge";
import { formatTime, formatDate, formatViews } from "@/lib/formatters";

interface DetailHeaderProps {
  clip: Clip;
  review: ClipReviewData | undefined;
  isAdmin: boolean;
  onSendForReview: () => void;
  sendingForReview: boolean;
  onPublish: () => void;
  publishing: boolean;
  onDiscard: () => void;
  discarding: boolean;
  onRetry: () => void;
  retrying: boolean;
}

export function DetailHeader({
  clip,
  review,
  isAdmin,
  onSendForReview,
  sendingForReview,
  onPublish,
  publishing,
  onDiscard,
  discarding,
  onRetry,
  retrying,
}: DetailHeaderProps) {
  const t = useTranslations("clips.detail_page");

  const title =
    clip.selected_title?.trim() ||
    t("titleFallback", {
      start: formatTime(clip.start_time),
      end: formatTime(clip.end_time),
    });

  const duration = clip.duration ? formatTime(clip.duration) : null;
  const youtubeUrl = review?.youtube_url ?? null;
  const isPublished = clip.status === "published";
  const isAwaitingReview = clip.status === "awaiting_review";
  const isReady = clip.status === "ready";
  const isError = clip.status === "error";
  const isTerminal = isPublished || clip.status === "discarded";
  const canDiscardHere = isAdmin && !isTerminal;

  const { data: stats } = useQuery({
    queryKey: ["clip-yt-stats", clip.id],
    queryFn: () => getClipYouTubeStats(clip.id),
    enabled: isPublished,
    staleTime: 60_000,
  });

  const metaItems: React.ReactNode[] = [];
  if (duration) {
    metaItems.push(
      <span key="duration" className="inline-flex items-center gap-1.5 tabular-nums">
        <svg
          className="h-3.5 w-3.5 opacity-50"
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
        {duration}
      </span>
    );
  }
  metaItems.push(
    <span key="created" className="inline-flex items-center gap-1.5">
      <svg
        className="h-3.5 w-3.5 opacity-50"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      {t("meta.createdAt", { date: formatDate(clip.created_at) })}
    </span>
  );
  if (isPublished && stats?.view_count != null) {
    metaItems.push(
      <span key="views" className="inline-flex items-center gap-1.5 tabular-nums">
        <svg
          className="h-3.5 w-3.5 opacity-50"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        {t("meta.views", { views: formatViews(stats.view_count) })}
      </span>
    );
  }

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-start gap-3">
        <h1 className="flex-1 font-serif text-2xl leading-tight text-foreground">
          {title}
        </h1>
        <div className="shrink-0 pt-1">
          <ClipStatusBadge status={clip.status} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
        {metaItems.map((node, idx) => (
          <span key={idx} className="inline-flex items-center gap-3">
            {idx > 0 && (
              <span className="h-0.5 w-0.5 rounded-full bg-muted-foreground/40" />
            )}
            {node}
          </span>
        ))}

        <div className="ml-auto flex items-center gap-2">
          {canDiscardHere && (
            <button
              type="button"
              onClick={onDiscard}
              disabled={discarding}
              className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground transition-all duration-200 hover:border-red-400/50 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:hover:bg-red-500/10 dark:hover:text-red-300"
            >
              {discarding ? t("actions.discarding") : t("actions.discard")}
            </button>
          )}

          {isReady && (
            <button
              type="button"
              onClick={onSendForReview}
              disabled={sendingForReview}
              className="inline-flex h-9 items-center rounded-lg bg-amber-500 px-4 text-xs font-semibold text-stone-950 shadow-sm shadow-amber-500/20 transition-all duration-200 hover:bg-amber-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sendingForReview
                ? t("actions.sendingForReview")
                : t("actions.sendForReview")}
            </button>
          )}

          {isAwaitingReview && isAdmin && (
            <button
              type="button"
              onClick={onPublish}
              disabled={publishing}
              className="inline-flex h-9 items-center rounded-lg bg-amber-500 px-4 text-xs font-semibold text-stone-950 shadow-sm shadow-amber-500/20 transition-all duration-200 hover:bg-amber-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {publishing ? t("actions.publishing") : t("actions.publish")}
            </button>
          )}

          {isError && (
            <button
              type="button"
              onClick={onRetry}
              disabled={retrying}
              className="inline-flex h-9 items-center rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60"
            >
              {t("actions.retry")}
            </button>
          )}

          {isPublished && youtubeUrl && (
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-50 px-3 text-xs font-semibold text-red-700 transition-all duration-200 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              {t("actions.viewOnYoutube")}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
