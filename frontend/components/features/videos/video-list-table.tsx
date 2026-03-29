"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { listVideos } from "@/lib/api/videos";
import { formatDurationShort, formatDate } from "@/lib/formatters";
import { VideoStatusBadge } from "./video-status-badge";
import { VideoSubmitDialog } from "./video-submit-form";
import { Card } from "@/components/ui/card";
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
      <div className="grid gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-32 h-20 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-16 px-8">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{t("noVideos")}</p>
        <VideoSubmitDialog>
          <button className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-amber-400 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t("addFirst")}
          </button>
        </VideoSubmitDialog>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {data.items.map((video) => (
        <Link key={video.id} href={`/videos/${video.id}`} className="block group">
          <Card className="p-0 overflow-hidden transition-all hover:shadow-md hover:border-accent/30">
            <div className="flex items-center">
              <div className="relative w-24 sm:w-36 h-16 sm:h-[5.25rem] shrink-0 bg-muted overflow-hidden">
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                )}
                {video.duration && (
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/70 text-white tabular-nums">
                    {formatDurationShort(video.duration)}
                  </span>
                )}
              </div>

              <div className="flex-1 px-3 sm:px-4 py-2 sm:py-3 min-w-0">
                <h3 className="text-sm font-medium text-foreground truncate group-hover:text-accent transition-colors">
                  {video.title || video.source_url}
                </h3>
                <div className="flex items-center gap-3 mt-2">
                  <VideoStatusBadge status={video.status} />
                  <span className="text-xs text-muted-foreground">
                    {formatDate(video.created_at)}
                  </span>
                </div>
              </div>

              <div className="pr-3 sm:pr-4 shrink-0 hidden sm:block">
                <svg className="w-4 h-4 text-muted-foreground/40 group-hover:text-accent transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          </Card>
        </Link>
      ))}

      {data.total_pages > 1 && (
        <div className="flex items-center justify-between pt-2 px-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {t("previous")}
          </button>
          <span className="text-xs text-muted-foreground tabular-nums">
            {page} / {data.total_pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
            disabled={page >= data.total_pages}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t("next")}
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
