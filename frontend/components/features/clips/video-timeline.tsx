"use client";

import { useRef, useState, useCallback } from "react";
import { formatTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";

function generateTimeMarkers(duration: number): number[] {
  if (duration <= 0) return [];
  const count = 5;
  const step = duration / count;
  const markers: number[] = [0];
  for (let i = 1; i < count; i++) {
    markers.push(Math.round(i * step));
  }
  markers.push(duration);
  return markers;
}

type DragTarget = "start" | "end" | "region" | "playhead" | null;

interface VideoTimelineProps {
  duration: number;
  startTime: number;
  endTime: number;
  currentTime: number;
  onStartChange: (time: number) => void;
  onEndChange: (time: number) => void;
  onSeek: (time: number) => void;
}

export function VideoTimeline({
  duration,
  startTime,
  endTime,
  currentTime,
  onStartChange,
  onEndChange,
  onSeek,
}: VideoTimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<DragTarget>(null);
  const dragOriginRef = useRef<{ x: number; startTime: number; endTime: number }>({
    x: 0,
    startTime: 0,
    endTime: 0,
  });

  const toPercent = useCallback(
    (time: number) => (duration > 0 ? (time / duration) * 100 : 0),
    [duration]
  );

  const toTime = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track || duration <= 0) return 0;
      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.round(ratio * duration);
    },
    [duration]
  );

  const handlePointerDown = useCallback(
    (type: DragTarget) => (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(type);
      dragOriginRef.current = { x: e.clientX, startTime, endTime };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [startTime, endTime]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const time = toTime(e.clientX);

      if (dragging === "start") {
        onStartChange(Math.max(0, Math.min(time, endTime - 1)));
      } else if (dragging === "end") {
        onEndChange(Math.min(duration, Math.max(time, startTime + 1)));
      } else if (dragging === "playhead") {
        onSeek(Math.max(0, Math.min(time, duration)));
      } else if (dragging === "region") {
        const track = trackRef.current;
        if (!track) return;
        const rect = track.getBoundingClientRect();
        const dx = e.clientX - dragOriginRef.current.x;
        const dtSeconds = (dx / rect.width) * duration;
        const origStart = dragOriginRef.current.startTime;
        const origEnd = dragOriginRef.current.endTime;
        const regionLen = origEnd - origStart;

        let newStart = Math.round(origStart + dtSeconds);
        let newEnd = Math.round(origEnd + dtSeconds);

        if (newStart < 0) {
          newStart = 0;
          newEnd = regionLen;
        }
        if (newEnd > duration) {
          newEnd = duration;
          newStart = duration - regionLen;
        }

        onStartChange(newStart);
        onEndChange(newEnd);
      }
    },
    [dragging, toTime, startTime, endTime, duration, onStartChange, onEndChange, onSeek]
  );

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      if (dragging) return;
      const time = toTime(e.clientX);
      onSeek(time);
    },
    [dragging, toTime, onSeek]
  );

  const markers = generateTimeMarkers(duration);
  const startPct = toPercent(startTime);
  const endPct = toPercent(endTime);
  const currentPct = toPercent(currentTime);

  return (
    <div className="select-none">
      {/* Handle labels */}
      <div className="relative h-6 mb-1.5">
        <div
          className="absolute -translate-x-1/2"
          style={{ left: `${startPct}%` }}
        >
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500 text-white leading-none shadow-sm">
            Início
          </span>
        </div>
        <div
          className="absolute -translate-x-1/2"
          style={{ left: `${endPct}%` }}
        >
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-500 text-white leading-none shadow-sm">
            Fim
          </span>
        </div>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        className="relative h-11 rounded-xl bg-stone-100 dark:bg-stone-800/50 cursor-pointer border border-stone-200/60 dark:border-stone-700/40"
        onClick={handleTrackClick}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Unselected fade - left */}
        <div
          className="absolute inset-y-0 left-0 rounded-l-xl bg-stone-200/40 dark:bg-stone-700/30"
          style={{ width: `${startPct}%` }}
        />

        {/* Unselected fade - right */}
        <div
          className="absolute inset-y-0 right-0 rounded-r-xl bg-stone-200/40 dark:bg-stone-700/30"
          style={{ width: `${100 - endPct}%` }}
        />

        {/* Selected region — draggable */}
        <div
          className={cn(
            "absolute inset-y-0 bg-blue-500/12 border-y-2 border-blue-400/30 transition-colors",
            dragging === "region" ? "bg-blue-500/20 cursor-grabbing" : "cursor-grab hover:bg-blue-500/18"
          )}
          style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
          onPointerDown={handlePointerDown("region")}
        />

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 z-10"
          style={{ left: `${currentPct}%` }}
        >
          <div className="absolute inset-y-1 left-0 w-[2px] -translate-x-1/2 bg-stone-800 dark:bg-stone-200 rounded-full" />
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-stone-800 dark:bg-stone-200 shadow cursor-grab active:cursor-grabbing ring-2 ring-white dark:ring-stone-900"
            onPointerDown={handlePointerDown("playhead")}
          />
        </div>

        {/* Start handle */}
        <div
          className="absolute top-0 bottom-0 z-20"
          style={{ left: `${startPct}%` }}
        >
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[14px] h-9 rounded-md border-2 border-emerald-500 bg-white dark:bg-stone-900 shadow-md cursor-grab active:cursor-grabbing flex items-center justify-center transition-transform",
              dragging === "start" && "scale-110 ring-2 ring-emerald-400/40"
            )}
            onPointerDown={handlePointerDown("start")}
          >
            <div className="w-[2px] h-3.5 bg-emerald-500 rounded-full" />
          </div>
        </div>

        {/* End handle */}
        <div
          className="absolute top-0 bottom-0 z-20"
          style={{ left: `${endPct}%` }}
        >
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[14px] h-9 rounded-md border-2 border-red-500 bg-white dark:bg-stone-900 shadow-md cursor-grab active:cursor-grabbing flex items-center justify-center transition-transform",
              dragging === "end" && "scale-110 ring-2 ring-red-400/40"
            )}
            onPointerDown={handlePointerDown("end")}
          >
            <div className="w-[2px] h-3.5 bg-red-500 rounded-full" />
          </div>
        </div>
      </div>

      {/* Time markers */}
      <div className="relative h-5 mt-1.5">
        {markers.map((time, i) => (
          <span
            key={time}
            className={cn(
              "absolute text-[10px] text-stone-400 tabular-nums",
              i === 0 && "translate-x-0",
              i === markers.length - 1 && "-translate-x-full",
              i > 0 && i < markers.length - 1 && "-translate-x-1/2"
            )}
            style={{ left: `${toPercent(time)}%` }}
          >
            {formatTime(time)}
          </span>
        ))}
      </div>
    </div>
  );
}
