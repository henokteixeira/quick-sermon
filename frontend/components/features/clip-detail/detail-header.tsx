"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  Loader2,
  Trash2,
  Upload,
  Youtube,
} from "lucide-react";
import { getClipYouTubeStats } from "@/lib/api/clips";
import { getVideo } from "@/lib/api/videos";
import { Clip, ClipReviewData } from "@/lib/types/clip";
import { Btn } from "@/components/features/ui/btn";
import {
  DownloadMenu,
  DownloadIcons,
} from "@/components/features/ui/download-menu";
import { SaveStatus } from "@/lib/hooks/use-clip-autosave";
import { cn } from "@/lib/utils";
import {
  formatFileSizeFromBytes,
  formatTime,
} from "@/lib/formatters";

interface DetailHeaderProps {
  clip: Clip;
  review: ClipReviewData | undefined;
  isAdmin: boolean;
  autosaveStatus: SaveStatus;
  onSendForReview: () => void;
  sendingForReview: boolean;
  onPublish: () => void;
  publishing: boolean;
  onDiscard: () => void;
  discarding: boolean;
  onRetry: () => void;
  retrying: boolean;
  onDownloadFile: () => void;
}

export function DetailHeader({
  clip,
  review,
  isAdmin,
  autosaveStatus,
  onSendForReview,
  sendingForReview,
  onPublish,
  publishing,
  onDiscard,
  discarding,
  onRetry,
  retrying,
  onDownloadFile,
}: DetailHeaderProps) {
  const tDetail = useTranslations("clips.detail_page");

  const { data: video } = useQuery({
    queryKey: ["video", clip.video_id],
    queryFn: () => getVideo(clip.video_id),
    staleTime: 60_000,
  });

  const title =
    clip.selected_title?.trim() ||
    tDetail("titleFallback", {
      start: formatTime(clip.start_time),
      end: formatTime(clip.end_time),
    });

  const youtubeUrl = review?.youtube_url ?? null;
  const isPublished = clip.status === "published";
  const isAwaitingReview = clip.status === "awaiting_review";
  const isReady = clip.status === "ready";
  const isError = clip.status === "error";
  const isTerminal = isPublished || clip.status === "discarded";
  const canDiscardHere = isAdmin && !isTerminal;

  const { data: stats } = useQuery({
    queryKey: ["clip-yt-stats", clip.id],
    queryFn: () => getClipYouTubeStats(clip.id),
    enabled: isPublished,
    staleTime: 60_000,
  });

  const downloadOptions = [
    {
      id: "clip",
      icon: DownloadIcons.clip,
      label: "Clipe exportado",
      meta: clip.file_size
        ? `MP4 · ${clip.resolution ?? clip.quality} · ${formatFileSizeFromBytes(clip.file_size)}`
        : `MP4 · ${clip.resolution ?? clip.quality}`,
      primary: true,
      onSelect: onDownloadFile,
      disabled: !clip.file_path,
    },
    {
      id: "video",
      icon: DownloadIcons.video,
      label: "Vídeo original",
      meta: video?.source_url
        ? `Link YouTube · ${video.source_url.replace(/^https?:\/\//, "").slice(0, 28)}…`
        : "Link do YouTube",
      onSelect: () => {
        if (video?.source_url) window.open(video.source_url, "_blank");
      },
      disabled: !video?.source_url,
    },
    {
      id: "audio",
      icon: DownloadIcons.audio,
      label: "Apenas áudio",
      meta: "MP3 · em breve",
      disabled: true,
    },
    {
      id: "captions",
      icon: DownloadIcons.captions,
      label: "Legendas",
      meta: "SRT · em breve",
      disabled: true,
    },
    {
      id: "transcript",
      icon: DownloadIcons.transcript,
      label: "Transcrição",
      meta: "TXT · em breve",
      disabled: true,
    },
  ];

  return (
    <div className="mb-[18px] flex flex-col">
      {/* Back link */}
      <Link
        href={`/videos/${clip.video_id}`}
        className="mb-3.5 flex w-fit items-center gap-1.5 text-[12px] text-qs-fg-subtle transition-colors hover:text-qs-fg-muted"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span className="max-w-[420px] truncate">
          Voltar para {video?.title ?? "vídeo"}
        </span>
      </Link>

      {/* Title row */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-[26px] leading-[1.15] tracking-[-0.5px] text-qs-fg">
            {title}
          </h1>
          <p className="mt-1.5 text-[13px] text-qs-fg-subtle">
            Revise o conteúdo gerado e publique no YouTube.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <SaveIndicator status={autosaveStatus} />

          <DownloadMenu options={downloadOptions} />

          {canDiscardHere && (
            <Btn
              size="sm"
              variant="danger"
              icon={<Trash2 className="h-3 w-3" />}
              onClick={onDiscard}
              disabled={discarding}
            >
              {discarding ? tDetail("actions.discarding") : "Descartar"}
            </Btn>
          )}

          {isReady && (
            <Btn
              size="sm"
              variant="primary"
              icon={<Upload className="h-3 w-3" />}
              onClick={onSendForReview}
              disabled={sendingForReview}
            >
              {sendingForReview
                ? tDetail("actions.sendingForReview")
                : tDetail("actions.sendForReview")}
            </Btn>
          )}

          {isAwaitingReview && isAdmin && (
            <Btn
              size="sm"
              variant="primary"
              icon={<Upload className="h-3 w-3" />}
              onClick={onPublish}
              disabled={publishing}
            >
              {publishing ? tDetail("actions.publishing") : "Publicar no YouTube"}
            </Btn>
          )}

          {isError && (
            <Btn
              size="sm"
              variant="primary"
              icon={
                <Loader2
                  className={cn("h-3 w-3", retrying && "animate-spin")}
                />
              }
              onClick={onRetry}
              disabled={retrying}
            >
              {tDetail("actions.retry")}
            </Btn>
          )}

          {isPublished && youtubeUrl && (
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-[30px] items-center gap-1.5 rounded-lg border border-[rgba(255,0,51,0.3)] bg-[rgba(255,0,51,0.08)] px-3 text-[12px] font-semibold text-[#ff6b8a] transition-colors hover:bg-[rgba(255,0,51,0.14)]"
            >
              <Youtube className="h-3 w-3" />
              Ver no YouTube
            </a>
          )}

          {isPublished && stats?.view_count != null && (
            <span className="flex h-[30px] items-center gap-1 rounded-lg border border-qs-line bg-qs-bg-elev-2 px-2 font-mono text-[11px] text-qs-fg-muted">
              {formatCount(stats.view_count)} views
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  const t = useTranslations("clips.review_page");
  if (status === "idle") {
    return (
      <span className="mr-1 flex items-center gap-1.5 text-[11px] text-qs-fg-faint">
        <Check className="h-2.5 w-2.5 text-qs-ok" />
        {t("savedJustNow")}
      </span>
    );
  }
  const dotClass =
    status === "error"
      ? "bg-qs-danger"
      : status === "saving"
        ? "bg-qs-amber animate-pulse"
        : "bg-qs-ok";
  const textClass =
    status === "error" ? "text-qs-danger" : "text-qs-fg-faint";
  const label =
    status === "saving"
      ? t("savingNow")
      : status === "saved"
        ? t("savedJustNow")
        : t("saveError");
  return (
    <span
      className={cn(
        "mr-1 flex items-center gap-1.5 text-[11px]",
        textClass,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotClass)} />
      {label}
    </span>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("pt-BR");
}
