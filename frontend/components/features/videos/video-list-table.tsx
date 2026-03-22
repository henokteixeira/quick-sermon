"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { listVideos } from "@/lib/api/videos";
import { VideoStatusBadge } from "./video-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "--";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}m`;
  return `${m}:${String(s).padStart(2, "0")}`;
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

export function VideoListTable() {
  const router = useRouter();
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
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t("noVideos")}</p>
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">{t("thumbnail")}</TableHead>
            <TableHead>{t("videoTitle")}</TableHead>
            <TableHead className="w-28">{t("duration")}</TableHead>
            <TableHead className="w-32">{t("status")}</TableHead>
            <TableHead className="w-40">{t("date")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.map((video) => (
            <TableRow
              key={video.id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => router.push(`/videos/${video.id}`)}
            >
              <TableCell>
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt=""
                    className="w-16 h-9 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-9 bg-gray-200 rounded" />
                )}
              </TableCell>
              <TableCell className="font-medium">
                {video.title || video.source_url}
              </TableCell>
              <TableCell className="text-gray-500 text-sm">
                {formatDuration(video.duration)}
              </TableCell>
              <TableCell>
                <VideoStatusBadge status={video.status} />
              </TableCell>
              <TableCell className="text-gray-500 text-sm">
                {formatDate(video.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {data.total_pages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("previous")}
          </button>
          <span className="text-sm text-gray-500">
            {page} / {data.total_pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
            disabled={page >= data.total_pages}
            className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("next")}
          </button>
        </div>
      )}
    </div>
  );
}
