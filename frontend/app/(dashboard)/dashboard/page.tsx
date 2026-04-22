"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Check,
  Clock,
  Copy,
  Eye,
  Plus,
  Scissors,
  Sparkles,
  TrendingUp,
  Video as VideoIcon,
  Youtube,
} from "lucide-react";
import {
  getClipPipeline,
  listClips,
} from "@/lib/api/clips";
import { listVideos } from "@/lib/api/videos";
import { getAnalyticsSummary, getClipsStats } from "@/lib/api/analytics";
import { getYouTubeQuota } from "@/lib/api/youtube";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/lib/stores/auth-store";
import {
  formatDate,
  formatDuration,
  formatTime,
  formatViews,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Btn } from "@/components/features/ui/btn";
import { MetricTile } from "@/components/features/ui/metric-tile";
import { PageTopbar } from "@/components/features/ui/page-topbar";
import { ThumbPlaceholder } from "@/components/features/ui/thumb-placeholder";
import { StatusDot } from "@/components/features/ui/status-dot";
import { VideoSubmitDialog } from "@/components/features/videos/video-submit-form";
import type { Clip, ClipPipeline } from "@/lib/types/clip";
import type { Video } from "@/lib/types/video";

function greeting(name?: string) {
  const hour = new Date().getHours();
  if (hour < 5) return `Boa madrugada${name ? ", " + name.split(" ")[0] : ""}`;
  if (hour < 12) return `Bom dia${name ? ", " + name.split(" ")[0] : ""}`;
  if (hour < 18) return `Boa tarde${name ? ", " + name.split(" ")[0] : ""}`;
  return `Boa noite${name ? ", " + name.split(" ")[0] : ""}`;
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const tVideos = useTranslations("videos");

  const { data: publishedClips } = useQuery({
    queryKey: ["dashboard", "clips", "published"],
    queryFn: () => listClips({ status: "published", page_size: 10 }),
  });
  const { data: awaitingClips } = useQuery({
    queryKey: ["dashboard", "clips", "awaiting_review"],
    queryFn: () => listClips({ status: "awaiting_review", page_size: 1 }),
  });
  const { data: readyClips } = useQuery({
    queryKey: ["dashboard", "clips", "active"],
    queryFn: () => listClips({ page_size: 20 }),
    refetchInterval: 15_000,
  });
  const { data: videos } = useQuery({
    queryKey: ["dashboard", "videos", "recent"],
    queryFn: () => listVideos({ page_size: 5 }),
  });
  const { data: processingVideos } = useQuery({
    queryKey: ["dashboard", "videos", "processing"],
    queryFn: () => listVideos({ page_size: 5, status: "processing" }),
    refetchInterval: 15_000,
  });
  const { data: quota } = useQuery({
    queryKey: ["dashboard", "quota"],
    queryFn: () => getYouTubeQuota(),
    retry: false,
  });
  const { data: summary } = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: () => getAnalyticsSummary(),
    staleTime: 5 * 60_000,
  });
  const { data: publishedStats } = useQuery({
    queryKey: ["dashboard", "clips-stats", "published"],
    queryFn: () => getClipsStats("published"),
    staleTime: 5 * 60_000,
  });

  const publishedCount = summary?.published_clips ?? publishedClips?.total ?? 0;
  const awaitingCount = awaitingClips?.total ?? 0;
  const activeClip = readyClips?.items.find((c) =>
    ["downloading", "trimming", "uploading"].includes(c.status),
  );
  const processingVideosCount = processingVideos?.total ?? 0;

  const viewsByClipId = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const item of publishedStats?.items ?? []) {
      map.set(item.clip_id, item.view_count);
    }
    return map;
  }, [publishedStats]);

  const publishedItems = publishedClips?.items ?? [];
  const featured = (() => {
    if (publishedItems.length === 0) return undefined;
    let bestIdx = 0;
    let bestViews = -1;
    publishedItems.forEach((c, i) => {
      const views = viewsByClipId.get(c.id) ?? 0;
      if (views > bestViews) {
        bestViews = views;
        bestIdx = i;
      }
    });
    return publishedItems[bestIdx];
  })();
  const featuredViews = featured ? viewsByClipId.get(featured.id) ?? null : null;
  const featuredVideo = featured
    ? videos?.items.find((v) => v.id === featured.video_id)
    : undefined;
  const activeClipVideo = activeClip
    ? videos?.items.find((v) => v.id === activeClip.video_id)
    : undefined;

  const totalDurationSec =
    summary?.processed_duration_seconds ??
    (publishedClips?.items ?? []).reduce(
      (acc, c) => acc + (c.duration ?? c.end_time - c.start_time),
      0,
    );

  return (
    <>
      <PageTopbar
        title="Dashboard"
        subtitle="Visão geral do seu pipeline de clipes"
        action={
          <VideoSubmitDialog>
            <Btn size="sm" variant="primary" icon={<Plus className="h-3 w-3" />}>
              {tVideos("newVideo")}
            </Btn>
          </VideoSubmitDialog>
        }
      />

      <div className="flex flex-col gap-5">
        {/* Hero greeting */}
        <div>
          <h1 className="font-serif text-[32px] leading-none tracking-[-0.7px] text-qs-fg">
            {greeting(user?.name)}{" "}
            <span className="text-qs-amber-bright">·</span>
          </h1>
          <p className="mt-1.5 text-[13px] text-qs-fg-subtle">
            {awaitingCount > 0 || processingVideosCount > 0 ? (
              <>
                Você tem{" "}
                {awaitingCount > 0 && (
                  <span className="font-semibold text-qs-amber-bright">
                    {awaitingCount}{" "}
                    {awaitingCount === 1
                      ? "clipe aguardando revisão"
                      : "clipes aguardando revisão"}
                  </span>
                )}
                {awaitingCount > 0 && processingVideosCount > 0 && " e "}
                {processingVideosCount > 0 && (
                  <>
                    {processingVideosCount}{" "}
                    {processingVideosCount === 1
                      ? "vídeo processando"
                      : "vídeos processando"}
                  </>
                )}
                .
              </>
            ) : (
              "Tudo em dia. Pronto pra processar o próximo culto."
            )}
          </p>
        </div>

        {/* Metrics */}
        <section className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
          <MetricTile
            label="Clips publicados"
            value={publishedCount.toString()}
            unit="total"
            sparkline={sparklineFromClips(publishedClips?.items ?? [])}
            accent
          />
          <MetricTile
            label="Visualizações totais"
            value={
              summary?.total_views != null ? formatViews(summary.total_views) : "—"
            }
            unit={summary?.total_views != null ? "views" : "em breve"}
            sparkline={[8, 10, 6, 12, 10, 18, 14, 24]}
          />
          <MetricTile
            label="Duração processada"
            value={formatDuration(totalDurationSec).replace(/[a-z]$/i, "")}
            unit="h:m:s"
            sparkline={[3, 4, 4, 5, 6, 7, 7, 8]}
          />
        </section>

        {/* Featured + Pipeline */}
        <section className="grid grid-cols-1 gap-3.5 lg:grid-cols-[1.5fr_1fr]">
          <FeaturedCard
            clip={featured}
            video={featuredVideo}
            views={featuredViews ?? null}
          />
          <PipelineCard clip={activeClip} video={activeClipVideo} />
        </section>

        {/* Activity + Quota */}
        <section className="grid grid-cols-1 gap-3.5 lg:grid-cols-[1.5fr_1fr]">
          <ActivityCard
            clips={readyClips?.items ?? []}
            videos={videos?.items ?? []}
          />
          <QuotaCard quota={quota} />
        </section>
      </div>
    </>
  );
}

