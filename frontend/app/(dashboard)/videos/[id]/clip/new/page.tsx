"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVideo } from "@/lib/api/videos";
import { createClip, getVideoFormats } from "@/lib/api/clips";
import { VideoFormat } from "@/lib/types/clip";
import { useYouTubePlayer } from "@/lib/hooks/use-youtube-player";
import { formatTime, parseTime, formatFileSize } from "@/lib/formatters";
import { VideoTimeline } from "@/components/features/clips/video-timeline";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClipEditorPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("clips.editor");

  const { data: video, isLoading: videoLoading } = useQuery({
    queryKey: ["video", id],
    queryFn: () => getVideo(id),
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
      const defaultStart = Math.round(videoDuration * 0.1);
      const defaultEnd = Math.min(videoDuration, Math.round(videoDuration * 0.6));
      setStartTime(defaultStart);
      setEndTime(defaultEnd);
      setStartInput(formatTime(defaultStart));
      setEndInput(formatTime(defaultEnd));
    }
  }, [videoDuration, endTime]);

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
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clips", id] });
      router.push(`/videos/${id}`);
    },
  });

  const estimatedSizeMb = selectedFormat?.estimated_size_mb ?? 0;
  const sizeWarning = estimatedSizeMb > 2048;
  const canSubmit =
    startTime < endTime && clipDuration > 0 && selectedFormat && !mutation.isPending;

  if (videoLoading) {
    return (
      <div className="max-w-[960px] mx-auto space-y-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="aspect-video rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (!video) return null;

  return (
    <div className="max-w-[960px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/videos/${id}`}
          className="w-8 h-8 rounded-lg border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:border-stone-300 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-lg font-serif text-foreground leading-tight">
            {video.title || t("title")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {video.channel_name}
            {video.upload_date && ` \u2022 ${video.upload_date.replace(/(\d{4})(\d{2})(\d{2})/, "$3/$2/$1")}`}
          </p>
        </div>
      </div>

      {/* Video Player — YouTube native controls, no overlay */}
      <div className="rounded-xl overflow-hidden bg-black mb-5">
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

      {/* Timeline + Controls */}
      <Card className="p-6 mb-5">
        <p className="text-sm font-semibold text-foreground mb-5">
          {t("timeline")}
        </p>

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
        <div className="flex flex-wrap items-end justify-center gap-6 mt-6 pt-5 border-t border-stone-100 dark:border-stone-800">
          {/* Playback controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => player.skipBackward(5)}
              className="w-9 h-9 rounded-lg border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-500 hover:text-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              title="-5s"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="19 20 9 12 19 4 19 20" />
                <line x1="5" y1="19" x2="5" y2="5" />
              </svg>
            </button>
            <button
              onClick={() => (player.isPlaying ? player.pause() : player.play())}
              className="w-10 h-10 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 flex items-center justify-center hover:opacity-90 transition-opacity"
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
              className="w-9 h-9 rounded-lg border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-500 hover:text-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
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
            <label className="block text-[10px] font-medium text-stone-400 uppercase tracking-wider mb-1.5">
              Início (HH:MM:SS)
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
                className="h-9 px-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors whitespace-nowrap dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
              >
                {t("markStart")}
              </button>
            </div>
          </div>

          {/* End time */}
          <div>
            <label className="block text-[10px] font-medium text-stone-400 uppercase tracking-wider mb-1.5">
              Fim (HH:MM:SS)
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
                className="h-9 px-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 transition-colors whitespace-nowrap dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
              >
                {t("markEnd")}
              </button>
            </div>
          </div>

          {/* Sermon duration */}
          <div>
            <label className="block text-[10px] font-medium text-stone-400 uppercase tracking-wider mb-1.5">
              {t("sermonDuration")}
            </label>
            <div className="h-9 px-4 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center">
              <span className="text-sm font-bold tabular-nums text-foreground">
                {formatTime(clipDuration)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Quality + Create */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <p className="text-sm font-semibold text-foreground mb-3">
              {t("quality")}
            </p>

            {formatsLoading ? (
              <p className="text-xs text-muted-foreground">{t("loadingFormats")}</p>
            ) : formats.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("noFormats")}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {formats.map((fmt) => (
                  <button
                    key={fmt.height}
                    type="button"
                    onClick={() => setSelectedFormat(fmt)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                      selectedFormat?.height === fmt.height
                        ? "border-stone-900 dark:border-stone-100 bg-stone-900/5 dark:bg-stone-100/5 text-foreground font-medium"
                        : "border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-500"
                    }`}
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

          <div className="flex flex-col items-end gap-2 pt-7">
            <button
              onClick={() => mutation.mutate()}
              disabled={!canSubmit}
              className="h-11 px-8 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? t("submitting") : t("submit")}
            </button>
            {mutation.isError && (
              <p className="text-xs text-red-600">
                {(mutation.error as Error).message}
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
