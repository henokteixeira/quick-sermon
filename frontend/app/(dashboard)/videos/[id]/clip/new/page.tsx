"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVideo } from "@/lib/api/videos";
import { createClip, getVideoFormats } from "@/lib/api/clips";
import { getDetection } from "@/lib/api/detection";
import { VideoFormat } from "@/lib/types/clip";
import { useYouTubePlayer } from "@/lib/hooks/use-youtube-player";
import { formatTime, parseTime, formatFileSize } from "@/lib/formatters";
import { VideoTimeline } from "@/components/features/clips/video-timeline";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
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

  // Timeline state
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [startInput, setStartInput] = useState("0:00:00");
  const [endInput, setEndInput] = useState("0:00:00");
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat | null>(null);

  // Set initial range when video loads
  useEffect(() => {
    if (videoDuration > 0 && endTime === 0) {
      const initialStart =
        suggestedStart ?? Math.round(videoDuration * 0.1);
      const initialEnd =
        suggestedEnd ??
        Math.min(videoDuration, Math.round(videoDuration * 0.6));
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
    ) {
      return;
    }
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

  // Debounce clipDuration for format fetching (avoid requests while dragging)
  const [debouncedClipDuration, setDebouncedClipDuration] = useState(clipDuration);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedClipDuration(clipDuration), 500);
    return () => clearTimeout(timer);
  }, [clipDuration]);

  // Formats
  const { data: formatsData, isLoading: formatsLoading } = useQuery({
    queryKey: ["video-formats", id, debouncedClipDuration],
    queryFn: () => getVideoFormats(id, debouncedClipDuration > 0 ? debouncedClipDuration : undefined),
    enabled: !!video,
    staleTime: 60_000,
  });

  const formats = useMemo(() => formatsData?.formats ?? [], [formatsData]);

  useEffect(() => {
    if (formats.length > 0 && !selectedFormat) {
      setSelectedFormat(formats.find((f) => f.height === 1080) || formats[0]);
    }
  }, [formats, selectedFormat]);

  // Timeline handle callbacks
  const handleStartChange = useCallback(
    (time: number) => {
      const clamped = Math.max(0, Math.min(time, videoDuration));
      setStartTime(clamped);
      setStartInput(formatTime(clamped));
    },
    [videoDuration]
  );

  const handleEndChange = useCallback(
    (time: number) => {
      const clamped = Math.max(0, Math.min(time, videoDuration));
      setEndTime(clamped);
      setEndInput(formatTime(clamped));
    },
    [videoDuration]
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

  function markStart() {
    const t = Math.round(player.currentTime);
    if (t < endTime) {
      setStartTime(t);
      setStartInput(formatTime(t));
    }
  }

  function markEnd() {
    const t = Math.round(player.currentTime);
    if (t > startTime) {
      setEndTime(t);
      setEndInput(formatTime(t));
    }
  }

  const handleSeek = useCallback(
    (time: number) => player.seekTo(time),
    [player]
  );

  // Create clip mutation
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
      queryClient.invalidateQueries({ queryKey: ["clips", id] });
      router.push(`/videos/${id}?tab=clips`);
    },
  });

  const estimatedSizeMb = selectedFormat?.estimated_size_mb ?? 0;
  const sizeWarning = estimatedSizeMb > 2048;
  const canSubmit =
    startTime < endTime && clipDuration > 0 && selectedFormat && !mutation.isPending;

  if (videoLoading) {
    return (
      <div className="max-w-[960px] mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="aspect-video rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!video) return null;

  return (
    <div className="relative max-w-[960px] mx-auto">
      {/* Ambient glow */}
      <div className="absolute -top-10 left-1/4 w-[300px] h-[200px] rounded-full bg-amber-500/[0.03] blur-[80px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/videos/${id}`}
          className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors shrink-0"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="min-w-0">
          <h1 className="text-lg font-serif text-foreground leading-tight truncate">
            {video.title || t("title")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {video.channel_name}
            {video.upload_date && ` \u2022 ${video.upload_date.replace(/(\d{4})(\d{2})(\d{2})/, "$3/$2/$1")}`}
          </p>
        </div>
      </div>

      {/* Video Player */}
      <div className="rounded-xl overflow-hidden bg-black mb-5 border border-stone-800/50 shadow-lg shadow-black/10">
        <div className="relative aspect-video">
          {!player.isReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-stone-900 z-10">
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-white/20 border-t-white/80 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-white/50">{t("loading")}</p>
              </div>
            </div>
          )}
          <div id="yt-clip-editor" className="absolute inset-0 w-full h-full" />
        </div>
      </div>

      {/* Detection suggestion */}
      {detection?.status === "completed" &&
        detection.start_seconds != null &&
        detection.end_seconds != null && (
          <div className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4 flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                {tDetection("detected")}{" "}
                <span className="text-muted-foreground tabular-nums">
                  ({formatTime(detection.start_seconds)} →{" "}
                  {formatTime(detection.end_seconds)},{" "}
                  {tDetection("confidence")}: {detection.confidence ?? 0}%)
                </span>
              </p>
              {(detection.confidence ?? 0) < DETECTION_CONFIDENCE_THRESHOLD && (
                <Alert className="mt-2 py-2">
                  <AlertDescription className="text-xs">
                    {tDetection("confidenceLow")}
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <button
              onClick={applySuggestedDetection}
              className="h-9 px-4 rounded-lg border border-input text-xs font-semibold hover:bg-muted transition-colors whitespace-nowrap"
            >
              {tDetection("useSuggested")}
            </button>
          </div>
        )}

      {/* Timeline + Controls */}
      <div className="rounded-xl border border-border bg-card p-5 sm:p-6 mb-5">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-serif font-semibold text-foreground">
            {t("timeline")}
          </p>
          <div className="h-7 px-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center">
            <span className="text-xs font-bold tabular-nums text-amber-600 dark:text-amber-400">
              {formatTime(clipDuration)}
            </span>
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

        {/* Controls */}
        <div className="mt-6 pt-5 border-t border-border">
          <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_1fr] gap-4 sm:gap-6 items-end">
            {/* Playback controls */}
            <div className="flex items-center gap-1 justify-center sm:justify-start">
              <button
                onClick={() => player.skipBackward(5)}
                className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="-5s"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="19 20 9 12 19 4 19 20" />
                  <line x1="5" y1="19" x2="5" y2="5" />
                </svg>
              </button>
              <button
                onClick={() => (player.isPlaying ? player.pause() : player.play())}
                className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                {player.isPlaying ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => player.skipForward(5)}
                className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="+5s"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 4 15 12 5 20 5 4" />
                  <line x1="19" y1="5" x2="19" y2="19" />
                </svg>
              </button>
            </div>

            {/* Start time */}
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                {t("markStart").replace("Marcar ", "")} (HH:MM:SS)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={startInput}
                  onChange={(e) => setStartInput(e.target.value)}
                  onBlur={commitStartInput}
                  onKeyDown={(e) => handleInputKeyDown(e, commitStartInput)}
                  className="w-[100px] tabular-nums text-sm h-9 text-center"
                />
                <button
                  onClick={markStart}
                  className="h-9 px-3 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors whitespace-nowrap"
                >
                  {t("markStart")}
                </button>
              </div>
            </div>

            {/* End time */}
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                {t("markEnd").replace("Marcar ", "")} (HH:MM:SS)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={endInput}
                  onChange={(e) => setEndInput(e.target.value)}
                  onBlur={commitEndInput}
                  onKeyDown={(e) => handleInputKeyDown(e, commitEndInput)}
                  className="w-[100px] tabular-nums text-sm h-9 text-center"
                />
                <button
                  onClick={markEnd}
                  className="h-9 px-3 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors whitespace-nowrap"
                >
                  {t("markEnd")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quality + Create */}
      <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-serif font-semibold text-foreground mb-3">
              {t("quality")}
            </p>

            {formatsLoading ? (
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-24 rounded-lg" />
                ))}
              </div>
            ) : formats.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("noFormats")}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {formats.map((fmt) => (
                  <button
                    key={fmt.height}
                    type="button"
                    onClick={() => setSelectedFormat(fmt)}
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-sm transition-all",
                      selectedFormat?.height === fmt.height
                        ? "border-amber-500 bg-amber-500/5 text-foreground font-semibold ring-1 ring-amber-500/30"
                        : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>{fmt.resolution}</span>
                    <span className="text-[11px] opacity-50">
                      ~{formatFileSize(fmt.estimated_size_mb)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {sizeWarning && (
              <Alert variant="destructive" className="mt-3 py-2">
                <AlertDescription className="text-xs">
                  {t("sizeWarning")}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex flex-col items-stretch sm:items-end gap-2 sm:pt-8">
            <button
              onClick={() => mutation.mutate()}
              disabled={!canSubmit}
              className="h-11 px-8 rounded-xl bg-amber-500 text-stone-950 text-sm font-bold hover:bg-amber-400 transition-all shadow-sm shadow-amber-500/20 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.97]"
            >
              {mutation.isPending ? t("submitting") : t("submit")}
            </button>
            {mutation.isError && (
              <p className="text-xs text-red-600 text-right">
                {(mutation.error as Error).message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
