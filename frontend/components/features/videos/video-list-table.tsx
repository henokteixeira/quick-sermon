"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { listVideos } from "@/lib/api/videos";
import { formatDurationShort, formatDate } from "@/lib/formatters";
import { VideoStatusBadge } from "./video-status-badge";
import { VideoSubmitDialog } from "./video-submit-form";
import { Skeleton } from "@/components/ui/skeleton";

export function VideoListTable() {
  const t = useTranslations("videos.list");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["videos", page, pageSize],
    queryFn: () => listVideos({ page, page_size: pageSize }),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-3 rounded-xl border border-border bg-card"
          >
            <Skeleton className="w-36 sm:w-44 aspect-video rounded-lg shrink-0" />
            <div className="flex-1 space-y-3 py-1">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-2/5" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="relative flex flex-col items-center justify-center py-20 px-8 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 bg-gradient-to-b from-stone-50 to-transparent dark:from-stone-900/50 dark:to-transparent">
        {/* Ambient glow */}
        <div className="absolute w-[200px] h-[200px] rounded-full bg-amber-500/[0.06] blur-[80px] pointer-events-none" />

        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center mb-6 mx-auto">
            <svg
              className="w-9 h-9 text-amber-500/70"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs">
            {t("noVideos")}
          </p>
          <div className="flex justify-center">
            <VideoSubmitDialog>
              <button className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-amber-500 text-stone-950 text-sm font-semibold hover:bg-amber-400 transition-all shadow-sm shadow-amber-500/20 active:scale-[0.97]">
                <svg
                  className="w-4 h-4"
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
                {t("addFirst")}
              </button>
            </VideoSubmitDialog>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.items.map((video) => (
        <Link key={video.id} href={`/videos/${video.id}`} className="block group">
          <div className="flex items-center rounded-xl border border-border bg-card overflow-hidden transition-all duration-200 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/[0.04]">
            {/* Thumbnail */}
            <div className="relative w-28 sm:w-44 aspect-video shrink-0 bg-stone-100 dark:bg-stone-800 overflow-hidden">
              {video.thumbnail_url ? (
                <>
                  <img
                    src={video.thumbnail_url}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                      <svg
                        className="w-4 h-4 text-stone-900 ml-0.5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg
                    className="w-7 h-7 text-stone-300 dark:text-stone-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
              )}
              {video.duration && (
                <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-black/75 text-white tabular-nums backdrop-blur-sm">
                  {formatDurationShort(video.duration)}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 px-4 py-3 min-w-0">
              <h3 className="text-sm font-medium text-foreground truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {video.title || video.source_url}
              </h3>
              {video.channel_name && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {video.channel_name}
                </p>
              )}
              <div className="flex items-center gap-2.5 mt-2.5">
                <VideoStatusBadge status={video.status} />
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {formatDate(video.created_at)}
                </span>
              </div>
            </div>

            {/* Chevron */}
            <div className="pr-4 shrink-0 hidden sm:block">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-300 dark:text-stone-600 group-hover:text-amber-500 group-hover:bg-amber-500/5 transition-all">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          </div>
        </Link>
      ))}

      {data.total_pages > 1 && (
        <div className="flex items-center justify-between pt-4 px-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {t("previous")}
          </button>
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-foreground tabular-nums">
              {page}
            </span>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {data.total_pages}
            </span>
          </div>
          <button
            onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
            disabled={page >= data.total_pages}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t("next")}
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
