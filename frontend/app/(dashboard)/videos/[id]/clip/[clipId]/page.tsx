"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  discardClip,
  getClip,
  getClipPipeline,
  getClipProgress,
  getClipReview,
  getClipStreamUrl,
  publishClip,
  retryClip,
} from "@/lib/api/clips";
import { triggerUpload } from "@/lib/api/youtube";
import { getApiErrorCode } from "@/lib/api/client";
import {
  ClipDraftUpdate,
  ClipPipeline,
  ClipStatus,
} from "@/lib/types/clip";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useClipAutosave } from "@/lib/hooks/use-clip-autosave";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DiscardConfirmDialog } from "@/components/features/review/discard-confirm-dialog";
import { PublishConfirmDialog } from "@/components/features/review/publish-confirm-dialog";
import { DetailHeader } from "@/components/features/clip-detail/detail-header";
import { ProcessamentoTab } from "@/components/features/clip-detail/tabs/processamento-tab";
import { RevisaoTab } from "@/components/features/clip-detail/tabs/revisao-tab";
import { PipelineStrip } from "@/components/features/ui/pipeline-strip";
import { PageTopbar } from "@/components/features/ui/page-topbar";
import type { StatusState } from "@/components/features/ui/status-badge";

const PROCESSING_STATUSES: ClipStatus[] = [
  "pending",
  "downloading",
  "trimming",
  "uploading",
  "error",
];

