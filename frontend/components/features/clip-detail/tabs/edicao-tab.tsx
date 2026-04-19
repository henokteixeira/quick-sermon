"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { getVideo } from "@/lib/api/videos";
import { getClipStreamUrl } from "@/lib/api/clips";
import { Clip } from "@/lib/types/clip";
import {
  formatTime,
  formatFileSizeFromBytes,
  formatDate,
} from "@/lib/formatters";

interface EdicaoTabProps {
  clip: Clip;
  videoId: string;
}

export function EdicaoTab({ clip, videoId }: EdicaoTabProps) {
  const t = useTranslations("clips.detail_page.edicao");
  const [downloadError, setDownloadError] = useState(false);

  const { data: video } = useQuery({
    queryKey: ["video", videoId],
    queryFn: () => getVideo(videoId),
    staleTime: 60_000,
  });

  async function handleDownload() {
    try {
      setDownloadError(false);
      const url = await getClipStreamUrl(clip.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setDownloadError(true);
    }
  }

  const duration = clip.duration
    ? formatTime(clip.duration)
    : formatTime(clip.end_time - clip.start_time);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        <svg
          className="mt-0.5 h-4 w-4 shrink-0 opacity-60"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>{t("readOnlyHint")}</span>
      </div>

      <Card title={t("sourceCardTitle")}>
        <DetailRow label="Vídeo">
          <span className="truncate">{video?.title || "—"}</span>
        </DetailRow>
        {video?.source_url && (
          <DetailRow label="URL">
            <a
              href={video.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 truncate text-amber-600 transition-colors hover:text-amber-500 hover:underline dark:text-amber-400"
            >
              {t("sourceOpenYoutube")}
              <svg
                className="h-3 w-3 opacity-70"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </DetailRow>
        )}
        {video?.duration != null && (
          <DetailRow label="Duração do vídeo">
            <span className="font-mono tabular-nums">
              {formatTime(video.duration)}
            </span>
          </DetailRow>
        )}
      </Card>

      <Card title={t("segmentCardTitle")}>
        <DetailRow label={t("segmentStart")}>
          <span className="font-mono tabular-nums">
            {formatTime(clip.start_time)}
          </span>
        </DetailRow>
        <DetailRow label={t("segmentEnd")}>
          <span className="font-mono tabular-nums">
            {formatTime(clip.end_time)}
          </span>
        </DetailRow>
        <DetailRow label={t("segmentDuration")}>
          <span className="font-mono tabular-nums font-semibold text-foreground">
            {duration}
          </span>
        </DetailRow>
        <DetailRow label="Criado em">
          <span>{formatDate(clip.created_at)}</span>
        </DetailRow>
      </Card>

      <Card title={t("qualityCardTitle")}>
        <DetailRow label={t("qualityLabel")}>
          <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums">
            {clip.quality}
          </span>
        </DetailRow>
        {clip.resolution && (
          <DetailRow label={t("resolutionLabel")}>
            <span className="font-mono tabular-nums">{clip.resolution}</span>
          </DetailRow>
        )}
      </Card>

      <Card title={t("fileCardTitle")}>
        {clip.file_path && clip.file_size ? (
          <>
            <DetailRow label={t("fileSize")}>
              <span className="font-mono tabular-nums">
                {formatFileSizeFromBytes(clip.file_size)}
              </span>
            </DetailRow>
            <div className="flex items-center justify-between gap-3 px-3 py-3">
              <span className="text-xs text-muted-foreground">
                Download direto
              </span>
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition-all duration-200 hover:border-amber-500/40 hover:bg-amber-50 active:scale-[0.98] dark:hover:bg-amber-500/10"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {t("fileDownload")}
                </button>
                {downloadError && (
                  <span className="text-xs text-red-600">
                    Falha ao baixar. Tente novamente.
                  </span>
                )}
              </div>
            </div>
          </>
        ) : (
          <p className="px-3 py-8 text-center text-xs text-muted-foreground">
            {t("fileEmpty")}
          </p>
        )}
      </Card>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <header className="border-b border-border px-4 py-2.5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
      </header>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 max-w-[60%] text-right text-foreground">
        {children}
      </span>
    </div>
  );
}
