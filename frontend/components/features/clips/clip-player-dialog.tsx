"use client";

import { useRef, useEffect, useState } from "react";
import { Clip } from "@/lib/types/clip";
import { getClipStreamUrl } from "@/lib/api/clips";
import { formatTime, formatFileSizeFromBytes } from "@/lib/formatters";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ClipPlayerDialogProps {
  clip: Clip | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClipPlayerDialog({
  clip,
  open,
  onOpenChange,
}: ClipPlayerDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (open && clip) {
      setLoading(true);
      setStreamUrl(null);
      getClipStreamUrl(clip.id)
        .then((url) => {
          if (cancelled) return;
          setStreamUrl(url);
          setTimeout(() => {
            if (!cancelled && videoRef.current) {
              videoRef.current.load();
              videoRef.current.play().catch(() => {});
            }
          }, 0);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } else {
      videoRef.current?.pause();
      setStreamUrl(null);
    }

    return () => {
      cancelled = true;
    };
  }, [open, clip]);

  if (!clip) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden gap-0">
        <div className="bg-black rounded-t-lg">
          {loading || !streamUrl ? (
            <div className="w-full aspect-video flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
            </div>
          ) : (
            <video
              ref={videoRef}
              controls
              autoPlay
              src={streamUrl}
              className="w-full aspect-video"
              key={streamUrl}
            />
          )}
        </div>

        <div className="px-5 py-4">
          <DialogHeader className="mb-3">
            <DialogTitle className="text-base font-serif">
              {formatTime(clip.start_time)} — {formatTime(clip.end_time)}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500">
            {clip.resolution && (
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                {clip.resolution}
              </span>
            )}
            {clip.duration != null && clip.duration > 0 && (
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {formatTime(clip.duration)}
              </span>
            )}
            {clip.file_size && (
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {formatFileSizeFromBytes(clip.file_size)}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-medium">
              {clip.quality}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
