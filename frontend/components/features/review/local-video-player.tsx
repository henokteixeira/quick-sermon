"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getClipStreamUrl } from "@/lib/api/clips";

interface LocalVideoPlayerProps {
  clipId: string;
}

export function LocalVideoPlayer({ clipId }: LocalVideoPlayerProps) {
  const t = useTranslations("clips.review_page");
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const resolved = await getClipStreamUrl(clipId);
        if (!cancelled) setUrl(resolved);
      } catch {
        if (!cancelled) setError(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [clipId]);

  if (error) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl border border-border bg-muted text-sm text-muted-foreground">
        {t("loadError")}
      </div>
    );
  }

  if (!url) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl border border-border bg-muted text-sm text-muted-foreground">
        {t("loading")}
      </div>
    );
  }

  return (
    <div className="aspect-video overflow-hidden rounded-xl border border-border bg-black">
      <video controls src={url} className="h-full w-full" preload="metadata" />
    </div>
  );
}
