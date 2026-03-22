"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { getVideo } from "@/lib/api/videos";
import { VideoStatusBadge } from "@/components/features/videos/video-status-badge";
import { Skeleton } from "@/components/ui/skeleton";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "--";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}m${String(s).padStart(2, "0")}s`;
  return `${m}m${String(s).padStart(2, "0")}s`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("videos.detail");

  const { data: video, isLoading } = useQuery({
    queryKey: ["video", id],
    queryFn: () => getVideo(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full max-w-2xl" />
      </div>
    );
  }

  if (!video) return null;

  return (
    <div className="max-w-3xl">
      <div className="flex items-start gap-4 mb-6">
        <a
          href="/videos"
          className="mt-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          &larr;
        </a>
        <div>
          <h1 className="text-2xl font-serif text-gray-900">
            {video.title || t("title")}
          </h1>
          <div className="mt-1">
            <VideoStatusBadge status={video.status} />
          </div>
        </div>
      </div>

      {video.thumbnail_url && (
        <img
          src={video.thumbnail_url}
          alt={video.title || ""}
          className="w-full max-w-xl rounded-lg mb-6"
        />
      )}

      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-gray-500">{t("sourceUrl")}</dt>
          <dd className="mt-0.5">
            <a
              href={video.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 hover:text-amber-700 break-all"
            >
              {video.source_url}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">{t("duration")}</dt>
          <dd className="mt-0.5 text-gray-900">
            {formatDuration(video.duration)}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">{t("submittedAt")}</dt>
          <dd className="mt-0.5 text-gray-900">
            {formatDate(video.created_at)}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">{t("status")}</dt>
          <dd className="mt-0.5">
            <VideoStatusBadge status={video.status} />
          </dd>
        </div>
      </dl>
    </div>
  );
}
