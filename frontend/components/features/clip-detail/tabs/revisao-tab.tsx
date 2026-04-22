"use client";

import { useTranslations } from "next-intl";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye } from "lucide-react";
import { regenerateField } from "@/lib/api/clips";
import { getVideo } from "@/lib/api/videos";
import {
  Clip,
  ClipDraftUpdate,
  ClipReviewData,
  RegenerateField,
} from "@/lib/types/clip";
import { SaveStatus } from "@/lib/hooks/use-clip-autosave";
import { TitleSelector } from "@/components/features/review/title-selector";
import { DescriptionEditor } from "@/components/features/review/description-editor";
import { WhatsappEditor } from "@/components/features/review/whatsapp-editor";
import { YouTubeEmbedPlayer } from "@/components/features/review/youtube-embed-player";
import { LocalVideoPlayer } from "@/components/features/review/local-video-player";
import { PublishedBanner } from "@/components/features/review/published-banner";
import { StatusBadge } from "@/components/features/ui/status-badge";
import { ThumbPlaceholder } from "@/components/features/ui/thumb-placeholder";
import { formatTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface RevisaoTabProps {
  clip: Clip;
  review: ClipReviewData | undefined;
  draft: ClipDraftUpdate;
  onDraftChange: <K extends keyof ClipDraftUpdate>(
    field: K,
    value: ClipDraftUpdate[K],
  ) => void;
  autosaveStatus: SaveStatus;
  isAdmin: boolean;
}

export function RevisaoTab({
  clip,
  review,
  draft,
  onDraftChange,
  autosaveStatus,
  isAdmin,
}: RevisaoTabProps) {
  const t = useTranslations("clips.review_page");

  const regenerateMutation = useMutation({
    mutationFn: (field: RegenerateField) => regenerateField(clip.id, field),
    onError: (err) => {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status === 501) toast.error(t("aiNotAvailable"));
      else toast.error(t("publishError.unknown"));
    },
  });

  const isReadOnly = clip.status === "published" || clip.status === "discarded";
  const isAwaitingReview = clip.status === "awaiting_review";
  const youtubeVideoId = review?.youtube_video_id ?? null;
  const youtubeUrl = review?.youtube_url ?? null;
  const hasLocalFile = !!clip.file_path;

  const titleValue = draft.selected_title ?? "";
  const descriptionValue = draft.description ?? "";
  const whatsappValue = draft.whatsapp_message ?? "";

  return (
    <div className="flex flex-col gap-3.5">
      {clip.status === "published" && (
        <PublishedBanner youtubeUrl={youtubeUrl} />
      )}
      {clip.status === "discarded" && (
        <div className="rounded-xl border border-qs-line bg-qs-bg-elev p-3 text-[13px] text-qs-fg-muted">
          <p className="font-semibold">{t("discardedBannerTitle")}</p>
          <p className="text-[11px] text-qs-fg-faint">
            {t("discardedBannerDescription")}
          </p>
        </div>
      )}
      {!isAdmin && isAwaitingReview && (
        <div className="rounded-xl border border-[rgba(245,158,11,0.28)] bg-[rgba(245,158,11,0.06)] p-3 text-[11px] text-qs-amber-bright">
          {t("publishDisabledByRole")}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
        {/* LEFT — Preview + meta */}
        <div className="flex flex-col gap-3.5">
          {youtubeVideoId ? (
            <YouTubeEmbedPlayer videoId={youtubeVideoId} title={titleValue} />
          ) : hasLocalFile ? (
            <LocalVideoPlayer clipId={clip.id} />
          ) : (
            <PreviewPlaceholder clip={clip} />
          )}

          <DetailsCard
            clip={clip}
            review={review}
            autosaveStatus={autosaveStatus}
          />

          <SourceCard videoId={clip.video_id} />
        </div>

        {/* RIGHT — Editors */}
        <div className="flex min-w-0 flex-col gap-3.5">
          <TitleSelector
            generated={review?.generated_titles ?? null}
            value={titleValue}
            onChange={(v) => onDraftChange("selected_title", v)}
            onRegenerate={() => regenerateMutation.mutate("titles")}
            disabled={regenerateMutation.isPending}
            readOnly={isReadOnly}
          />
          <DescriptionEditor
            generated={review?.generated_description ?? null}
            value={descriptionValue}
            onChange={(v) => onDraftChange("description", v)}
            onRegenerate={() => regenerateMutation.mutate("description")}
            disabled={regenerateMutation.isPending}
            readOnly={isReadOnly}
          />
          <WhatsappEditor
            value={whatsappValue}
            onChange={(v) => onDraftChange("whatsapp_message", v)}
            onRegenerate={() => regenerateMutation.mutate("whatsapp_message")}
            copyEnabled={clip.status === "published"}
            disabled={regenerateMutation.isPending}
            readOnly={isReadOnly}
          />
        </div>
      </div>
    </div>
  );
}

function PreviewPlaceholder({ clip }: { clip: Clip }) {
  const duration = clip.duration ?? clip.end_time - clip.start_time;
  return (
    <div className="relative aspect-video overflow-hidden rounded-xl border border-qs-line bg-black">
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, #1a1a1a 0 6px, #0a0a0a 6px 12px)",
        }}
      >
        <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white/10 backdrop-blur-[10px]">
          <svg
            className="ml-0.5 h-[18px] w-[18px] text-qs-fg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-3">
        <div className="h-[2px] overflow-hidden rounded-[2px] bg-white/20">
          <div className="h-full w-[34%] bg-qs-amber" />
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[9px] text-white/80">
          <span>{formatTime(Math.floor(duration * 0.34))}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}

function DetailsCard({
  clip,
  review,
  autosaveStatus,
}: {
  clip: Clip;
  review: ClipReviewData | undefined;
  autosaveStatus: SaveStatus;
}) {
  const t = useTranslations("clips.review_page");
  const visibility =
    clip.status === "published"
      ? t("visibilityPublic")
      : t("visibilityUnlisted");
  const duration = clip.duration ?? clip.end_time - clip.start_time;
  const statusLabel = labelForClipStatus(clip.status);

  return (
    <div className="overflow-hidden rounded-xl border border-qs-line bg-qs-bg-elev">
      <div className="flex items-center justify-between border-b border-qs-line px-4 py-2.5">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[1px] text-qs-fg-subtle">
          Detalhes
        </span>
        <SaveIndicator status={autosaveStatus} />
      </div>
      <DetailRow label="Status">
        <StatusBadge
          state={clip.status}
          label={statusLabel}
        />
      </DetailRow>
      <DetailRow label="Visibilidade">
        <span className="flex items-center gap-1.5 text-[12px] text-qs-fg">
          <Eye className="h-3 w-3" />
          {visibility}
        </span>
      </DetailRow>
      <DetailRow label="Trecho">
        <span className="font-mono text-[12px] tabular-nums text-qs-fg">
          {formatTime(clip.start_time)} → {formatTime(clip.end_time)}
        </span>
      </DetailRow>
      <DetailRow label="Duração" last={!review?.youtube_url && !clip.published_at}>
        <span className="font-mono text-[12px] tabular-nums text-qs-fg">
          {formatTime(duration)}
        </span>
      </DetailRow>
      {review?.youtube_url && (
        <DetailRow label="Link do YouTube" last={!clip.published_at}>
          <a
            href={review.youtube_url}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate font-mono text-[12px] text-qs-amber-bright hover:underline"
          >
            {review.youtube_url.replace(/^https?:\/\//, "")}
          </a>
        </DetailRow>
      )}
      {clip.published_at && (
        <DetailRow label="Publicado em" last>
          <span className="text-[12px] text-qs-fg">
            {new Date(clip.published_at).toLocaleString("pt-BR", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </span>
        </DetailRow>
      )}
    </div>
  );
}

function SourceCard({ videoId }: { videoId: string }) {
  const { data: video } = useQuery({
    queryKey: ["video", videoId],
    queryFn: () => getVideo(videoId),
    staleTime: 60_000,
  });

  return (
    <div className="rounded-xl border border-qs-line bg-qs-bg-elev p-3.5">
      <div className="flex items-center gap-2.5">
        <ThumbPlaceholder
          width={60}
          height={34}
          imageUrl={video?.thumbnail_url ?? undefined}
        />
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 text-[11px] text-qs-fg-faint">
            Vídeo de origem
          </div>
          <div className="truncate text-[12px] font-medium text-qs-fg">
            {video?.title ?? "Carregando…"}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-2.5",
        !last && "border-b border-qs-line/50",
      )}
    >
      <span className="text-[11px] text-qs-fg-faint">{label}</span>
      <span className="min-w-0 max-w-[60%] text-right">{children}</span>
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  const t = useTranslations("clips.review_page");
  if (status === "idle") return null;

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
        "inline-flex items-center gap-1.5 text-[10px]",
        textClass,
      )}
    >
      <span className={cn("h-1 w-1 rounded-full", dotClass)} />
      {label}
    </span>
  );
}

function labelForClipStatus(status: Clip["status"]): string {
  const map: Record<Clip["status"], string> = {
    pending: "Aguardando",
    downloading: "Baixando",
    trimming: "Cortando",
    ready: "Pronto",
    uploading: "Enviando",
    awaiting_review: "Em revisão",
    published: "Publicado",
    discarded: "Descartado",
    error: "Erro",
  };
  return map[status];
}
