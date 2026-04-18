"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  discardClip,
  getClipReview,
  publishClip,
  regenerateField,
} from "@/lib/api/clips";
import { getApiErrorCode } from "@/lib/api/client";
import { ClipReviewData, RegenerateField } from "@/lib/types/clip";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useClipAutosave } from "@/lib/hooks/use-clip-autosave";
import { ClipStatusBadge } from "@/components/features/clips/clip-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { YouTubeEmbedPlayer } from "./youtube-embed-player";
import { TitleSelector } from "./title-selector";
import { DescriptionEditor } from "./description-editor";
import { WhatsappEditor } from "./whatsapp-editor";
import { PublishConfirmDialog } from "./publish-confirm-dialog";
import { DiscardConfirmDialog } from "./discard-confirm-dialog";
import { PublishedBanner } from "./published-banner";

const TITLE_MAX = 100;
const DESCRIPTION_MAX = 5000;

interface ReviewLayoutProps {
  videoId: string;
  clipId: string;
}

interface DraftState {
  selected_title: string;
  description: string;
  whatsapp_message: string;
}

function buildInitialDraft(data: ClipReviewData): DraftState {
  return {
    selected_title: data.selected_title ?? "",
    description: data.description ?? "",
    whatsapp_message: data.whatsapp_message ?? "",
  };
}

