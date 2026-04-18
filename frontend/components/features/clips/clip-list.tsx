"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listClips,
  retryClip,
  deleteClip,
  getClipProgress,
  getClipStreamUrl,
} from "@/lib/api/clips";
import { triggerUpload, getUploadByClip } from "@/lib/api/youtube";
import { getApiErrorCode } from "@/lib/api/client";
import { Clip, ClipProgress } from "@/lib/types/clip";
import { ClipStatusBadge } from "./clip-status-badge";
import { ClipPlayerDialog } from "./clip-player-dialog";
import { formatTime, formatFileSizeFromBytes, formatDuration } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_ACCENT: Record<string, string> = {
  pending: "border-l-amber-400",
  downloading: "border-l-blue-400",
  trimming: "border-l-indigo-400",
  ready: "border-l-emerald-400",
  uploading: "border-l-cyan-400",
  awaiting_review: "border-l-purple-400",
  published: "border-l-emerald-400",
  discarded: "border-l-stone-400",
  error: "border-l-red-400",
};

function useEta(percent: number, startedAt: number | null) {
  const now = Date.now() / 1000;
  if (!startedAt || percent <= 0) return { elapsed: 0, eta: null };
  const elapsed = Math.max(0, now - startedAt);
  const rate = percent / elapsed;
  const remaining = rate > 0 ? (100 - percent) / rate : null;
  return { elapsed: Math.round(elapsed), eta: remaining ? Math.round(remaining) : null };
}

function ClipProgressBar({ clipId }: { clipId: string }) {
  const t = useTranslations("clips.progress");

  const { data: progress } = useQuery<ClipProgress>({
    queryKey: ["clip-progress", clipId],
    queryFn: () => getClipProgress(clipId),
    refetchInterval: 3000,
  });

  const { elapsed, eta } = useEta(
    progress?.percent ?? 0,
    progress?.started_at ?? null
  );

  if (!progress || progress.percent === 0) {
    return (
      <div className="flex items-center gap-2 mt-2.5">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-blue-500/40 rounded-full animate-pulse w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2.5 space-y-1.5">
      <div className="flex items-center justify-between text-[10px] tabular-nums">
        <span className="text-muted-foreground font-medium">
          {progress.percent.toFixed(0)}%
          {elapsed > 0 && (
            <span className="text-muted-foreground/60 ml-1">
              · {formatDuration(elapsed)}
            </span>
          )}
        </span>
        {eta !== null && eta > 0 && (
          <span className="text-blue-600 dark:text-blue-400 font-medium">
            ~{formatDuration(eta)} {t("remaining")}
          </span>
        )}
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(progress.percent, 100)}%` }}
        />
      </div>
    </div>
  );
}

function ClipItem({ clip, videoId, onPlay }: { clip: Clip; videoId: string; onPlay: (clip: Clip, youtubeVideoId?: string | null) => void }) {
  const t = useTranslations("clips");
  const tErrors = useTranslations("clips.errors");
  const tUploadErrors = useTranslations("clips.uploadErrors");
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const retryMutation = useMutation({
    mutationFn: () => retryClip(clip.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clips", videoId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteClip(clip.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clips", videoId] });
      setDeleteOpen(false);
    },
  });

  const isActive = clip.status === "downloading" || clip.status === "trimming" || clip.status === "uploading";
  const isReady = clip.status === "ready";
  const isPublished = clip.status === "published";
  const isAwaitingReview = clip.status === "awaiting_review";
  const isDiscarded = clip.status === "discarded";

  const isUploading = clip.status === "uploading";
  const canDownloadFile = isReady || isAwaitingReview;

  const { data: lastUpload } = useQuery({
    queryKey: ["youtube-upload", clip.id],
    queryFn: () => getUploadByClip(clip.id),
    enabled: isReady || isPublished || isUploading || isAwaitingReview,
    refetchInterval: (query) => {
      const hasVideoId = !!query.state.data?.youtube_video_id;
      if (hasVideoId) return false;
      if (isUploading) return 2_000;
      return false;
    },
  });

  async function handleDownload() {
    try {
      const url = await getClipStreamUrl(clip.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setUploadError(tUploadErrors("unknown"));
    }
  }

  const lastUploadFailed = lastUpload?.youtube_status === "failed";

  const uploadMutation = useMutation({
    mutationFn: () => triggerUpload({ clip_id: clip.id }),
    onSuccess: () => {
      setUploadError(null);
      queryClient.invalidateQueries({ queryKey: ["clips", videoId] });
      queryClient.invalidateQueries({ queryKey: ["youtube-upload", clip.id] });
    },
    onError: (error) => {
      const code = getApiErrorCode(error);
      setUploadError(tUploadErrors.has(code) ? tUploadErrors(code) : tUploadErrors("unknown"));
    },
  });

  const isClickable = isReady || isPublished || isAwaitingReview;
  const accentClass = STATUS_ACCENT[clip.status] || "border-l-transparent";

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card border-l-[3px] transition-all",
        accentClass,
        isClickable && "cursor-pointer hover:border-amber-500/20 hover:shadow-md hover:shadow-amber-500/[0.03]"
      )}
      onClick={isClickable ? () => onPlay(clip, isPublished ? lastUpload?.youtube_video_id : null) : undefined}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <ClipStatusBadge status={clip.status} />
              <span className="text-xs text-muted-foreground tabular-nums font-medium">
                {formatTime(clip.start_time)} — {formatTime(clip.end_time)}
              </span>
              <span className="text-[11px] text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded">
                {clip.quality}
              </span>
            </div>

            {isActive && <ClipProgressBar clipId={clip.id} />}

            {(isReady || isPublished || isAwaitingReview) && (
              <div className="flex items-center gap-3 mt-2.5 text-xs text-muted-foreground">
                {clip.resolution && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                    {clip.resolution}
                  </span>
                )}
                {clip.file_size && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                      <polyline points="13 2 13 9 20 9" />
                    </svg>
                    {formatFileSizeFromBytes(clip.file_size)}
                  </span>
                )}
                {clip.duration && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {formatTime(clip.duration)}
                  </span>
                )}
              </div>
            )}

            {clip.status === "error" && clip.error_code && (
              <p className="text-xs text-red-600 mt-2.5">
                {tErrors(clip.error_code)}
              </p>
            )}

            {uploadError && (
              <p className="text-xs text-red-600 mt-2.5">{uploadError}</p>
            )}

            {lastUploadFailed && !uploadError && (
              <p className="text-xs text-red-600 mt-2.5">
                {lastUpload.error_message || tUploadErrors("unknown")}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {canDownloadFile && (
              <button
                onClick={handleDownload}
                title={t("download")}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span className="hidden sm:inline">{t("download")}</span>
              </button>
            )}
            {isPublished && lastUpload?.youtube_video_id && (
              <a
                href={`https://studio.youtube.com/video/${lastUpload.youtube_video_id}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                <span className="hidden sm:inline">{t("editOnYouTube")}</span>
              </a>
            )}
            {isAwaitingReview && (
              <Link
                href={`/videos/${videoId}/clip/${clip.id}/review`}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 dark:text-purple-300 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                </svg>
                <span className="hidden sm:inline">{t("review")}</span>
              </Link>
            )}
            {isReady && (
              <button
                onClick={() => uploadMutation.mutate()}
                disabled={uploadMutation.isPending}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                <span className="hidden sm:inline">
                  {uploadMutation.isPending ? t("uploading") : lastUploadFailed ? t("retryUpload") : t("sendForReview")}
                </span>
              </button>
            )}
            {clip.status === "error" && (
              <button
                onClick={() => retryMutation.mutate()}
                disabled={retryMutation.isPending}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors disabled:opacity-50"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                {t("retry")}
              </button>
            )}
            {!isDiscarded && !isAwaitingReview && !isPublished && (
              <button
                onClick={() => setDeleteOpen(true)}
                className="inline-flex items-center h-8 px-2 rounded-lg text-xs text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Delete confirmation */}
        <div onClick={(e) => e.stopPropagation()}>
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{t("deleteTitle")}</DialogTitle>
              <DialogDescription>{t("deleteDescription")}</DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => setDeleteOpen(false)}
                className="h-9 px-4 rounded-lg border border-input text-sm font-medium hover:bg-muted transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="h-9 px-4 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? t("deleting") : t("confirmDelete")}
              </button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </div>
  );
}