function sparklineFromClips(clips: Clip[]): number[] {
  if (clips.length === 0) return [];
  const sorted = [...clips].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  const perDay = new Map<string, number>();
  for (const clip of sorted) {
    const day = clip.created_at.slice(0, 10);
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
  }
  return Array.from(perDay.values());
}

function CardShell({
  title,
  headerLeft,
  headerRight,
  children,
  className,
}: {
  title?: string;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-qs-line bg-qs-bg-elev",
        className,
      )}
    >
      {(title || headerLeft || headerRight) && (
        <div className="flex items-center gap-2 border-b border-qs-line px-5 pb-3 pt-4">
          {headerLeft}
          {title && (
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[1px] text-qs-fg-subtle">
              {title}
            </span>
          )}
          <div className="flex-1" />
          {headerRight}
        </div>
      )}
      {children}
    </div>
  );
}

function FeaturedCard({
  clip,
  video,
  views,
}: {
  clip?: Clip;
  video?: Video;
  views?: number | null;
}) {
  if (!clip) {
    return (
      <CardShell
        title="Destaque do mês"
        headerLeft={<TrendingUp className="h-3.5 w-3.5 text-qs-amber-bright" />}
      >
        <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 p-8 text-center">
          <Sparkles className="h-6 w-6 text-qs-amber" />
          <div>
            <p className="text-[13px] font-semibold text-qs-fg">
              Nenhum clipe publicado ainda
            </p>
            <p className="mt-1 text-[11px] text-qs-fg-subtle">
              Quando você publicar um clipe, ele aparece aqui em destaque.
            </p>
          </div>
        </div>
      </CardShell>
    );
  }

  const duration = clip.duration ?? clip.end_time - clip.start_time;
  const copyLink = () => {
    const url = clip.file_path ?? "";
    if (url) navigator.clipboard.writeText(url);
  };

  return (
    <CardShell
      title="Destaque do mês"
      headerLeft={<TrendingUp className="h-3.5 w-3.5 text-qs-amber-bright" />}
      headerRight={
        clip.published_at && (
          <span className="text-[11px] text-qs-fg-faint">
            publicado {formatDate(clip.published_at)}
          </span>
        )
      }
    >
      <div className="flex gap-4 p-5">
        <ThumbPlaceholder
          width={220}
          height={124}
          label={formatTimeLabel(duration)}
          imageUrl={video?.thumbnail_url ?? undefined}
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-[20px] leading-[1.15] tracking-[-0.3px] text-qs-fg">
            {clip.selected_title ?? video?.title ?? "Clip publicado"}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-[12px] leading-[1.5] text-qs-fg-subtle">
            Trecho da pregação · {video?.channel_name ?? "canal"}
          </p>
          <div className="mt-3.5 flex gap-[18px] text-[11px] text-qs-fg-faint">
            <span className="flex items-center gap-1.5">
              <Eye className="h-3 w-3" />
              {formatViews(views ?? null)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              {formatDuration(duration)}
            </span>
            {clip.published_at && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                {formatDate(clip.published_at)}
              </span>
            )}
          </div>
          <div className="mt-3.5 flex gap-2">
            <Btn
              size="sm"
              variant="outline"
              icon={<Youtube className="h-3 w-3 text-[#ff0033]" />}
            >
              Ver no YouTube
            </Btn>
            <Btn
              size="sm"
              variant="ghost"
              icon={<Copy className="h-3 w-3" />}
              onClick={copyLink}
            >
              Copiar link
            </Btn>
          </div>
        </div>
      </div>
    </CardShell>
  );
}

