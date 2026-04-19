"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  discardClip,
  getClip,
  getClipReview,
  publishClip,
  retryClip,
} from "@/lib/api/clips";
import { triggerUpload } from "@/lib/api/youtube";
import { getApiErrorCode } from "@/lib/api/client";
import { ClipDraftUpdate, ClipStatus } from "@/lib/types/clip";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useClipAutosave } from "@/lib/hooks/use-clip-autosave";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DiscardConfirmDialog } from "@/components/features/review/discard-confirm-dialog";
import { PublishConfirmDialog } from "@/components/features/review/publish-confirm-dialog";
import { DetailHeader } from "@/components/features/clip-detail/detail-header";
import { EdicaoTab } from "@/components/features/clip-detail/tabs/edicao-tab";
import { ProcessamentoTab } from "@/components/features/clip-detail/tabs/processamento-tab";
import { RevisaoTab } from "@/components/features/clip-detail/tabs/revisao-tab";

type DetailTab = "edicao" | "processamento" | "revisao";

const PROCESSING_STATUSES: ClipStatus[] = [
  "pending",
  "downloading",
  "trimming",
  "uploading",
  "error",
];

function defaultTabFor(status: ClipStatus | undefined): DetailTab {
  if (!status) return "revisao";
  return PROCESSING_STATUSES.includes(status) ? "processamento" : "revisao";
}

function parseTab(value: string | null): DetailTab | null {
  if (value === "edicao" || value === "processamento" || value === "revisao") {
    return value;
  }
  return null;
}

