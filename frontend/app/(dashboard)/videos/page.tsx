"use client";

import { useTranslations } from "next-intl";
import { VideoListTable } from "@/components/features/videos/video-list-table";

export default function VideosPage() {
  const t = useTranslations("videos");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif text-foreground">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
        </div>
        <a
          href="/videos/new"
          className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-accent text-accent-foreground font-medium text-sm hover:bg-amber-400 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t("newVideo")}
        </a>
      </div>
      <VideoListTable />
    </div>
  );
}
