"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVideo, deleteVideo, updateVideo, refreshVideo } from "@/lib/api/videos";
import { VideoStatusBadge } from "@/components/features/videos/video-status-badge";
import { DetectionCard } from "@/components/features/videos/detection-card";
import { ClipList } from "@/components/features/clips/clip-list";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  formatDuration,
  formatDate,
  formatViews,
  formatUploadDate,
} from "@/lib/formatters";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Tab = "details" | "clips";

export default function VideoDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("videos.detail");
  const tClips = useTranslations("clips");
  const searchParams = useSearchParams();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const initialTab = searchParams.get("tab") === "clips" ? "clips" : "details";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

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
      <div className="max-w-[960px] mx-auto space-y-6">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-2/3" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-16 rounded-full" />
        </div>
        <Skeleton className="aspect-video rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!video) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: "details", label: t("tabDetails") },
    { key: "clips", label: t("tabClips") },
  ];

  const infoItems = [
    {
      label: t("duration"),
      value: formatDuration(video.duration),
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      label: t("channel"),
      value: video.channel_name || "--",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      label: t("views"),
      value: formatViews(video.view_count),
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
    {
      label: t("uploadDate"),
      value: formatUploadDate(video.upload_date),
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
  ];

  return (
    <div className="relative max-w-[960px] mx-auto">
      {/* Ambient glow */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-full bg-amber-500/[0.03] blur-[80px] pointer-events-none" />

      {/* Back */}
      <Link
        href="/videos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        {t("back")}
      </Link>

      {/* Title + status + actions */}
      <div className="mb-6">
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={handleTitleKeyDown}
            disabled={updateMutation.isPending}
            className="text-xl sm:text-2xl font-serif text-foreground leading-tight bg-transparent border-b-2 border-amber-500 outline-none w-full mb-3"
          />
        ) : (
          <h1 className="text-xl sm:text-2xl font-serif text-foreground leading-tight mb-3">
            {video.title || t("title")}
          </h1>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <VideoStatusBadge status={video.status} />
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            <button
              onClick={startEditingTitle}
              title={t("editTitle")}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-muted-foreground text-xs font-medium hover:bg-muted hover:text-foreground transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span className="hidden sm:inline">{t("editTitle")}</span>
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-red-500 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <span className="hidden sm:inline">{t("delete")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-border mb-6">
        <div className="flex items-center gap-0.5 flex-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "relative px-4 py-2.5 text-sm font-medium transition-colors rounded-t-lg",
                activeTab === tab.key
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-amber-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
        {activeTab === "clips" && (
          <Link
            href={`/videos/${id}/clip/new`}
            className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-amber-500 text-stone-950 text-xs font-semibold hover:bg-amber-400 transition-all shadow-sm shadow-amber-500/20 mb-1 active:scale-[0.97]"
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
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {tClips("createClip")}
          </Link>
        )}
      </div>

      {/* Tab: Details */}
      {activeTab === "details" && (
        <div className="space-y-5">
          {/* YouTube Embed / Thumbnail */}
          <div className="rounded-xl overflow-hidden border border-border shadow-sm">
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
          </div>

          {/* Detection status */}
          <DetectionCard videoId={id} />

          {/* Info cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {infoItems.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-amber-500/20"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-amber-500/60">{item.icon}</span>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                    {item.label}
                  </p>
                </div>
                <p className="text-sm font-semibold text-foreground tabular-nums truncate">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Submitted date (subtle, below the main info) */}
          <p className="text-xs text-muted-foreground px-1">
            {t("submittedAt")}: {formatDate(video.created_at)}
          </p>
        </div>
      )}

      {/* Tab: Clips */}
      {activeTab === "clips" && <ClipList videoId={id} />}

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