interface ClipListProps {
  videoId: string;
}

export function ClipList({ videoId }: ClipListProps) {
  const t = useTranslations("clips.list");
  const [playingClip, setPlayingClip] = useState<Clip | null>(null);
  const [playingYouTubeId, setPlayingYouTubeId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["clips", videoId],
    queryFn: () => listClips({ video_id: videoId }),
    refetchInterval: (query) => {
      const clips = query.state.data?.items ?? [];
      const hasActive = clips.some(
        (c) =>
          c.status === "pending" ||
          c.status === "downloading" ||
          c.status === "trimming" ||
          c.status === "uploading"
      );
      return hasActive ? 3_000 : 15_000;
    },
  });

  const clips = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 border-l-[3px] border-l-stone-300 dark:border-l-stone-600">
            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <div className="h-5 bg-muted rounded-full w-16 animate-pulse" />
                  <div className="h-5 bg-muted rounded w-24 animate-pulse" />
                </div>
                <div className="h-3 bg-muted rounded w-1/3 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
        </div>
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {clips.map((clip) => (
          <ClipItem key={clip.id} clip={clip} videoId={videoId} onPlay={(c, ytId) => { setPlayingClip(c); setPlayingYouTubeId(ytId || null); }} />
        ))}
      </div>

      <ClipPlayerDialog
        clip={playingClip}
        open={!!playingClip}
        onOpenChange={(open) => { if (!open) { setPlayingClip(null); setPlayingYouTubeId(null); } }}
        youtubeVideoId={playingYouTubeId}
      />
    </>
  );
}
