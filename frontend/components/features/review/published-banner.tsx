"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface PublishedBannerProps {
  youtubeUrl: string | null;
}

export function PublishedBanner({ youtubeUrl }: PublishedBannerProps) {
  const t = useTranslations("clips.review_page");

  async function handleCopyLink() {
    if (!youtubeUrl) return;
    try {
      await navigator.clipboard.writeText(youtubeUrl);
      toast.success(t("publishedBannerLinkCopied"));
    } catch {
      toast.error(t("publishError.unknown"));
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-emerald-400/40 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-500/30 dark:bg-emerald-500/10">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-emerald-900 dark:text-emerald-200">
            {t("publishedBannerTitle")}
          </p>
          {youtubeUrl && (
            <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 break-all">
              {youtubeUrl}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex h-8 items-center rounded-lg border border-emerald-400/40 bg-white px-3 text-xs font-medium text-emerald-800 hover:bg-emerald-50 dark:bg-transparent dark:text-emerald-200 dark:hover:bg-emerald-500/10"
        >
          {t("publishedBannerCopyLink")}
        </button>
        {youtubeUrl && (
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            {t("publishedBannerOpenYoutube")}
          </a>
        )}
      </div>
    </div>
  );
}
