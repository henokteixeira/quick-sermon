"use client";

import { useTranslations } from "next-intl";
import { VideoListTable } from "@/components/features/videos/video-list-table";

export default function VideosPage() {
  const t = useTranslations("videos");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif text-gray-900">{t("title")}</h1>
        <a
          href="/videos/new"
          className="h-10 px-4 inline-flex items-center rounded-lg bg-amber-500 text-white font-medium text-sm hover:bg-amber-600 transition-colors"
        >
          {t("newVideo")}
        </a>
      </div>
      <VideoListTable />
    </div>
  );
}
