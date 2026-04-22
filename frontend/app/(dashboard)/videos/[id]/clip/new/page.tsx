"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronRight,
  Pause,
  Play,
  Scissors,
  Sparkles,
} from "lucide-react";
import { getVideo } from "@/lib/api/videos";
import { createClip, getVideoFormats } from "@/lib/api/clips";
import { getDetection } from "@/lib/api/detection";
import { VideoFormat } from "@/lib/types/clip";
import { useYouTubePlayer } from "@/lib/hooks/use-youtube-player";
import { formatTime, parseTime, formatFileSize } from "@/lib/formatters";
import { VideoTimeline } from "@/components/features/clips/video-timeline";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTopbar } from "@/components/features/ui/page-topbar";
import { cn } from "@/lib/utils";

const DETECTION_CONFIDENCE_THRESHOLD = 80;

function parseSuggested(value: string | null): number | undefined {
  if (!value) return undefined;
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : undefined;
}

export default function ClipEditorPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("clips.editor");
  const tDetection = useTranslations("videos.detection");
  const searchParams = useSearchParams();
  const suggestedStart = parseSuggested(searchParams.get("suggested_start"));
  const suggestedEnd = parseSuggested(searchParams.get("suggested_end"));

  const { data: video, isLoading: videoLoading } = useQuery({
    queryKey: ["video", id],
    queryFn: () => getVideo(id),
  });
  const { data: detection } = useQuery({
    queryKey: ["detection", id],
    queryFn: () => getDetection(id),
  });

  const videoDuration = video?.duration ?? 0;

  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [startInput, setStartInput] = useState("0:00:00");
  const [endInput, setEndInput] = useState("0:00:00");
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat | null>(null);

  useEffect(() => {
    if (videoDuration > 0 && endTime === 0) {
      const initialStart = suggestedStart ?? Math.round(videoDuration * 0.1);
      const initialEnd =
        suggestedEnd ?? Math.min(videoDuration, Math.round(videoDuration * 0.6));
      setStartTime(initialStart);
      setEndTime(initialEnd);
      setStartInput(formatTime(initialStart));
      setEndInput(formatTime(initialEnd));
    }
  }, [videoDuration, endTime, suggestedStart, suggestedEnd]);

  function applySuggestedDetection() {
    if (
      !detection ||
      detection.start_seconds == null ||
      detection.end_seconds == null
    )
      return;
    setStartTime(detection.start_seconds);
    setEndTime(detection.end_seconds);
    setStartInput(formatTime(detection.start_seconds));
    setEndInput(formatTime(detection.end_seconds));
  }

  const player = useYouTubePlayer({
    videoId: video?.youtube_video_id ?? "",
    containerId: "yt-clip-editor",
  });

  const clipDuration = endTime > startTime ? endTime - startTime : 0;

  const [debouncedClipDuration, setDebouncedClipDuration] =
    useState(clipDuration);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedClipDuration(clipDuration), 500);
    return () => clearTimeout(timer);
  }, [clipDuration]);

  const { data: formatsData, isLoading: formatsLoading } = useQuery({
    queryKey: ["video-formats", id, debouncedClipDuration],
    queryFn: () =>
      getVideoFormats(
        id,
        debouncedClipDuration > 0 ? debouncedClipDuration : undefined,
      ),
    enabled: !!video,
    staleTime: 60_000,
  });

  const formats = useMemo(() => formatsData?.formats ?? [], [formatsData]);

  useEffect(() => {
    if (formats.length > 0 && !selectedFormat) {
      setSelectedFormat(formats.find((f) => f.height === 1080) || formats[0]);
    }
  }, [formats, selectedFormat]);

  const handleStartChange = useCallback(
    (time: number) => {
      const clamped = Math.max(0, Math.min(time, videoDuration));
      setStartTime(clamped);
      setStartInput(formatTime(clamped));
    },
    [videoDuration],
  );

  const handleEndChange = useCallback(
    (time: number) => {
      const clamped = Math.max(0, Math.min(time, videoDuration));
      setEndTime(clamped);
      setEndInput(formatTime(clamped));
    },
    [videoDuration],
  );

  function commitStartInput() {
    const parsed = parseTime(startInput);
    if (parsed !== null && parsed < endTime && parsed >= 0) {
      setStartTime(parsed);
      setStartInput(formatTime(parsed));
    } else {
      setStartInput(formatTime(startTime));
    }
  }

  function commitEndInput() {
    const parsed = parseTime(endInput);
    if (parsed !== null && parsed > startTime && parsed <= videoDuration) {
      setEndTime(parsed);
      setEndInput(formatTime(parsed));
    } else {
      setEndInput(formatTime(endTime));
    }
  }

  function handleInputKeyDown(e: React.KeyboardEvent, commit: () => void) {
    if (e.key === "Enter") commit();
  }

  function nudgeStart(seconds: number) {
    handleStartChange(startTime + seconds);
  }
  function nudgeEnd(seconds: number) {
    handleEndChange(endTime + seconds);
  }

  function markStart() {
    const current = Math.round(player.currentTime);
    if (current < endTime) {
      setStartTime(current);
      setStartInput(formatTime(current));
    }
  }

  function markEnd() {
    const current = Math.round(player.currentTime);
    if (current > startTime) {
      setEndTime(current);
      setEndInput(formatTime(current));
    }
  }

  const handleSeek = useCallback(
    (time: number) => player.seekTo(time),
    [player],
  );

  const mutation = useMutation({
    mutationFn: () => {
      if (!selectedFormat) throw new Error("Format not selected");
      return createClip({
        video_id: id,
        start_time: startTime,
        end_time: endTime,
        quality: `${selectedFormat.height}p`,
        format_id: selectedFormat.format_id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clips"] });
      router.push(`/videos/${id}?tab=clips`);
    },
  });

  const estimatedSizeMb = selectedFormat?.estimated_size_mb ?? 0;
  const sizeWarning = estimatedSizeMb > 2048;
  const canSubmit =
    startTime < endTime &&
    clipDuration > 0 &&
    selectedFormat &&
    !mutation.isPending;

  if (videoLoading) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-[360px] rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!video) return null;

  return (
    <>
      <PageTopbar title="Editor de clip" subtitle={video.channel_name ?? undefined} />
    <div className="flex flex-col gap-5">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1.5 text-[12px] text-qs-fg-faint">
        <Link
          href="/videos"
          className="inline-flex items-center gap-1.5 hover:text-qs-fg-muted"
        >
          Vídeos
        </Link>
        <ChevronRight className="h-3 w-3 text-qs-fg-ghost" />
        <Link
          href={`/videos/${id}`}
          className="inline-flex max-w-[240px] items-center gap-1.5 truncate hover:text-qs-fg-muted"
        >
          {video.title || t("title")}
        </Link>
        <ChevronRight className="h-3 w-3 text-qs-fg-ghost" />
        <span className="text-qs-fg-subtle">Editor</span>
      </nav>

      {/* Title row */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/videos/${id}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-qs-line text-qs-fg-subtle transition-colors hover:border-qs-line-strong hover:text-qs-fg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-serif text-[22px] leading-tight tracking-[-0.3px] text-qs-fg">
            {video.title || t("title")}
          </h1>
          <p className="truncate font-mono text-[11px] text-qs-fg-faint">
            {video.channel_name}
            {video.upload_date &&
              ` · ${video.upload_date.replace(/(\d{4})(\d{2})(\d{2})/, "$3/$2/$1")}`}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[rgba(245,158,11,0.28)] bg-[rgba(245,158,11,0.08)] px-3 py-1.5">
          <Scissors className="h-3.5 w-3.5 text-qs-amber-bright" />
          <span className="font-mono text-[12px] font-semibold text-qs-amber-bright tabular-nums">
            {formatTime(clipDuration)}
          </span>
        </div>
      </header>

      {/* Detection suggestion */}
      {detection?.status === "completed" &&
        detection.start_seconds != null &&
        detection.end_seconds != null && (
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-[rgba(196,181,253,0.28)] bg-[rgba(196,181,253,0.06)] p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-qs-purple" />
                <p className="text-[13px] font-semibold text-qs-fg">
                  {tDetection("detected")}
                </p>
                <span className="font-mono text-[11px] text-qs-fg-faint">
                  {formatTime(detection.start_seconds)} →{" "}
                  {formatTime(detection.end_seconds)} ·{" "}
                  {detection.confidence ?? 0}%
                </span>
              </div>
              {(detection.confidence ?? 0) < DETECTION_CONFIDENCE_THRESHOLD && (
                <p className="mt-2 text-[11.5px] text-qs-amber-bright">
                  {tDetection("confidenceLow")}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={applySuggestedDetection}
              className="h-9 shrink-0 rounded-lg border border-qs-line bg-qs-bg-elev-2 px-4 text-[12px] font-semibold text-qs-fg-muted transition-colors hover:border-qs-line-strong hover:text-qs-fg"
            >
              {tDetection("useSuggested")}
            </button>
          </div>
        )}

      {/* Workspace: player + right sidebar */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-4">
          {/* Player */}
          <div className="overflow-hidden rounded-xl border border-qs-line bg-black shadow-qs-card">
            <div className="relative aspect-video">
              {!player.isReady && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0a0807]">
                  <div className="text-center">
                    <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-qs-amber" />
                    <p className="text-[13px] text-qs-fg-subtle">
                      {t("loading")}
                    </p>
                  </div>
                </div>
              )}
              <div id="yt-clip-editor" className="absolute inset-0 h-full w-full" />
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-qs-line bg-qs-bg-elev p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[1px] text-qs-fg-faint">
                Timeline
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={markStart}
                  className="h-7 rounded-md border border-[rgba(52,211,153,0.28)] bg-[rgba(52,211,153,0.10)] px-2.5 font-mono text-[10.5px] font-semibold text-qs-ok transition-colors hover:bg-[rgba(52,211,153,0.15)]"
                >
                  {t("markStart")}
                </button>
                <button
                  type="button"
                  onClick={markEnd}
                  className="h-7 rounded-md border border-[rgba(248,113,113,0.28)] bg-[rgba(248,113,113,0.10)] px-2.5 font-mono text-[10.5px] font-semibold text-qs-danger transition-colors hover:bg-[rgba(248,113,113,0.15)]"
                >
                  {t("markEnd")}
                </button>
              </div>
            </div>
            <VideoTimeline
              duration={videoDuration}
              startTime={startTime}
              endTime={endTime}
              currentTime={player.currentTime}
              onStartChange={handleStartChange}
              onEndChange={handleEndChange}
              onSeek={handleSeek}
            />
          </div>
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          {/* Transport */}
          <div className="flex items-center justify-center gap-2 rounded-xl border border-qs-line bg-qs-bg-elev p-3">
            <button
              type="button"
              onClick={() => player.skipBackward(10)}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-qs-line bg-qs-bg-elev-2 px-3 font-mono text-[11px] text-qs-fg-muted transition-colors hover:border-qs-line-strong"
            >
              −10s
            </button>
            <button
              type="button"
              onClick={() =>
                player.isPlaying ? player.pause() : player.play()
              }
              className="flex h-10 w-10 items-center justify-center rounded-full bg-qs-amber text-[#0c0a09] shadow-[0_4px_14px_rgba(245,158,11,0.25)] transition-colors hover:bg-qs-amber-bright"
            >
              {player.isPlaying ? (
                <Pause className="h-4 w-4" fill="currentColor" />
              ) : (
                <Play className="ml-[1px] h-4 w-4" fill="currentColor" />
              )}
            </button>
            <button
              type="button"
              onClick={() => player.skipForward(10)}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-qs-line bg-qs-bg-elev-2 px-3 font-mono text-[11px] text-qs-fg-muted transition-colors hover:border-qs-line-strong"
            >
              +10s
            </button>
          </div>

          {/* Trecho */}
          <section className="rounded-xl border border-qs-line bg-qs-bg-elev p-4">
            <h3 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[1px] text-qs-fg-faint">
              Trecho
            </h3>
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-qs-fg-subtle">Início</span>
                <input
                  value={startInput}
                  onChange={(e) => setStartInput(e.target.value)}
                  onBlur={commitStartInput}
                  onKeyDown={(e) => handleInputKeyDown(e, commitStartInput)}
                  className="h-9 rounded-lg border border-qs-line bg-qs-bg-elev-2 px-3 text-center font-mono text-[12px] text-qs-fg outline-none focus:border-qs-amber"
                />
                <div className="flex gap-1">
                  <NudgeButton onClick={() => nudgeStart(-1)}>−1s</NudgeButton>
                  <NudgeButton onClick={() => nudgeStart(-0.1)}>
                    −0.1s
                  </NudgeButton>
                  <NudgeButton onClick={() => nudgeStart(0.1)}>
                    +0.1s
                  </NudgeButton>
                  <NudgeButton onClick={() => nudgeStart(1)}>+1s</NudgeButton>
                </div>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-qs-fg-subtle">Fim</span>
                <input
                  value={endInput}
                  onChange={(e) => setEndInput(e.target.value)}
                  onBlur={commitEndInput}
                  onKeyDown={(e) => handleInputKeyDown(e, commitEndInput)}
                  className="h-9 rounded-lg border border-qs-line bg-qs-bg-elev-2 px-3 text-center font-mono text-[12px] text-qs-fg outline-none focus:border-qs-amber"
                />
                <div className="flex gap-1">
                  <NudgeButton onClick={() => nudgeEnd(-1)}>−1s</NudgeButton>
                  <NudgeButton onClick={() => nudgeEnd(-0.1)}>
                    −0.1s
                  </NudgeButton>
                  <NudgeButton onClick={() => nudgeEnd(0.1)}>+0.1s</NudgeButton>
                  <NudgeButton onClick={() => nudgeEnd(1)}>+1s</NudgeButton>
                </div>
              </label>
              <div className="rounded-lg border border-[rgba(245,158,11,0.28)] bg-[rgba(245,158,11,0.06)] px-3 py-2 text-center">
                <span className="font-mono text-[12px] font-semibold text-qs-amber-bright tabular-nums">
                  {formatTime(clipDuration)}
                </span>
              </div>
            </div>
          </section>

          {/* Exportação */}
          <section className="rounded-xl border border-qs-line bg-qs-bg-elev p-4">
            <h3 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[1px] text-qs-fg-faint">
              Exportação
            </h3>
            {formatsLoading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-9 rounded-lg" />
                ))}
              </div>
            ) : formats.length === 0 ? (
              <p className="text-[12px] text-qs-fg-faint">{t("noFormats")}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {formats.map((fmt) => (
                  <button
                    key={fmt.height}
                    type="button"
                    onClick={() => setSelectedFormat(fmt)}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-2 text-[12px] transition-colors",
                      selectedFormat?.height === fmt.height
                        ? "border-qs-amber bg-[rgba(245,158,11,0.08)] text-qs-amber-bright"
                        : "border-qs-line text-qs-fg-muted hover:border-qs-line-strong",
                    )}
                  >
                    <span className="font-semibold">{fmt.resolution}</span>
                    <span className="font-mono text-[10.5px] text-qs-fg-faint">
                      ~{formatFileSize(fmt.estimated_size_mb)}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {sizeWarning && (
              <p className="mt-3 text-[11px] text-qs-danger">
                {t("sizeWarning")}
              </p>
            )}
          </section>

          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={!canSubmit}
            className="flex h-11 items-center justify-center gap-2 rounded-lg bg-qs-amber text-[13px] font-bold text-[#0c0a09] shadow-[0_4px_14px_rgba(245,158,11,0.25)] transition-colors hover:bg-qs-amber-bright disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            <Scissors className="h-4 w-4" />
            {mutation.isPending ? t("submitting") : t("submit")}
          </button>
          {mutation.isError && (
            <p className="text-right text-[11px] text-qs-danger">
              {(mutation.error as Error).message}
            </p>
          )}
        </aside>
      </div>
    </div>
    </>
  );
}

function NudgeButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-7 flex-1 rounded-md border border-qs-line bg-qs-bg-elev-2 font-mono text-[10px] text-qs-fg-subtle transition-colors hover:border-qs-line-strong hover:text-qs-fg-muted"
    >
      {children}
    </button>
  );
}
