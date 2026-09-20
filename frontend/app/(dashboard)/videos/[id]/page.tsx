"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  Edit3,
  Eye,
  Loader2,
  RefreshCw,
  Scissors,
  Sparkles,
  Trash2,
  Tv2,
} from "lucide-react";
import {
  getVideo,
  deleteVideo,
  updateVideo,
  refreshVideo,
} from "@/lib/api/videos";
import { getDetection, retryDetection } from "@/lib/api/detection";
import { listClips } from "@/lib/api/clips";
import { ClipList } from "@/components/features/clips/clip-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Btn } from "@/components/features/ui/btn";
import { ComingSoonNote, COMING_SOON } from "@/components/features/ui/coming-soon";
import { Tab } from "@/components/features/ui/tab";
import { StatusBadge } from "@/components/features/ui/status-badge";
import { InfoTile } from "@/components/features/ui/info-tile";
import { WaveformMini } from "@/components/features/ui/waveform";
import { PageTopbar } from "@/components/features/ui/page-topbar";
import {
  DownloadMenu,
  DownloadIcons,
} from "@/components/features/ui/download-menu";
import { cn } from "@/lib/utils";
import {
  formatDate,
  formatDuration,
  formatTime,
  formatUploadDate,
  formatViews,
} from "@/lib/formatters";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Detection } from "@/lib/types/detection";
import type { Video } from "@/lib/types/video";

type DetailTab = "details" | "clips";

export default function VideoDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("videos.detail");
  const searchParams = useSearchParams();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const initialTab = searchParams.get("tab") === "clips" ? "clips" : "details";
  const [activeTab, setActiveTab] = useState<DetailTab>(initialTab);

  const { data: video, isLoading } = useQuery({
    queryKey: ["video", id],
    queryFn: () => getVideo(id),
  });

  const { data: clipsList } = useQuery({
    queryKey: ["clips", id],
    queryFn: () => listClips({ video_id: id }),
  });

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  const updateMutation = useMutation({
    mutationFn: (title: string) => updateVideo(id, { title }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["video", id], updated);
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      setIsEditingTitle(false);
    },
  });

  const refreshMutation = useMutation({
    mutationFn: () => refreshVideo(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(["video", id], updated);
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });

  useEffect(() => {
    if (video && !refreshMutation.isPending) {
      refreshMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video?.id]);

  const deleteMutation = useMutation({
    mutationFn: () => deleteVideo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      router.push("/videos");
    },
  });

  function startEditingTitle() {
    setEditTitle(video?.title || "");
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  }

  function saveTitle() {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== video?.title) {
      updateMutation.mutate(trimmed);
    } else {
      setIsEditingTitle(false);
    }
  }

  function handleTitleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") saveTitle();
    if (e.key === "Escape") setIsEditingTitle(false);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-2/3" />
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <Skeleton className="aspect-video rounded-xl" />
          <Skeleton className="h-[220px] rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!video) return null;

  const awaitingReview = (clipsList?.items ?? []).filter(
    (c) => c.status === "awaiting_review",
  ).length;
  const clipCount = clipsList?.total ?? 0;
  const headerStatus = video.aggregated_status ?? video.status;

  return (
    <>
      <PageTopbar title="Detalhes do Vídeo" />
    <div className="flex flex-col">
      {/* Back */}
      <Link
        href="/videos"
        className="mb-5 flex w-fit items-center gap-1.5 text-[12px] text-qs-fg-subtle transition-colors hover:text-qs-fg-muted"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar para vídeos
      </Link>

      {/* Title + actions */}
      <div className="mb-[18px] flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={handleTitleKeyDown}
              disabled={updateMutation.isPending}
              className="w-full border-b-2 border-qs-amber bg-transparent pb-1 font-serif text-[28px] leading-tight tracking-[-0.5px] text-qs-fg outline-none"
            />
          ) : (
            <h1 className="font-serif text-[28px] leading-[1.15] tracking-[-0.5px] text-qs-fg">
              {video.title || t("title")}
            </h1>
          )}
          <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
            {awaitingReview > 0 ? (
              <StatusBadge
                state="awaiting_review"
                label={`${awaitingReview} clip${awaitingReview === 1 ? "" : "s"} em revisão`}
              />
            ) : (
              <StatusBadge
                state={headerStatus}
                label={labelForVideoStatus(headerStatus)}
              />
            )}
            <span className="text-[11px] text-qs-fg-faint">
              Submetido em {formatDate(video.created_at)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {activeTab === "details" ? (
            <>
              <VideoDownloadMenu video={video} />
              <Btn
                size="sm"
                variant="ghost"
                icon={<Edit3 className="h-3 w-3" />}
                onClick={startEditingTitle}
              >
                Renomear
              </Btn>
              <Btn
                size="sm"
                variant="ghost"
                icon={<Trash2 className="h-3 w-3 text-qs-danger" />}
                onClick={() => setDeleteOpen(true)}
              >
                Excluir
              </Btn>
            </>
          ) : (
            <>
              <Btn
                size="sm"
                variant="ghost"
                icon={<Download className="h-3 w-3" />}
                disabled
                title={COMING_SOON}
              >
                Baixar tudo
              </Btn>
              <Btn
                size="sm"
                variant="ghost"
                icon={<Sparkles className="h-3 w-3" />}
                disabled
                title={COMING_SOON}
              >
                Detectar novamente
              </Btn>
              <ComingSoonNote />
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-[22px] flex items-end border-b border-qs-line">
        <Tab active={activeTab === "details"} onClick={() => setActiveTab("details")}>
          {t("tabDetails")}
        </Tab>
        <Tab
          active={activeTab === "clips"}
          onClick={() => setActiveTab("clips")}
          badge={clipCount > 0 ? clipCount : undefined}
        >
          {t("tabClips")}
        </Tab>
        <div className="flex-1" />
        <div className="pb-2">
          <Btn
            size="sm"
            variant="primary"
            icon={<Scissors className="h-3 w-3" />}
            onClick={() => router.push(`/videos/${id}/clip/new`)}
          >
            Criar clip
          </Btn>
        </div>
      </div>

      {/* Tab: Details */}
      {activeTab === "details" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
            <VideoPlayer video={video} />
            <DetectionBlock videoId={id} videoDuration={video.duration} />
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <InfoTile
              icon={<Clock />}
              label="Duração"
              value={formatDuration(video.duration)}
              mono
            />
            <InfoTile
              icon={<Tv2 />}
              label="Canal"
              value={video.channel_name || "—"}
            />
            <InfoTile
              icon={<Eye />}
              label="Visualizações"
              value={formatViews(video.view_count)}
              mono
            />
            <InfoTile
              icon={<Calendar />}
              label="Publicado em"
              value={formatUploadDate(video.upload_date)}
            />
          </div>
        </div>
      )}

      {/* Tab: Clips */}
      {activeTab === "clips" && <ClipList videoId={id} />}

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
    </>
  );
}

