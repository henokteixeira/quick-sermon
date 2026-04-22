"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Copy,
  Download,
  FileVideo,
  Loader2,
  RefreshCw,
  Scissors,
  Sparkles,
  Trash2,
  Upload,
  Youtube,
} from "lucide-react";
import { toast } from "sonner";
import {
  listClips,
  deleteClip,
  getClipProgress,
  getClipStreamUrl,
  retryClip,
} from "@/lib/api/clips";
import { getVideo } from "@/lib/api/videos";
import { triggerUpload } from "@/lib/api/youtube";
import { getApiErrorCode } from "@/lib/api/client";
import { Clip, ClipProgress, ClipStatus } from "@/lib/types/clip";
import {
  formatTime,
  formatFileSizeFromBytes,
  formatDuration,
} from "@/lib/formatters";
import { Btn } from "@/components/features/ui/btn";
import { ClipsMap } from "@/components/features/ui/clips-map";
import { FilterChip } from "@/components/features/ui/filter-chip";
import { StatusBadge, type StatusState } from "@/components/features/ui/status-badge";
import { ThumbPlaceholder } from "@/components/features/ui/thumb-placeholder";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type FilterValue = "all" | "published" | "review" | "ready" | "processing" | "discarded";

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "published", label: "Publicados" },
  { value: "review", label: "Em revisão" },
  { value: "ready", label: "Prontos" },
  { value: "processing", label: "Processando" },
  { value: "discarded", label: "Descartados" },
];

const ACTIVE_STATUSES: ClipStatus[] = [
  "pending",
  "downloading",
  "trimming",
  "uploading",
];

function matchesFilter(status: ClipStatus, filter: FilterValue): boolean {
  if (filter === "all") return status !== "discarded";
  if (filter === "published") return status === "published";
  if (filter === "ready") return status === "ready";
  if (filter === "processing") return ACTIVE_STATUSES.includes(status);
  if (filter === "review") return status === "awaiting_review";
  if (filter === "discarded") return status === "discarded";
  return true;
}

function useEta(percent: number, startedAt: number | null) {
  const now = Date.now() / 1000;
  if (!startedAt || percent <= 0) return { elapsed: 0, eta: null };
  const elapsed = Math.max(0, now - startedAt);
  const rate = percent / elapsed;
  const remaining = rate > 0 ? (100 - percent) / rate : null;
  return {
    elapsed: Math.round(elapsed),
    eta: remaining ? Math.round(remaining) : null,
  };
}

