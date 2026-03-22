"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { VideoStatus } from "@/lib/types/video";

const STATUS_VARIANT: Record<VideoStatus, string> = {
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  detecting: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  processing: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  awaiting_review: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  published: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  error: "bg-red-500/15 text-red-400 border-red-500/30",
};

export function VideoStatusBadge({ status }: { status: VideoStatus }) {
  const t = useTranslations("videos.status");

  return (
    <Badge variant="outline" className={STATUS_VARIANT[status]}>
      {t(status)}
    </Badge>
  );
}
