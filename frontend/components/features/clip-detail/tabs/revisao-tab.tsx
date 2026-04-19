"use client";

import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { regenerateField } from "@/lib/api/clips";
import { Clip, ClipDraftUpdate, ClipReviewData, RegenerateField } from "@/lib/types/clip";
import { SaveStatus } from "@/lib/hooks/use-clip-autosave";
import { TitleSelector } from "@/components/features/review/title-selector";
import { DescriptionEditor } from "@/components/features/review/description-editor";
import { WhatsappEditor } from "@/components/features/review/whatsapp-editor";
import { YouTubeEmbedPlayer } from "@/components/features/review/youtube-embed-player";
import { LocalVideoPlayer } from "@/components/features/review/local-video-player";
import { PublishedBanner } from "@/components/features/review/published-banner";
import { formatTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface RevisaoTabProps {
  clip: Clip;
  review: ClipReviewData | undefined;
  draft: ClipDraftUpdate;
  onDraftChange: <K extends keyof ClipDraftUpdate>(
    field: K,
    value: ClipDraftUpdate[K]
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
      if (status === 501) {
        toast.error(t("aiNotAvailable"));
      } else {
        toast.error(t("publishError.unknown"));
      }
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
    <div className="space-y-5">
      {clip.status === "published" && (
        <PublishedBanner youtubeUrl={youtubeUrl} />
      )}
      {clip.status === "discarded" && (
        <div className="rounded-xl border border-stone-300 bg-stone-50 p-3 text-sm text-stone-700 dark:border-stone-600 dark:bg-stone-900/40 dark:text-stone-300">
          <p className="font-semibold">{t("discardedBannerTitle")}</p>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            {t("discardedBannerDescription")}
          </p>
        </div>
      )}
      {!isAdmin && isAwaitingReview && (
        <div className="rounded-xl border border-amber-300/50 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          {t("publishDisabledByRole")}
        </div>
      )}

      <div className="flex items-center justify-end">
        <SaveIndicator status={autosaveStatus} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
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

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          {youtubeVideoId ? (
            <YouTubeEmbedPlayer videoId={youtubeVideoId} title={titleValue} />
          ) : hasLocalFile ? (
            <LocalVideoPlayer clipId={clip.id} />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-xl border border-border bg-muted text-sm text-muted-foreground">
              {t("loading")}
            </div>
          )}

          <DetailsCard clip={clip} review={review} />
        </aside>
      </div>
    </div>
  );
}

function DetailsCard({
  clip,
  review,
}: {
  clip: Clip;
  review: ClipReviewData | undefined;
}) {
  const t = useTranslations("clips.review_page");

  const visibility =
    clip.status === "published"
      ? t("visibilityPublic")
      : t("visibilityUnlisted");
  const visibilityColor =
    clip.status === "published"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-muted-foreground";

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="divide-y divide-border text-xs">
        <DetailRow label={t("detailsVisibility")}>
          <span className={cn("font-medium", visibilityColor)}>{visibility}</span>
        </DetailRow>

        <DetailRow label={t("detailsTrecho")}>
          <span className="font-mono tabular-nums">
            {formatTime(clip.start_time)} — {formatTime(clip.end_time)}
          </span>
        </DetailRow>

        {clip.duration != null && (
          <DetailRow label={t("detailsDuration")}>
            <span className="font-mono tabular-nums">
              {formatTime(clip.duration)}
            </span>
          </DetailRow>
        )}

        {review?.youtube_url && (
          <DetailRow label={t("detailsYoutubeLink")}>
            <a
              href={review.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-amber-600 hover:underline dark:text-amber-400"
            >
              {review.youtube_url.replace(/^https?:\/\//, "")}
            </a>
          </DetailRow>
        )}

        {clip.published_at && (
          <DetailRow label={t("detailsPublishedAt")}>
            <span>
              {new Date(clip.published_at).toLocaleString("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </span>
          </DetailRow>
        )}
      </div>
    </div>
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
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 max-w-[60%] truncate text-right text-foreground">
        {children}
      </span>
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  const t = useTranslations("clips.review_page");
  if (status === "idle") return null;

  const dotClass =
    status === "error"
      ? "bg-red-500"
      : status === "saving"
      ? "bg-amber-500 animate-pulse"
      : "bg-emerald-500";
  const textClass =
    status === "error" ? "text-red-600" : "text-muted-foreground";
  const label =
    status === "saving"
      ? t("savingNow")
      : status === "saved"
      ? t("savedJustNow")
      : t("saveError");

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs", textClass)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dotClass)} />
      {label}
    </span>
  );
}