export function ReviewLayout({ videoId, clipId }: ReviewLayoutProps) {
  const t = useTranslations("clips.review_page");
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["clip-review", clipId],
    queryFn: () => getClipReview(clipId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      const hasGeneratedTitles = !!query.state.data?.generated_titles?.length;
      if (!status) return false;
      if (status === "awaiting_review" && !hasGeneratedTitles) return 5_000;
      return false;
    },
  });

  const [draft, setDraft] = useState<DraftState | null>(null);
  const autosave = useClipAutosave(clipId);

  useEffect(() => {
    if (data && draft === null) {
      setDraft(buildInitialDraft(data));
    }
  }, [data, draft]);

  const isReadOnly =
    data?.status === "published" || data?.status === "discarded";

  const [publishOpen, setPublishOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const publishMutation = useMutation({
    mutationFn: async () => {
      await autosave.flush();
      return publishClip(clipId);
    },
    onSuccess: () => {
      setPublishOpen(false);
      setPublishError(null);
      toast.success(t("publishedBannerTitle"));
      queryClient.invalidateQueries({ queryKey: ["clip-review", clipId] });
      queryClient.invalidateQueries({ queryKey: ["clips", videoId] });
    },
    onError: (err) => {
      const code = getApiErrorCode(err);
      const errorKey = `publishError.${code}` as const;
      setPublishError(
        (t.has(errorKey) ? t(errorKey) : t("publishError.unknown")) as string
      );
    },
  });

  const discardMutation = useMutation({
    mutationFn: () => discardClip(clipId),
    onSuccess: () => {
      setDiscardOpen(false);
      toast.success(t("discardedBannerTitle"));
      queryClient.invalidateQueries({ queryKey: ["clip-review", clipId] });
      queryClient.invalidateQueries({ queryKey: ["clips", videoId] });
      router.push(`/videos/${videoId}`);
    },
    onError: () => {
      toast.error(t("publishError.unknown"));
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: (field: RegenerateField) => regenerateField(clipId, field),
    onError: (err) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 501) {
        toast.error(t("aiNotAvailable"));
      } else {
        toast.error(t("publishError.unknown"));
      }
    },
  });

  const draftState = draft ?? {
    selected_title: "",
    description: "",
    whatsapp_message: "",
  };

  const hasTitle = draftState.selected_title.trim().length > 0;
  const hasDescription = draftState.description.trim().length > 0;
  const withinLimits =
    draftState.selected_title.length <= TITLE_MAX &&
    draftState.description.length <= DESCRIPTION_MAX;
  const draftComplete = hasTitle && hasDescription && withinLimits;

  const canPublish =
    !!data && data.status === "awaiting_review" && isAdmin && draftComplete;
  const canDiscard =
    !!data && data.status === "awaiting_review" && isAdmin;
  const isAwaitingReview = data?.status === "awaiting_review";

  const publishTooltip = useMemo(() => {
    if (!isAdmin) return t("publishDisabledByRole");
    if (!draftComplete) return t("publishDisabledByDraft");
    return "";
  }, [isAdmin, draftComplete, t]);

  function updateField<K extends keyof DraftState>(
    field: K,
    value: DraftState[K]
  ) {
    if (!draft) return;
    const next = { ...draft, [field]: value };
    setDraft(next);
    autosave.save({ [field]: value } as Record<K, DraftState[K]>);
  }

  if (isLoading || !data || !draft) {
    return <ReviewSkeleton />;
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-[960px]">
        <p className="text-sm text-red-600">{t("loadError")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[960px]">
      {/* Back */}
      <Link
        href={`/videos/${videoId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        {t("back")}
      </Link>

      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-2xl leading-tight text-foreground">
            {t("title")}
          </h1>
          <ClipStatusBadge status={data.status} />
          <SaveIndicator status={autosave.status} />
        </div>

        {isAwaitingReview && (
          <div className="flex items-center gap-2">
            {canDiscard && (
              <button
                type="button"
                onClick={() => setDiscardOpen(true)}
                className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-red-400/50 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/10 dark:hover:text-red-300"
              >
                {t("discardButton")}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setPublishError(null);
                setPublishOpen(true);
              }}
              disabled={!canPublish || publishMutation.isPending}
              title={publishTooltip}
              className="inline-flex h-9 items-center rounded-lg bg-amber-500 px-4 text-xs font-semibold text-stone-950 shadow-sm transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
            >
              {publishMutation.isPending ? t("publishing") : t("publishButton")}
            </button>
          </div>
        )}
      </div>

      {/* Banners */}
      {data.status === "published" && (
        <div className="mb-5">
          <PublishedBanner youtubeUrl={data.youtube_url} />
        </div>
      )}
      {data.status === "discarded" && (
        <div className="mb-5 rounded-xl border border-stone-300 bg-stone-50 p-3 text-sm text-stone-700 dark:border-stone-600 dark:bg-stone-900/40 dark:text-stone-300">
          <p className="font-semibold">{t("discardedBannerTitle")}</p>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            {t("discardedBannerDescription")}
          </p>
        </div>
      )}
      {!isAdmin && isAwaitingReview && (
        <div className="mb-5 rounded-xl border border-amber-300/50 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          {t("publishDisabledByRole")}
        </div>
      )}

      {/* Two-column grid */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Center — editors */}
        <div className="min-w-0 space-y-5">
          <TitleSelector
            generated={data.generated_titles}
            value={draftState.selected_title}
            onChange={(v) => updateField("selected_title", v)}
            onRegenerate={() => regenerateMutation.mutate("titles")}
            disabled={regenerateMutation.isPending}
            readOnly={isReadOnly}
          />

          <DescriptionEditor
            generated={data.generated_description}
            value={draftState.description}
            onChange={(v) => updateField("description", v)}
            onRegenerate={() => regenerateMutation.mutate("description")}
            disabled={regenerateMutation.isPending}
            readOnly={isReadOnly}
          />

          <WhatsappEditor
            value={draftState.whatsapp_message}
            onChange={(v) => updateField("whatsapp_message", v)}
            onRegenerate={() => regenerateMutation.mutate("whatsapp_message")}
            copyEnabled={data.status === "published"}
            disabled={regenerateMutation.isPending}
            readOnly={isReadOnly}
          />
        </div>

        {/* Right — player + details */}
        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          {data.youtube_video_id ? (
            <YouTubeEmbedPlayer
              videoId={data.youtube_video_id}
              title={draftState.selected_title}
            />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-xl border border-border bg-muted text-sm text-muted-foreground">
              {t("loading")}
            </div>
          )}

          <DetailsCard data={data} t={t} />
        </aside>
      </div>

      <PublishConfirmDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        title={draftState.selected_title}
        description={draftState.description}
        publishing={publishMutation.isPending}
        errorMessage={publishError}
        onConfirm={() => publishMutation.mutate()}
      />

      <DiscardConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        discarding={discardMutation.isPending}
        onConfirm={() => discardMutation.mutate()}
      />
    </div>
  );
}

function DetailsCard({
  data,
  t,
}: {
  data: ClipReviewData;
  t: ReturnType<typeof useTranslations>;
}) {
  const visibility =
    data.status === "published"
      ? t("visibilityPublic")
      : t("visibilityUnlisted");
  const visibilityColor =
    data.status === "published"
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
            {formatTime(data.start_time)} — {formatTime(data.end_time)}
          </span>
        </DetailRow>

        {data.duration && (
          <DetailRow label={t("detailsDuration")}>
            <span className="font-mono tabular-nums">
              {formatTime(data.duration)}
            </span>
          </DetailRow>
        )}

        {data.youtube_url && (
          <DetailRow label={t("detailsYoutubeLink")}>
            <a
              href={data.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-amber-600 hover:underline dark:text-amber-400"
            >
              {data.youtube_url.replace(/^https?:\/\//, "")}
            </a>
          </DetailRow>
        )}

        {data.published_at && (
          <DetailRow label={t("detailsPublishedAt")}>
            <span>
              {new Date(data.published_at).toLocaleString("pt-BR", {
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

function SaveIndicator({
  status,
}: {
  status: "idle" | "saving" | "saved" | "error";
}) {
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

function ReviewSkeleton() {
  return (
    <div className="mx-auto max-w-[960px] space-y-4">
      <Skeleton className="h-5 w-24" />
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="aspect-video rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