function PipelineCard({ clip, video }: { clip?: Clip; video?: Video }) {
  const { data: pipeline } = useQuery<ClipPipeline>({
    queryKey: ["clip-pipeline", clip?.id],
    queryFn: () => getClipPipeline(clip!.id),
    enabled: !!clip,
    refetchInterval: 3_000,
  });

  if (!clip) {
    return (
      <CardShell
        title="Pipeline"
        headerLeft={<Check className="h-3.5 w-3.5 text-qs-ok" />}
      >
        <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 p-6 text-center">
          <p className="text-[13px] font-semibold text-qs-fg">
            Sem clipes no pipeline
          </p>
          <p className="text-[11px] text-qs-fg-subtle">
            Nada processando agora.
          </p>
        </div>
      </CardShell>
    );
  }

  const stages: {
    name: string;
    progress: number;
    state: "completed" | "processing" | "pending";
    speed: string | null;
  }[] = [
    {
      name: "Download",
      progress: mapPercent(
        pipeline?.download.status,
        pipeline?.download.percent,
      ),
      state: mapState(pipeline?.download.status),
      speed: pipeline?.download.speed ?? null,
    },
    {
      name: "Corte",
      progress: mapPercent(pipeline?.trim.status, pipeline?.trim.percent),
      state: mapState(pipeline?.trim.status),
      speed: null,
    },
    {
      name: "Upload",
      progress: mapPercent(pipeline?.upload.status, pipeline?.upload.percent),
      state: mapState(pipeline?.upload.status),
      speed: null,
    },
  ];

  return (
    <CardShell
      title="Processando agora"
      headerLeft={<StatusDot state="warn" pulse />}
    >
      <div className="p-[18px]">
        <div className="truncate text-[13px] font-medium text-qs-fg">
          {video?.title ?? "Clip em processamento"}
        </div>
        <div className="mb-3.5 mt-1 text-[11px] text-qs-fg-faint">
          Clip {formatTime(clip.start_time)} → {formatTime(clip.end_time)}
          {clip.resolution && ` · ${clip.resolution}`}
        </div>
        {stages.map((s, i) => (
          <div
            key={s.name}
            className={cn(i < stages.length - 1 && "mb-3")}
          >
            <div className="mb-1.5 flex items-center justify-between">
              <span
                className={cn(
                  "text-[11px] font-medium",
                  s.state === "pending"
                    ? "text-qs-fg-faint"
                    : "text-qs-fg-muted",
                )}
              >
                {s.name}
              </span>
              <span className="font-mono text-[10px] text-qs-fg-faint">
                {s.state === "completed"
                  ? "✓"
                  : s.state === "pending"
                    ? "—"
                    : `${s.progress}%${s.speed ? " · " + s.speed : ""}`}
              </span>
            </div>
            <div className="h-[3px] overflow-hidden rounded-[2px] bg-qs-line">
              <div
                className={cn(
                  "h-full rounded-[2px] transition-[width] duration-300",
                  s.state === "completed" ? "bg-qs-ok" : "bg-qs-amber",
                )}
                style={{
                  width: `${s.progress}%`,
                  boxShadow:
                    s.state === "processing"
                      ? "0 0 8px rgba(245,158,11,0.5)"
                      : "none",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

function ActivityCard({ clips, videos }: { clips: Clip[]; videos: Video[] }) {
  const events = [
    ...clips.map((c) => ({
      id: `clip-${c.id}`,
      icon:
        c.status === "published"
          ? Check
          : c.status === "awaiting_review"
            ? Sparkles
            : Scissors,
      color:
        c.status === "published"
          ? "text-qs-ok"
          : c.status === "awaiting_review"
            ? "text-qs-purple"
            : c.status === "error"
              ? "text-qs-danger"
              : "text-qs-amber-bright",
      title: titleForClip(c),
      sub: c.selected_title ?? "",
      time: c.created_at,
    })),
    ...videos.map((v) => ({
      id: `video-${v.id}`,
      icon: VideoIcon,
      color: "text-qs-fg-subtle",
      title: "Vídeo submetido",
      sub: v.title ?? v.source_url,
      time: v.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 5);

  return (
    <CardShell
      title="Atividade recente"
      headerRight={
        <Link
          href="/videos"
          className="text-[11px] font-medium text-qs-amber-bright hover:text-qs-amber"
        >
          Ver tudo
        </Link>
      }
    >
      <div className="py-1.5">
        {events.length === 0 ? (
          <p className="px-[18px] py-8 text-center text-[12px] text-qs-fg-faint">
            Sem atividade recente.
          </p>
        ) : (
          events.map((e, i) => (
            <div
              key={e.id}
              className={cn(
                "flex items-center gap-3 px-[18px] py-2.5",
                i < events.length - 1 && "border-b border-qs-line/40",
              )}
            >
              <div
                className={cn(
                  "flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border border-qs-line bg-qs-bg-elev-2",
                  e.color,
                )}
              >
                <e.icon className="h-3 w-3" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-medium text-qs-fg">
                  {e.title}
                </div>
                <div className="mt-px truncate text-[11px] text-qs-fg-faint">
                  {e.sub || "—"}
                </div>
              </div>
              <span className="shrink-0 font-mono text-[10px] text-qs-fg-ghost">
                {formatRelative(e.time)}
              </span>
            </div>
          ))
        )}
      </div>
    </CardShell>
  );
}

function QuotaCard({
  quota,
}: {
  quota?: { used: number; daily_limit: number; percent_used: number };
}) {
  const pct = quota?.percent_used ?? 0;
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);

  return (
    <CardShell
      title="Quota diária · YouTube"
      headerLeft={<Youtube className="h-3.5 w-3.5 text-[#ff0033]" />}
    >
      <div className="flex items-center gap-[18px] p-[18px]">
        <div className="relative h-[120px] w-[120px] shrink-0">
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            style={{ transform: "rotate(-90deg)" }}
          >
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke="#2a2522"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
              style={{ filter: "drop-shadow(0 0 6px rgba(245,158,11,0.4))" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-serif text-[26px] leading-none tracking-[-0.5px] text-qs-fg">
              {Math.round(pct)}
              <span className="text-[14px] text-qs-fg-faint">%</span>
            </div>
            <div className="mt-0.5 text-[9px] uppercase tracking-[1px] text-qs-fg-faint">
              usado
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 font-mono text-[11px] text-qs-fg-subtle">
            {quota
              ? `${quota.used.toLocaleString("pt-BR")} / ${quota.daily_limit.toLocaleString("pt-BR")} un.`
              : "aguardando dados"}
          </div>
          <div className="mb-3 text-[11px] leading-[1.5] text-qs-fg-faint">
            {quota && quota.percent_used < 80
              ? `Estimamos ~${Math.floor((quota.daily_limit - quota.used) / 1600)} uploads restantes hoje.`
              : quota
                ? "Atenção: quota acima de 80% hoje."
                : "Conecte o YouTube em Configurações."}
          </div>
          <Btn size="sm" variant="secondary">
            Ver histórico
          </Btn>
        </div>
      </div>
    </CardShell>
  );
}

function mapState(
  s: "pending" | "running" | "completed" | "error" | undefined,
): "completed" | "processing" | "pending" {
  if (s === "completed") return "completed";
  if (s === "running") return "processing";
  return "pending";
}

function mapPercent(
  s: "pending" | "running" | "completed" | "error" | undefined,
  percent?: number | null,
): number {
  if (s === "completed") return 100;
  if (s === "running") return percent ?? 0;
  return 0;
}

function formatTimeLabel(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function titleForClip(c: Clip): string {
  switch (c.status) {
    case "published":
      return "Clip publicado no YouTube";
    case "awaiting_review":
      return "Novo clip em revisão";
    case "ready":
      return "Clip pronto";
    case "error":
      return "Falha no clipe";
    case "downloading":
    case "trimming":
    case "uploading":
      return "Clip em processamento";
    default:
      return "Clip atualizado";
  }
}

function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMin = Math.floor((now - then) / 60_000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "ontem";
  if (diffD < 7) return `há ${diffD} dias`;
  return formatDate(iso);
}