export default function ClipDetailPage({
  params,
}: {
  params: { id: string; clipId: string };
}) {
  const { id: videoId, clipId } = params;
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const t = useTranslations("clips.detail_page");
  const tReview = useTranslations("clips.review_page");

  const tUploadErrors = useTranslations("clips.uploadErrors");
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  const {
    data: clip,
    isLoading: clipLoading,
    isError: clipError,
    error: clipFetchError,
  } = useQuery({
    queryKey: ["clip", clipId],
    queryFn: () => getClip(clipId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status) return false;
      const active: ClipStatus[] = [
        "pending",
        "downloading",
        "trimming",
        "uploading",
      ];
      return active.includes(status) ? 3_000 : false;
    },
    retry: (failureCount, err) => {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status === 404) return false;
      return failureCount < 2;
    },
  });

  const { data: review } = useQuery({
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

  const autosave = useClipAutosave(clipId);

  const urlTab = parseTab(searchParams.get("tab"));
  const [activeTab, setActiveTab] = useState<DetailTab>(
    urlTab ?? defaultTabFor(clip?.status)
  );

  useEffect(() => {
    if (!urlTab && clip?.status) {
      setActiveTab(defaultTabFor(clip.status));
    }
    // We only want to honour the auto-default once, when clip first loads
    // without a user-provided tab. Subsequent status changes should not
    // yank the user around.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clip?.id]);

  function handleTabChange(next: string) {
    const tab = parseTab(next) ?? "revisao";
    setActiveTab(tab);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("tab", tab);
    router.replace(
      `/videos/${videoId}/clip/${clipId}?${newParams.toString()}`,
      { scroll: false }
    );
  }

  const [publishOpen, setPublishOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ClipDraftUpdate | null>(null);

  useEffect(() => {
    if (review && draft === null) {
      setDraft({
        selected_title: review.selected_title ?? "",
        description: review.description ?? "",
        whatsapp_message: review.whatsapp_message ?? "",
      });
    }
  }, [review, draft]);

  const publishMutation = useMutation({
    mutationFn: async () => {
      await autosave.flush();
      return publishClip(clipId);
    },
    onSuccess: () => {
      setPublishOpen(false);
      setPublishError(null);
      toast.success(tReview("publishedBannerTitle"));
      queryClient.invalidateQueries({ queryKey: ["clip", clipId] });
      queryClient.invalidateQueries({ queryKey: ["clip-review", clipId] });
      queryClient.invalidateQueries({ queryKey: ["clips", videoId] });
    },
    onError: (err) => {
      const code = getApiErrorCode(err);
      const key = `publishError.${code}`;
      setPublishError(
        tReview.has(key) ? tReview(key) : tReview("publishError.unknown")
      );
    },
  });

  const discardMutation = useMutation({
    mutationFn: () => discardClip(clipId),
    onSuccess: () => {
      setDiscardOpen(false);
      toast.success(tReview("discardedBannerTitle"));
      queryClient.invalidateQueries({ queryKey: ["clip", clipId] });
      queryClient.invalidateQueries({ queryKey: ["clip-review", clipId] });
      queryClient.invalidateQueries({ queryKey: ["clips", videoId] });
    },
    onError: () => {
      toast.error(t("discardError"));
    },
  });

  const retryMutation = useMutation({
    mutationFn: () => retryClip(clipId),
    onSuccess: () => {
      toast.success(t("retrySuccess"));
      queryClient.invalidateQueries({ queryKey: ["clip", clipId] });
      queryClient.invalidateQueries({ queryKey: ["clip-pipeline", clipId] });
      queryClient.invalidateQueries({ queryKey: ["clips", videoId] });
    },
    onError: () => {
      toast.error(t("retryError"));
    },
  });

  const sendForReviewMutation = useMutation({
    mutationFn: () => triggerUpload({ clip_id: clipId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clip", clipId] });
      queryClient.invalidateQueries({ queryKey: ["clip-review", clipId] });
      queryClient.invalidateQueries({ queryKey: ["clips", videoId] });
      setActiveTab("processamento");
    },
    onError: (err) => {
      const code = getApiErrorCode(err);
      toast.error(
        tUploadErrors.has(code) ? tUploadErrors(code) : tUploadErrors("unknown")
      );
    },
  });

  const draftPayload = useMemo(
    () =>
      draft ?? {
        selected_title: "",
        description: "",
        whatsapp_message: "",
      },
    [draft]
  );

  function handlePublishClick() {
    setPublishError(null);
    setPublishOpen(true);
  }

  function handleDiscardClick() {
    setDiscardOpen(true);
  }

  function handleDraftChange<K extends keyof ClipDraftUpdate>(
    field: K,
    value: ClipDraftUpdate[K]
  ) {
    setDraft((prev) => ({
      ...(prev ?? {
        selected_title: "",
        description: "",
        whatsapp_message: "",
      }),
      [field]: value,
    }));
    autosave.save({ [field]: value } as Record<K, ClipDraftUpdate[K]>);
  }

  if (clipLoading) {
    return <DetailSkeleton />;
  }

  const isNotFound =
    clipError &&
    (clipFetchError as { response?: { status?: number } })?.response
      ?.status === 404;

  if (isNotFound) {
    return <NotFoundState videoId={videoId} />;
  }

  if (!clip) return null;

  return (
    <div className="mx-auto max-w-[960px]">
      <Link
        href={`/videos/${videoId}?tab=clips`}
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

      <DetailHeader
        clip={clip}
        review={review}
        isAdmin={isAdmin}
        onSendForReview={() => sendForReviewMutation.mutate()}
        sendingForReview={sendForReviewMutation.isPending}
        onPublish={handlePublishClick}
        publishing={publishMutation.isPending}
        onDiscard={handleDiscardClick}
        discarding={discardMutation.isPending}
        onRetry={() => retryMutation.mutate()}
        retrying={retryMutation.isPending}
      />

      <div
        role="tablist"
        aria-label={t("tabs.revisao")}
        className="mb-6 flex items-center gap-0.5 border-b border-border"
      >
        {(
          [
            { key: "edicao" as const, label: t("tabs.edicao") },
            { key: "processamento" as const, label: t("tabs.processamento") },
            { key: "revisao" as const, label: t("tabs.revisao") },
          ]
        ).map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => handleTabChange(tab.key)}
              className={cn(
                "relative px-4 py-2.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActive
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-[-1px] left-2 right-2 h-0.5 rounded-full bg-amber-500" />
              )}
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        {activeTab === "edicao" && <EdicaoTab clip={clip} videoId={videoId} />}
        {activeTab === "processamento" && (
          <ProcessamentoTab
            clipId={clipId}
            onRetryDownload={() => retryMutation.mutate()}
            retryingDownload={retryMutation.isPending}
            onRetryUpload={() => sendForReviewMutation.mutate()}
            retryingUpload={sendForReviewMutation.isPending}
          />
        )}
        {activeTab === "revisao" && (
          <RevisaoTab
            clip={clip}
            review={review}
            draft={draftPayload}
            onDraftChange={handleDraftChange}
            autosaveStatus={autosave.status}
            isAdmin={isAdmin}
          />
        )}
      </div>

      <PublishConfirmDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        title={draftPayload.selected_title ?? ""}
        description={draftPayload.description ?? ""}
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

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-[960px] space-y-4">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-8 w-2/3" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-10 w-80 rounded-lg" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

function NotFoundState({ videoId }: { videoId: string }) {
  const t = useTranslations("clips.detail_page.notFound");
  return (
    <div className="mx-auto flex max-w-[520px] flex-col items-center py-24 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <svg
          className="h-6 w-6 text-muted-foreground/60"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      </div>
      <h1 className="mb-2 font-serif text-2xl text-foreground">{t("title")}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{t("description")}</p>
      <Link
        href={`/videos/${videoId}?tab=clips`}
        className="inline-flex h-9 items-center rounded-lg bg-amber-500 px-4 text-xs font-semibold text-stone-950 shadow-sm transition-colors hover:bg-amber-400"
      >
        {t("back")}
      </Link>
    </div>
  );
}