export default function ClipDetailPage({
  params,
}: {
  params: { id: string; clipId: string };
}) {
  const { id: videoId, clipId } = params;
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

  const [publishOpen, setPublishOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [pipelineOpen, setPipelineOpen] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ClipDraftUpdate | null>(null);

  // Honour ?tab=processamento for backwards compatibility (opens dialog).
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "processamento" && clip?.status) {
      if (PROCESSING_STATUSES.includes(clip.status)) setPipelineOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clip?.id]);

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
      queryClient.invalidateQueries({ queryKey: ["clips"] });
    },
    onError: (err) => {
      const code = getApiErrorCode(err);
      const key = `publishError.${code}`;
      setPublishError(
        tReview.has(key) ? tReview(key) : tReview("publishError.unknown"),
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
      queryClient.invalidateQueries({ queryKey: ["clips"] });
    },
    onError: () => toast.error(t("discardError")),
  });

  const retryMutation = useMutation({
    mutationFn: () => retryClip(clipId),
    onSuccess: () => {
      toast.success(t("retrySuccess"));
      queryClient.invalidateQueries({ queryKey: ["clip", clipId] });
      queryClient.invalidateQueries({ queryKey: ["clip-pipeline", clipId] });
      queryClient.invalidateQueries({ queryKey: ["clips"] });
    },
    onError: () => toast.error(t("retryError")),
  });

  const sendForReviewMutation = useMutation({
    mutationFn: () => triggerUpload({ clip_id: clipId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clip", clipId] });
      queryClient.invalidateQueries({ queryKey: ["clip-review", clipId] });
      queryClient.invalidateQueries({ queryKey: ["clips"] });
      setPipelineOpen(true);
    },
    onError: (err) => {
      const code = getApiErrorCode(err);
      toast.error(
        tUploadErrors.has(code)
          ? tUploadErrors(code)
          : tUploadErrors("unknown"),
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
    [draft],
  );

  async function handleDownloadFile() {
    if (!clip?.file_path) return;
    try {
      const url = await getClipStreamUrl(clipId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error(tUploadErrors("unknown"));
    }
  }

  function handleDraftChange<K extends keyof ClipDraftUpdate>(
    field: K,
    value: ClipDraftUpdate[K],
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

  if (clipLoading) return <DetailSkeleton />;

  const isNotFound =
    clipError &&
    (clipFetchError as { response?: { status?: number } })?.response
      ?.status === 404;

  if (isNotFound) return <NotFoundState videoId={videoId} />;
  if (!clip) return null;

  const showPipelineStrip = PROCESSING_STATUSES.includes(clip.status);

  return (
    <>
      <PageTopbar title="Revisão do Clip" />
    <div>
      <DetailHeader
        clip={clip}
        review={review}
        isAdmin={isAdmin}
        autosaveStatus={autosave.status}
        onSendForReview={() => sendForReviewMutation.mutate()}
        sendingForReview={sendForReviewMutation.isPending}
        onPublish={() => {
          setPublishError(null);
          setPublishOpen(true);
        }}
        publishing={publishMutation.isPending}
        onDiscard={() => setDiscardOpen(true)}
        discarding={discardMutation.isPending}
        onRetry={() => retryMutation.mutate()}
        retrying={retryMutation.isPending}
        onDownloadFile={handleDownloadFile}
      />

      {showPipelineStrip && (
        <div className="mb-3.5">
          <ClipPipelineStrip
            clipId={clipId}
            status={clip.status as StatusState}
            onOpenPipeline={() => setPipelineOpen(true)}
          />
        </div>
      )}

      <RevisaoTab
        clip={clip}
        review={review}
        draft={draftPayload}
        onDraftChange={handleDraftChange}
        autosaveStatus={autosave.status}
        isAdmin={isAdmin}
      />

      <Dialog open={pipelineOpen} onOpenChange={setPipelineOpen}>
        <DialogContent className="max-w-[720px] border-qs-line bg-qs-bg-elev">
          <DialogHeader>
            <DialogTitle className="font-serif text-[22px] tracking-[-0.3px] text-qs-fg">
              Pipeline de processamento
            </DialogTitle>
            <DialogDescription className="text-[12px] text-qs-fg-subtle">
              Acompanhe Download, Corte e Upload para o YouTube.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <ProcessamentoTab
              clipId={clipId}
              onRetryDownload={() => retryMutation.mutate()}
              retryingDownload={retryMutation.isPending}
              onRetryUpload={() => sendForReviewMutation.mutate()}
              retryingUpload={sendForReviewMutation.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>

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
    </>
  );
}

function ClipPipelineStrip({
  clipId,
  status,
  onOpenPipeline,
}: {
  clipId: string;
  status: StatusState;
  onOpenPipeline: () => void;
}) {
  const { data: pipeline } = useQuery<ClipPipeline>({
    queryKey: ["clip-pipeline", clipId],
    queryFn: () => getClipPipeline(clipId),
    refetchInterval: 3000,
  });
  const { data: progress } = useQuery({
    queryKey: ["clip-progress", clipId],
    queryFn: () => getClipProgress(clipId),
    refetchInterval: 3000,
  });

  const statusLabel =
    status === "downloading"
      ? "Baixando"
      : status === "trimming"
        ? "Cortando"
        : status === "uploading"
          ? "Enviando"
          : status === "pending"
            ? "Aguardando"
            : "Erro";

  const stages = {
    download: mapStage(pipeline?.download.status, pipeline?.download.percent),
    trim: mapStage(pipeline?.trim.status, pipeline?.trim.percent),
    upload: mapStage(pipeline?.upload.status, pipeline?.upload.percent),
  };

  return (
    <PipelineStrip
      status={status}
      statusLabel={statusLabel}
      stages={stages}
      etaLabel={progress?.speed ?? null}
      onOpenPipeline={onOpenPipeline}
    />
  );
}

function mapStage(
  s: "pending" | "running" | "completed" | "error" | undefined,
  percent?: number | null,
): { state: "done" | "active" | "pending"; progress?: number } {
  if (s === "completed") return { state: "done" };
  if (s === "running")
    return {
      state: "active",
      progress: percent != null ? Math.round(percent) : undefined,
    };
  return { state: "pending" };
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-64" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-[360px] rounded-xl" />
    </div>
  );
}

function NotFoundState({ videoId }: { videoId: string }) {
  const t = useTranslations("clips.detail_page.notFound");
  return (
    <div className="mx-auto flex max-w-[520px] flex-col items-center py-24 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-qs-bg-elev-2 text-qs-fg-subtle">
        <svg
          className="h-6 w-6"
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
      <h1 className="mb-2 font-serif text-[24px] text-qs-fg">{t("title")}</h1>
      <p className="mb-6 text-[13px] text-qs-fg-subtle">{t("description")}</p>
      <Link
        href={`/videos/${videoId}?tab=clips`}
        className="inline-flex h-9 items-center rounded-lg bg-qs-amber px-4 text-[12px] font-semibold text-[#0c0a09] shadow-[0_4px_14px_rgba(245,158,11,0.25)] transition-colors hover:bg-qs-amber-bright"
      >
        {t("back")}
      </Link>
    </div>
  );
}
