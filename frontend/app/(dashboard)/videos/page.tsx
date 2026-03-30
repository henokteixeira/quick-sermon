"use client";

import { useTranslations } from "next-intl";
import { VideoListTable } from "@/components/features/videos/video-list-table";
import { VideoSubmitDialog } from "@/components/features/videos/video-submit-form";

export default function VideosPage() {
  const t = useTranslations("videos");

  return (
    <div className="relative max-w-[960px] mx-auto">
      {/* Ambient glow */}
      <div className="absolute -top-20 right-0 w-[300px] h-[300px] rounded-full bg-amber-500/[0.04] blur-[100px] pointer-events-none" />

      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-foreground tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
            {t("subtitle")}
          </p>
        </div>
        <VideoSubmitDialog>
          <button className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-amber-500 text-stone-950 font-semibold text-sm hover:bg-amber-400 transition-all shadow-sm shadow-amber-500/20 hover:shadow-md hover:shadow-amber-400/25 shrink-0 active:scale-[0.97]">
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
            <span className="hidden sm:inline">{t("newVideo")}</span>
          </button>
        </VideoSubmitDialog>
      </div>
      <VideoListTable />
    </div>
  );
}