function labelForVideoStatus(status: Video["status"]): string {
  const map: Record<Video["status"], string> = {
    pending: "Aguardando",
    detecting: "Detectando",
    processing: "Processando",
    awaiting_review: "Em revisão",
    published: "Publicado",
    error: "Erro",
  };
  return map[status];
}

function VideoPlayer({ video }: { video: Video }) {
  if (video.youtube_video_id) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-xl border border-qs-line bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${video.youtube_video_id}`}
          title={video.title || ""}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  const status = video.aggregated_status ?? video.status;

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl border border-qs-line bg-black">
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, #1a1a1a 0 6px, #0a0a0a 6px 12px)",
        }}
      >
        <span className="rounded-lg bg-white/10 px-3 py-1.5 text-[12px] font-medium text-qs-fg backdrop-blur-[10px]">
          {labelForVideoStatus(status)}
        </span>
      </div>
    </div>
  );
}

function skippedReasonKey(
  errorMessage: string | null,
): "skippedTooShort" | "skippedIsLive" | "skippedNoCaptions" | "skipped" {
  if (errorMessage === "skipped:too_short") return "skippedTooShort";
  if (errorMessage === "skipped:is_live") return "skippedIsLive";
  if (errorMessage === "sem_legendas_disponiveis") return "skippedNoCaptions";
  return "skipped";
}

function DetectionBlock({
  videoId,
  videoDuration,
}: {
  videoId: string;
  videoDuration: number | null;
}) {
  const t = useTranslations("videos.detection");
  const queryClient = useQueryClient();

  const { data: detection, isLoading } = useQuery({
    queryKey: ["detection", videoId],
    queryFn: () => getDetection(videoId),
    refetchInterval: (q) => (q.state.data?.status === "running" ? 3_000 : false),
  });

  const retryMutation = useMutation({
    mutationFn: () => retryDetection(videoId),
    onSuccess: (next) => queryClient.setQueryData(["detection", videoId], next),
  });

  if (isLoading || !detection) {
    return (
      <div className="rounded-xl border border-qs-line bg-qs-bg-elev p-[18px]">
        <Skeleton className="h-[180px] w-full" />
      </div>
    );
  }

  if (detection.status === "running") {
    return (
      <div className="flex h-full flex-col rounded-xl border border-qs-line bg-qs-bg-elev p-[18px]">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-qs-amber-bright" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[1px] text-qs-fg-subtle">
            Detectando pregação
          </span>
        </div>
        <p className="text-[12px] leading-[1.5] text-qs-fg-muted">
          {t("detecting")} Pode levar alguns minutos.
        </p>
        <div className="mt-auto flex items-center gap-2 pt-4 text-qs-amber-bright">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span className="text-[11px]">Analisando áudio e legendas…</span>
        </div>
      </div>
    );
  }

  if (detection.status === "skipped") {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-qs-line bg-qs-bg-elev p-[18px] text-center">
        <p className="text-[12px] text-qs-fg-subtle">
          {t(skippedReasonKey(detection.error_message))}
        </p>
      </div>
    );
  }

  if (detection.status === "failed") {
    return (
      <div className="flex h-full flex-col gap-3 rounded-xl border border-qs-line bg-qs-bg-elev p-[18px]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-qs-fg-faint" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[1px] text-qs-fg-subtle">
            Detecção
          </span>
        </div>
        <p className="text-[12px] text-qs-fg-muted">{t("failed")}</p>
        <Btn
          size="sm"
          variant="secondary"
          icon={
            <RefreshCw
              className={cn("h-3 w-3", retryMutation.isPending && "animate-spin")}
            />
          }
          onClick={() => retryMutation.mutate()}
          disabled={retryMutation.isPending}
        >
          {retryMutation.isPending ? "..." : t("retry")}
        </Btn>
      </div>
    );
  }

  return (
    <DetectionCompleted
      videoId={videoId}
      detection={detection}
      videoDuration={videoDuration}
    />
  );
}

function DetectionCompleted({
  videoId,
  detection,
  videoDuration,
}: {
  videoId: string;
  detection: Detection;
  videoDuration: number | null;
}) {
  const start = detection.start_seconds ?? 0;
  const end = detection.end_seconds ?? 0;
  const confidence = detection.confidence ?? 0;
  const duration = end - start;
  const clipUrl = `/videos/${videoId}/clip/new?suggested_start=${start}&suggested_end=${end}`;
  const selection: [number, number] | null =
    videoDuration && videoDuration > 0
      ? [start / videoDuration, end / videoDuration]
      : null;

  return (
    <div className="rounded-xl border border-qs-line bg-qs-bg-elev p-[18px]">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-qs-amber-bright" />
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[1px] text-qs-fg-subtle">
          Pregação detectada
        </span>
        <div className="flex-1" />
        <span className="rounded bg-[rgba(52,211,153,0.12)] px-1.5 py-0.5 text-[10px] font-semibold text-qs-ok">
          {confidence}% confiança
        </span>
      </div>

      <p className="mb-3.5 text-[12px] leading-[1.5] text-qs-fg-muted">
        Detectamos uma pregação de{" "}
        <span className="font-mono font-semibold text-qs-fg">
          {formatTime(start)}
        </span>{" "}
        até{" "}
        <span className="font-mono font-semibold text-qs-fg">
          {formatTime(end)}
        </span>
        .
      </p>

      <div className="mb-3.5 rounded-lg border border-qs-line bg-qs-bg-elev-2 p-2.5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] text-qs-fg-faint">Trecho sugerido</span>
          <span className="font-mono text-[10px] text-qs-fg-faint">
            {formatDurationShort(duration)}
          </span>
        </div>
        {selection && <WaveformMini selection={selection} />}
      </div>

      <div className="flex gap-1.5">
        <Link
          href={clipUrl}
          className="inline-flex h-[30px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-qs-amber px-3 text-[12px] font-semibold text-[#0c0a09] shadow-[0_1px_2px_rgba(0,0,0,0.2),0_0_0_1px_rgba(245,158,11,0.3),0_4px_14px_rgba(245,158,11,0.25)] transition-colors hover:bg-qs-amber-bright"
        >
          Usar pregação sugerida
        </Link>
        <Link
          href={clipUrl}
          className="inline-flex h-[30px] items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-qs-line bg-qs-bg-elev-2 px-3 text-[12px] font-semibold text-qs-fg-muted transition-colors hover:border-qs-line-strong"
        >
          <Edit3 className="h-3 w-3" />
          Editar
        </Link>
      </div>
    </div>
  );
}

function VideoDownloadMenu({ video }: { video: Video }) {
  // Downloads available at the video level: source video, subtitles (placeholder).
  const options = [
    {
      id: "video",
      icon: DownloadIcons.video,
      label: "Vídeo original",
      meta: video.duration
        ? `MP4 · ${formatDuration(video.duration)}`
        : "MP4 · aguardando dados",
      primary: true,
      onSelect: () => {
        if (video.source_url) window.open(video.source_url, "_blank");
      },
      disabled: !video.source_url,
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
      meta: "SRT · PT-BR · em breve",
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
  return <DownloadMenu options={options} />;
}

function formatDurationShort(seconds: number): string {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}min ${String(s).padStart(2, "0")}s`;
}