function ClipProgressBar({ clipId }: { clipId: string }) {
  const t = useTranslations("clips.progress");
  const { data: progress } = useQuery<ClipProgress>({
    queryKey: ["clip-progress", clipId],
    queryFn: () => getClipProgress(clipId),
    refetchInterval: 3000,
  });

  const { elapsed, eta } = useEta(
    progress?.percent ?? 0,
    progress?.started_at ?? null,
  );

  if (!progress || progress.percent === 0) {
    return (
      <div className="mt-2.5">
        <div className="h-1 overflow-hidden rounded-full bg-qs-bg-elev-2">
          <div className="h-full w-full animate-pulse rounded-full bg-qs-amber/40" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2.5 flex items-center gap-3">
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-qs-bg-elev-2">
        <div
          className="h-full rounded-full bg-qs-amber transition-all duration-500"
          style={{ width: `${Math.min(progress.percent, 100)}%` }}
        />
      </div>
      <span className="font-mono text-[10px] text-qs-amber-bright">
        {progress.percent.toFixed(0)}%
      </span>
      {eta !== null && eta > 0 && (
        <span className="font-mono text-[10px] text-qs-fg-faint">
          ETA {formatDuration(eta)}
        </span>
      )}
      {elapsed > 0 && eta === null && (
        <span className="font-mono text-[10px] text-qs-fg-faint">
          {t("remaining")} ~
        </span>
      )}
    </div>
  );
}

function ClipItem({
  clip,
  videoId,
  thumbnailUrl,
}: {
  clip: Clip;
  videoId: string;
  thumbnailUrl?: string;
}) {
  const t = useTranslations("clips");
  const tStatus = useTranslations("clips.status");
  const tErrors = useTranslations("clips.errors");
  const tUploadErrors = useTranslations("clips.uploadErrors");
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const clipUrl = `/videos/${videoId}/clip/${clip.id}`;
  const resolvedThumbnail = clip.video_thumbnail_url ?? thumbnailUrl;

  const { data: clipStreamUrl } = useQuery({
    queryKey: ["clip-stream-url", clip.id],
    queryFn: () => getClipStreamUrl(clip.id),
    enabled: !resolvedThumbnail && !!clip.file_path,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const isActive = ACTIVE_STATUSES.includes(clip.status);
  const isReady = clip.status === "ready";
  const isPublished = clip.status === "published";
  const isAwaitingReview = clip.status === "awaiting_review";
  const isDiscarded = clip.status === "discarded";
  const isError = clip.status === "error";
  const canDownloadFile = isReady || isAwaitingReview || isPublished;
  const canDelete =
    !isDiscarded && !isAwaitingReview && !isPublished && !isActive;

  const deleteMutation = useMutation({
    mutationFn: () => deleteClip(clip.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clips"] });
      setDeleteOpen(false);
    },
  });

  const sendForReviewMutation = useMutation({
    mutationFn: () => triggerUpload({ clip_id: clip.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clips"] });
      queryClient.invalidateQueries({ queryKey: ["clip", clip.id] });
      toast.success("Clip enviado pra revisão");
    },
    onError: (err) => {
      const code = getApiErrorCode(err);
      toast.error(
        tUploadErrors.has(code) ? tUploadErrors(code) : tUploadErrors("unknown"),
      );
    },
  });

  const retryMutation = useMutation({
    mutationFn: () => retryClip(clip.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clips"] });
      toast.success("Processamento reiniciado");
    },
    onError: () => toast.error("Falha ao reiniciar o processamento"),
  });

  async function handleDownload(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      const url = await getClipStreamUrl(clip.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setDownloadError(t("uploadErrors.unknown"));
    }
  }

  async function handleCopyLink(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      const url = await getClipStreamUrl(clip.id);
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado");
    } catch {
      toast.error("Falha ao copiar");
    }
  }

  const title =
    clip.selected_title?.trim() ||
    `Clip ${formatTime(clip.start_time)}–${formatTime(clip.end_time)}`;

  const meta: React.ReactNode[] = [];
  if (clip.resolution) {
    meta.push(
      <span key="res" className="flex items-center gap-1">
        <FileVideo className="h-3 w-3 opacity-60" />
        {clip.resolution}
      </span>,
    );
  }
  if (clip.file_size) {
    meta.push(<span key="size">{formatFileSizeFromBytes(clip.file_size)}</span>);
  }
  if (clip.duration) {
    meta.push(
      <span key="dur" className="flex items-center gap-1">
        <Clock className="h-3 w-3 opacity-60" />
        {formatTime(clip.duration)}
      </span>,
    );
  }
  if (isPublished) {
    meta.push(
      <span key="yt" className="flex items-center gap-1 text-[#ff6b8a]">
        <Youtube className="h-3 w-3" />
        YouTube
      </span>,
    );
  }

  return (
    <div
      className={cn(
        "group relative flex items-center gap-4 rounded-xl border bg-qs-bg-elev p-3.5 transition-colors",
        isActive
          ? "border-[rgba(245,158,11,0.25)] shadow-[0_0_0_1px_rgba(245,158,11,0.18)]"
          : "border-qs-line hover:border-[rgba(245,158,11,0.2)]",
        isDiscarded && "opacity-55",
      )}
    >
      <Link
        href={clipUrl}
        className="absolute inset-0 z-[1] rounded-xl"
        aria-label={title}
      />
      <ThumbPlaceholder
        width={140}
        height={80}
        label={formatTime(clip.duration ?? clip.end_time - clip.start_time)}
        imageUrl={resolvedThumbnail}
        videoUrl={!resolvedThumbnail ? clipStreamUrl : undefined}
        className="pointer-events-none relative z-0"
      />

      <div className="pointer-events-none relative z-0 min-w-0 flex-1">
        {/* Header row: status + timecode + quality */}
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <StatusBadge
            state={clip.status as StatusState}
            label={
              tStatus.has(clip.status) ? tStatus(clip.status) : clip.status
            }
          />
          <span className="font-mono text-[10.5px] text-qs-fg-faint tabular-nums">
            {formatTime(clip.start_time)} → {formatTime(clip.end_time)}
          </span>
          <span className="rounded border border-qs-line bg-qs-bg-elev-2 px-1.5 py-0.5 font-mono text-[10px] text-qs-fg-subtle">
            {clip.quality}
          </span>
        </div>

        {/* Title */}
        <h3 className="truncate font-serif text-[16px] leading-[1.2] tracking-[-0.2px] text-qs-fg">
          {title}
        </h3>

        {/* Meta row */}
        {meta.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-3.5 font-mono text-[11px] text-qs-fg-faint">
            {meta}
          </div>
        )}

        {/* Progress bar */}
        {isActive && <ClipProgressBar clipId={clip.id} />}

        {/* Error */}
        {isError && clip.error_code && (
          <p className="mt-2 text-[11px] text-qs-danger">
            {tErrors.has(clip.error_code)
              ? tErrors(clip.error_code)
              : clip.error_message ?? "Falha no clipe"}
          </p>
        )}

        {downloadError && (
          <p className="mt-2 text-[11px] text-qs-danger">{downloadError}</p>
        )}
      </div>

      {/* Actions */}
      <div
        className="pointer-events-auto relative z-[2] flex shrink-0 items-center gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        {isPublished && (
          <Btn
            size="sm"
            variant="ghost"
            icon={<Copy className="h-3 w-3" />}
            onClick={handleCopyLink}
          >
            Link
          </Btn>
        )}

        {canDownloadFile && !isAwaitingReview && (
          <Btn
            size="sm"
            variant="ghost"
            icon={<Download className="h-3 w-3" />}
            onClick={handleDownload}
            title={t("download")}
          >
            <span className="hidden sm:inline">Baixar</span>
          </Btn>
        )}

        {isReady && (
          <Btn
            size="sm"
            variant="primary"
            icon={<Upload className="h-3 w-3" />}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              sendForReviewMutation.mutate();
            }}
            disabled={sendForReviewMutation.isPending}
          >
            {sendForReviewMutation.isPending ? "..." : "Revisão"}
          </Btn>
        )}

        {isAwaitingReview && (
          <Link
            href={clipUrl}
            className="inline-flex h-[30px] items-center gap-1.5 whitespace-nowrap rounded-lg bg-qs-amber px-3 text-[12px] font-semibold text-[#0c0a09] shadow-[0_1px_2px_rgba(0,0,0,0.2),0_0_0_1px_rgba(245,158,11,0.3),0_4px_14px_rgba(245,158,11,0.25)] transition-colors hover:bg-qs-amber-bright"
          >
            <Sparkles className="h-3 w-3" />
            Revisar
          </Link>
        )}

        {isActive && (
          <Btn
            size="sm"
            variant="ghost"
            disabled
            icon={<Loader2 className="h-3 w-3 animate-spin" />}
          >
            Aguarde…
          </Btn>
        )}

        {isError && (
          <Btn
            size="sm"
            variant="primary"
            icon={
              <RefreshCw
                className={cn(
                  "h-3 w-3",
                  retryMutation.isPending && "animate-spin",
                )}
              />
            }
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              retryMutation.mutate();
            }}
            disabled={retryMutation.isPending}
          >
            Tentar de novo
          </Btn>
        )}

        {canDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDeleteOpen(true);
            }}
            className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-lg text-qs-fg-faint transition-colors hover:bg-[rgba(248,113,113,0.08)] hover:text-qs-danger"
            title={t("delete")}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("deleteTitle")}</DialogTitle>
            <DialogDescription>{t("deleteDescription")}</DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex justify-end gap-3">
            <Btn variant="outline" onClick={() => setDeleteOpen(false)}>
              {t("cancel")}
            </Btn>
            <Btn
              variant="danger"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t("deleting") : t("confirmDelete")}
            </Btn>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ClipListProps {
  videoId: string;
}

