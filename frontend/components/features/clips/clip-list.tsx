"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listClips, retryClip, deleteClip, getClipProgress } from "@/lib/api/clips";
import { triggerUpload, getUploadByClip } from "@/lib/api/youtube";
import { getApiErrorCode } from "@/lib/api/client";
import { Clip, ClipProgress } from "@/lib/types/clip";
import { ClipStatusBadge } from "./clip-status-badge";
import { ClipPlayerDialog } from "./clip-player-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { formatTime, formatFileSizeFromBytes } from "@/lib/formatters";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function ClipProgressBar({ clipId }: { clipId: string }) {
  const t = useTranslations("clips.progress");

  const { data: progress } = useQuery<ClipProgress>({
    queryKey: ["clip-progress", clipId],
    queryFn: () => getClipProgress(clipId),
    refetchInterval: 3000,
  });

  if (!progress || progress.percent === 0) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-blue-500/40 rounded-full animate-pulse w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progress.percent, 100)}%` }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground tabular-nums w-10 text-right">
          {progress.percent.toFixed(0)}%
        </span>
      </div>
      {progress.speed && (
        <p className="text-[10px] text-muted-foreground">
          {t("speed")}: {progress.speed}
        </p>
      )}
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

  const { data: lastUpload } = useQuery({
    queryKey: ["youtube-upload", clip.id],
    queryFn: () => getUploadByClip(clip.id),
    enabled: isReady || isPublished,
  });

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

  const isClickable = isReady || isPublished;

  return (
    <Card
      className={isClickable ? "cursor-pointer hover:ring-1 hover:ring-stone-300 dark:hover:ring-stone-600 transition-shadow" : ""}
      onClick={isClickable ? () => onPlay(clip, isPublished ? lastUpload?.youtube_video_id : null) : undefined}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <ClipStatusBadge status={clip.status} />
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatTime(clip.start_time)} — {formatTime(clip.end_time)}
              </span>
              <span className="text-xs text-muted-foreground">
                {clip.quality}
              </span>
            </div>

            {isActive && <ClipProgressBar clipId={clip.id} />}

            {(isReady || isPublished) && (
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                {clip.resolution && <span>{clip.resolution}</span>}
                {clip.file_size && <span>{formatFileSizeFromBytes(clip.file_size)}</span>}
                {clip.duration && <span>{formatTime(clip.duration)}</span>}
              </div>
            )}

            {clip.status === "error" && clip.error_code && (
              <p className="text-xs text-red-600 mt-2">
                {tErrors(clip.error_code)}
              </p>
            )}

            {uploadError && (
              <p className="text-xs text-red-600 mt-2">{uploadError}</p>
            )}

            {lastUploadFailed && !uploadError && (
              <p className="text-xs text-red-600 mt-2">
                {lastUpload.error_message || tUploadErrors("unknown")}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {isPublished && lastUpload?.youtube_video_id && (
              <a
                href={`https://studio.youtube.com/video/${lastUpload.youtube_video_id}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                {t("editOnYouTube")}
              </a>
            )}
            {isReady && (
              <button
                onClick={() => uploadMutation.mutate()}
                disabled={uploadMutation.isPending}
                className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                {uploadMutation.isPending ? t("uploading") : lastUploadFailed ? t("retryUpload") : t("upload")}
              </button>
            )}
            {clip.status === "error" && (
              <button
                onClick={() => retryMutation.mutate()}
                disabled={retryMutation.isPending}
                className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                <svg
                  className="w-3 h-3"
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
            <button
              onClick={() => setDeleteOpen(true)}
              className="inline-flex items-center h-7 px-2 rounded-md text-xs text-red-500 hover:bg-red-50 transition-colors"
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
          </div>
        </div>

        {/* Delete confirmation */}
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
      </CardContent>
    </Card>
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
        (c) => c.status === "pending" || c.status === "downloading" || c.status === "trimming" || c.status === "uploading"
      );
      return hasActive ? 3_000 : 15_000;
    },
  });

  const clips = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="h-5 bg-muted rounded w-2/3 animate-pulse" />
              <div className="h-3 bg-muted rounded w-1/3 animate-pulse mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <div className="text-center py-8">
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
