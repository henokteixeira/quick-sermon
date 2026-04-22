"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClip, getVideoFormats } from "@/lib/api/clips";
import { getApiErrorMessage } from "@/lib/api/client";
import { VideoFormat } from "@/lib/types/clip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { parseTime, formatTime, formatFileSize } from "@/lib/formatters";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateClipFormProps {
  videoId: string;
  videoDuration: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateClipForm({
  videoId,
  videoDuration,
  open,
  onOpenChange,
}: CreateClipFormProps) {
  const t = useTranslations("clips.create");
  const queryClient = useQueryClient();

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);

  const startSeconds = parseTime(startTime);
  const endSeconds = parseTime(endTime);
  const clipDuration =
    startSeconds !== null && endSeconds !== null && endSeconds > startSeconds
      ? endSeconds - startSeconds
      : undefined;

  const {
    data: formatsData,
    isLoading: formatsLoading,
    error: formatsError,
  } = useQuery({
    queryKey: ["video-formats", videoId, clipDuration],
    queryFn: () => getVideoFormats(videoId, clipDuration),
    enabled: open,
    staleTime: 60_000,
    retry: false,
  });

  const formats = formatsData?.formats ?? [];
  const formatsErrorMessage = formatsError
    ? getApiErrorMessage(formatsError) ?? t("loadFormatsError")
    : null;

  useEffect(() => {
    if (formats.length > 0 && !selectedFormat) {
      const preferred = formats.find((f) => f.height === 1080) || formats[0];
      setSelectedFormat(preferred);
    }
  }, [formats, selectedFormat]);

  useEffect(() => {
    if (!open) {
      setStartTime("");
      setEndTime("");
      setSelectedFormat(null);
      setTimeError(null);
    }
  }, [open]);

  const estimatedSizeMb = selectedFormat?.estimated_size_mb ?? 0;
  const sizeWarning = estimatedSizeMb > 2048;

  const mutation = useMutation({
    mutationFn: () => {
      if (startSeconds === null || endSeconds === null || !selectedFormat) {
        throw new Error("Invalid input");
      }
      return createClip({
        video_id: videoId,
        start_time: startSeconds,
        end_time: endSeconds,
        quality: `${selectedFormat.height}p`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clips"] });
      onOpenChange(false);
    },
  });

  function validate(): boolean {
    setTimeError(null);

    if (startSeconds === null) {
      setTimeError(t("invalidTime"));
      return false;
    }
    if (endSeconds === null) {
      setTimeError(t("invalidTime"));
      return false;
    }
    if (endSeconds <= startSeconds) {
      setTimeError(t("invalidTime"));
      return false;
    }
    if (videoDuration && endSeconds > videoDuration) {
      setTimeError(t("invalidTime"));
      return false;
    }
    return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) {
      mutation.mutate();
    }
  }

  const canSubmit =
    startSeconds !== null &&
    endSeconds !== null &&
    endSeconds > startSeconds &&
    selectedFormat !== null &&
    !mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start-time" className="text-xs">
                {t("startTime")}
              </Label>
              <Input
                id="start-time"
                placeholder={t("startPlaceholder")}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end-time" className="text-xs">
                {t("endTime")}
              </Label>
              <Input
                id="end-time"
                placeholder={t("endPlaceholder")}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="tabular-nums"
              />
            </div>
          </div>

          {/* Duration hint */}
          {clipDuration && (
            <p className="text-xs text-muted-foreground -mt-2">
              {formatTime(clipDuration)}
            </p>
          )}

          {timeError && (
            <p className="text-xs text-red-600">{timeError}</p>
          )}

          {/* Quality selection */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t("quality")}</Label>
            {formatsLoading ? (
              <p className="text-xs text-muted-foreground">
                {t("loadingFormats")}
              </p>
            ) : formatsErrorMessage ? (
              <Alert variant="destructive" className="py-2">
                <AlertDescription className="text-xs">
                  {formatsErrorMessage}
                </AlertDescription>
              </Alert>
            ) : formats.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {t("noFormats")}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {formats.map((fmt) => (
                  <button
                    key={fmt.height}
                    type="button"
                    onClick={() => setSelectedFormat(fmt)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                      selectedFormat?.height === fmt.height
                        ? "border-accent bg-accent/10 text-foreground"
                        : "border-input hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <span className="font-medium">{fmt.resolution}</span>
                    <span className="text-xs opacity-70">
                      ~{formatFileSize(fmt.estimated_size_mb)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Size warning */}
          {sizeWarning && (
            <Alert variant="destructive" className="py-2">
              <AlertDescription className="text-xs">
                {t("sizeWarning")}
              </AlertDescription>
            </Alert>
          )}

          {/* Estimated size */}
          {selectedFormat && estimatedSizeMb > 0 && (
            <p className="text-xs text-muted-foreground">
              {t("estimatedSize")}: ~{formatFileSize(estimatedSizeMb)}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full h-10 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? t("submitting") : t("submit")}
          </button>

          {mutation.isError && (
            <p className="text-xs text-red-600 text-center">
              {(mutation.error as Error).message}
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