export function ClipList({ videoId }: ClipListProps) {
  const t = useTranslations("clips.list");
  const [filter, setFilter] = useState<FilterValue>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["clips", videoId],
    queryFn: () => listClips({ video_id: videoId, page_size: 100 }),
    refetchInterval: (query) => {
      const clips = query.state.data?.items ?? [];
      const hasActive = clips.some((c) =>
        [...ACTIVE_STATUSES, "pending"].includes(c.status),
      );
      return hasActive ? 3_000 : 15_000;
    },
  });

  const { data: video } = useQuery({
    queryKey: ["video", videoId],
    queryFn: () => getVideo(videoId),
    staleTime: 60_000,
  });

  const allClips = useMemo(() => data?.items ?? [], [data]);

  const counts = useMemo(() => {
    const c: Record<FilterValue, number> = {
      all: 0,
      published: 0,
      ready: 0,
      processing: 0,
      review: 0,
      discarded: 0,
    };
    for (const clip of allClips) {
      if (clip.status !== "discarded") c.all += 1;
      if (clip.status === "published") c.published += 1;
      else if (clip.status === "ready") c.ready += 1;
      else if (ACTIVE_STATUSES.includes(clip.status)) c.processing += 1;
      else if (clip.status === "awaiting_review") c.review += 1;
      else if (clip.status === "discarded") c.discarded += 1;
    }
    return c;
  }, [allClips]);

  const visibleClips = allClips.filter((c) => matchesFilter(c.status, filter));

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-qs-line bg-qs-bg-elev p-3.5"
          >
            <div className="h-[80px] w-[140px] animate-pulse rounded-lg bg-qs-bg-elev-2" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 animate-pulse rounded bg-qs-bg-elev-2" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-qs-bg-elev-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (allClips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-qs-line bg-qs-bg-elev py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-qs-bg-elev-2 text-qs-fg-faint">
          <Scissors className="h-6 w-6" />
        </div>
        <p className="text-[13px] text-qs-fg-subtle">{t("empty")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Clips map */}
      <ClipsMapContainer videoId={videoId} clips={allClips} />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <FilterChip
            key={f.value}
            active={filter === f.value}
            onClick={() => setFilter(f.value)}
            count={counts[f.value]}
          >
            {f.label}
          </FilterChip>
        ))}
      </div>

      {visibleClips.length === 0 ? (
        <div className="rounded-xl border border-dashed border-qs-line bg-qs-bg-elev px-4 py-10 text-center">
          <p className="text-[13px] text-qs-fg-faint">
            Nenhum clipe nesse estado.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visibleClips.map((clip) => (
            <ClipItem
              key={clip.id}
              clip={clip}
              videoId={videoId}
              thumbnailUrl={video?.thumbnail_url ?? undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ClipsMapContainer({
  videoId,
  clips,
}: {
  videoId: string;
  clips: Clip[];
}) {
  const { data: video } = useQuery({
    queryKey: ["video", videoId],
    queryFn: () => getVideo(videoId),
    staleTime: 60_000,
  });
  return (
    <ClipsMap
      clips={clips.filter((c) => c.status !== "discarded")}
      videoDuration={video?.duration ?? 0}
    />
  );
}

export type ClipFilterValue = FilterValue;
