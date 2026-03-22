"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { getVideo } from "@/lib/api/videos";
import { VideoStatusBadge } from "@/components/features/videos/video-status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
    month: "2-digit",
    year: "2-digit",
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
  const t = useTranslations("videos.detail");

  const { data: video, isLoading } = useQuery({
    queryKey: ["video", id],
    queryFn: () => getVideo(id),
  });

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

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-5">
        <h1 className="text-xl sm:text-2xl font-serif text-foreground leading-tight">
          {video.title || t("title")}
        </h1>
        <VideoStatusBadge status={video.status} />
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
    </div>
  );
}
