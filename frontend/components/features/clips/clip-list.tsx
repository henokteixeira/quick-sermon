"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listClips, retryClip, deleteClip, getClipProgress } from "@/lib/api/clips";
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

function ClipItem({ clip, videoId, onPlay }: { clip: Clip; videoId: string; onPlay: (clip: Clip) => void }) {
  const t = useTranslations("clips");
  const tErrors = useTranslations("clips.errors");
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

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

  const isActive = clip.status === "downloading" || clip.status === "trimming";

  const isReady = clip.status === "ready";

  return (
    <Card
      className={isReady ? "cursor-pointer hover:ring-1 hover:ring-stone-300 dark:hover:ring-stone-600 transition-shadow" : ""}
      onClick={isReady ? () => onPlay(clip) : undefined}
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

            {isReady && (
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
          </div>

          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
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

  const { data, isLoading } = useQuery({
    queryKey: ["clips", videoId],
    queryFn: () => listClips({ video_id: videoId }),
    refetchInterval: (query) => {
      const clips = query.state.data?.items ?? [];
      const hasActive = clips.some(
        (c) => c.status === "pending" || c.status === "downloading" || c.status === "trimming"
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
          <ClipItem key={clip.id} clip={clip} videoId={videoId} onPlay={setPlayingClip} />
        ))}
      </div>

      <ClipPlayerDialog
        clip={playingClip}
        open={!!playingClip}
        onOpenChange={(open) => !open && setPlayingClip(null)}
      />
    </>
  );
}
