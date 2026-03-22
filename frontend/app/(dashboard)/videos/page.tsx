"use client";

import { useTranslations } from "next-intl";
import { VideoListTable } from "@/components/features/videos/video-list-table";
import { VideoSubmitDialog } from "@/components/features/videos/video-submit-form";

export default function VideosPage() {
  const t = useTranslations("videos");

  return (
    <div className="max-w-[900px] mx-auto">
      <div className="flex items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif text-foreground">{t("title")}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block">{t("subtitle")}</p>
        </div>
        <VideoSubmitDialog>
          <button className="inline-flex items-center gap-2 h-9 sm:h-10 px-3 sm:px-5 rounded-lg bg-accent text-accent-foreground font-medium text-sm hover:bg-amber-400 transition-colors shadow-sm shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="hidden sm:inline">{t("newVideo")}</span>
          </button>
        </VideoSubmitDialog>
      </div>
      <VideoListTable />
    </div>
  );
}
