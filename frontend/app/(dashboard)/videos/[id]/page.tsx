"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVideo, deleteVideo, updateVideo, refreshVideo } from "@/lib/api/videos";
import { VideoStatusBadge } from "@/components/features/videos/video-status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "--";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}h${String(m).padStart(2, "0")}m${String(s).padStart(2, "0")}s`;
  return `${m}m${String(s).padStart(2, "0")}s`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatViews(count: number | null): string {
  if (!count) return "--";
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toLocaleString("pt-BR");
}

function formatUploadDate(dateStr: string | null): string {
  if (!dateStr || dateStr.length !== 8) return "--";
  const y = dateStr.slice(0, 4);
  const m = dateStr.slice(4, 6);
  const d = dateStr.slice(6, 8);
  return new Date(`${y}-${m}-${d}`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function VideoDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("videos.detail");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: video, isLoading } = useQuery({
    queryKey: ["video", id],
    queryFn: () => getVideo(id),
  });

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  const updateMutation = useMutation({
    mutationFn: (title: string) => updateVideo(id, { title }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["video", id], updated);
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      setIsEditingTitle(false);
    },
  });

  const refreshMutation = useMutation({
    mutationFn: () => refreshVideo(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(["video", id], updated);
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });

  // Auto-refresh metadata on page load
  useEffect(() => {
    if (video && !refreshMutation.isPending) {
      refreshMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video?.id]);

  const deleteMutation = useMutation({
    mutationFn: () => deleteVideo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      router.push("/videos");
    },
  });

  function startEditingTitle() {
    setEditTitle(video?.title || "");
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  }

  function saveTitle() {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== video?.title) {
      updateMutation.mutate(trimmed);
    } else {
      setIsEditingTitle(false);
    }
  }

  function handleTitleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") saveTitle();
    if (e.key === "Escape") setIsEditingTitle(false);
  }

  if (isLoading) {
    return (
      <div className="max-w-[900px] mx-auto space-y-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-2/3" />
        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4">
          <Skeleton className="aspect-video rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!video) return null;

  return (
    <div className="max-w-[900px] mx-auto">
      <Link
        href="/videos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        {t("back")}
      </Link>

      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={handleTitleKeyDown}
                disabled={updateMutation.isPending}
                className="text-xl sm:text-2xl font-serif text-foreground leading-tight bg-transparent border-b-2 border-accent outline-none w-full"
              />
            ) : (
              <button
                onClick={startEditingTitle}
                className="group flex items-center gap-2 text-left"
                title={t("editTitle")}
              >
                <h1 className="text-xl sm:text-2xl font-serif text-foreground leading-tight">
                  {video.title || t("title")}
                </h1>
                <svg className="w-4 h-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}
            <VideoStatusBadge status={video.status} />
          </div>
        </div>
        <button
          onClick={() => setDeleteOpen(true)}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors shrink-0"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          {t("delete")}
        </button>
      </div>

      {/* YouTube Embed */}
      <Card className="overflow-hidden p-0 mb-4">
        {video.youtube_video_id ? (
          <div className="relative aspect-video bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${video.youtube_video_id}`}
              title={video.title || ""}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        ) : video.thumbnail_url ? (
          <div className="relative aspect-video bg-muted">
            <img
              src={video.thumbnail_url}
              alt={video.title || ""}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-video bg-muted flex items-center justify-center">
            <svg className="w-10 h-10 text-muted-foreground/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        )}
      </Card>

      {/* Info cards grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
              {t("duration")}
            </p>
            <p className="text-sm font-medium text-foreground tabular-nums mt-1">
              {formatDuration(video.duration)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
              {t("channel")}
            </p>
            <p className="text-sm font-medium text-foreground mt-1 truncate">
              {video.channel_name || "--"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
              {t("views")}
            </p>
            <p className="text-sm font-medium text-foreground tabular-nums mt-1">
              {formatViews(video.view_count)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
              {t("uploadDate")}
            </p>
            <p className="text-sm font-medium text-foreground mt-1">
              {formatUploadDate(video.upload_date)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
              {t("submittedAt")}
            </p>
            <p className="text-sm font-medium text-foreground mt-1">
              {formatDate(video.created_at)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Delete confirmation dialog */}
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
  );
}
