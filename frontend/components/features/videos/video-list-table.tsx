"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus, Sparkles } from "lucide-react";
import { listVideos } from "@/lib/api/videos";
import { formatDate, formatDurationShort } from "@/lib/formatters";
import { VideoSubmitDialog } from "./video-submit-form";
import { Btn } from "@/components/features/ui/btn";
import { VideoRow } from "@/components/features/ui/video-row";
import { Skeleton } from "@/components/ui/skeleton";

export function VideoListTable() {
  const t = useTranslations("videos.list");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["videos", page, pageSize],
    queryFn: () => listVideos({ page, page_size: pageSize }),
    refetchInterval: 15_000,
  });

  const total = data?.total ?? 0;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-5">
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border border-qs-line bg-qs-bg-elev p-3"
            >
              <Skeleton className="h-[80px] w-[140px] rounded-lg" />
              <div className="flex-1 space-y-2 py-1">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-2/5" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {data.items.map((video) => (
              <VideoRow
                key={video.id}
                href={`/videos/${video.id}`}
                title={video.title || video.source_url}
                channel={video.channel_name ?? undefined}
                date={formatDate(video.created_at)}
                duration={
                  video.duration
                    ? formatDurationShort(video.duration)
                    : undefined
                }
                clipsCount={video.clip_count}
                thumbnailUrl={video.thumbnail_url ?? undefined}
              />
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[12px] text-qs-fg-faint">
              Mostrando{" "}
              <span className="font-mono text-qs-fg-muted">
                {start}–{end}
              </span>{" "}
              de <span className="font-mono text-qs-fg-muted">{total}</span>
            </span>
            {data.total_pages > 1 && (
              <div className="flex gap-1">
                <Btn
                  size="sm"
                  variant="ghost"
                  icon={<ChevronLeft className="h-3 w-3" />}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {t("previous")}
                </Btn>
                <Btn
                  size="sm"
                  variant="secondary"
                  iconRight={<ChevronRight className="h-3 w-3" />}
                  disabled={page >= data.total_pages}
                  onClick={() =>
                    setPage((p) => Math.min(data.total_pages, p + 1))
                  }
                >
                  {t("next")}
                </Btn>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function EmptyState() {
  const t = useTranslations("videos.list");
  return (
    <div className="relative flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-qs-line bg-qs-bg-elev px-8 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[rgba(245,158,11,0.2)] to-[rgba(245,158,11,0.05)]">
        <Sparkles className="h-7 w-7 text-qs-amber" />
      </div>
      <p className="max-w-xs text-[13px] text-qs-fg-subtle">{t("noVideos")}</p>
      <VideoSubmitDialog>
        <Btn variant="primary" icon={<Plus className="h-4 w-4" />}>
          {t("addFirst")}
        </Btn>
      </VideoSubmitDialog>
    </div>
  );
}
