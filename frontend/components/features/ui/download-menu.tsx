"use client";

import { useEffect, useRef, useState } from "react";
import {
  Captions,
  ChevronDown,
  Download,
  FileText,
  Mic,
  Scissors,
  Video as VideoIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Btn } from "./btn";

interface DownloadOption {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  meta: string;
  primary?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
}

interface DownloadMenuProps {
  options: DownloadOption[];
  label?: string;
  defaultOpen?: boolean;
  className?: string;
}

export function DownloadMenu({
  options,
  label = "Baixar",
  defaultOpen = false,
  className,
}: DownloadMenuProps) {
  const [open, setOpen] = useState(defaultOpen);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const primary = options.filter((o) => !isSecondary(o));
  const secondary = options.filter((o) => isSecondary(o));

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Btn
        size="sm"
        variant="secondary"
        icon={<Download className="h-3 w-3" />}
        iconRight={<ChevronDown className="h-[11px] w-[11px]" />}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </Btn>
      {open && (
        <div
          className="absolute right-0 top-[calc(100%+6px)] z-30 min-w-[280px] rounded-xl border border-qs-line bg-qs-bg-elev p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.02)]"
        >
          <div className="px-2.5 pb-2 pt-1.5">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[1px] text-qs-fg-faint">
              Downloads disponíveis
            </span>
          </div>
          {primary.map((opt) => (
            <DownloadItem key={opt.id} option={opt} onClose={() => setOpen(false)} />
          ))}
          {secondary.length > 0 && (
            <>
              <div className="mx-2 my-1 h-px bg-qs-line" />
              {secondary.map((opt) => (
                <DownloadItem
                  key={opt.id}
                  option={opt}
                  onClose={() => setOpen(false)}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function DownloadItem({
  option,
  onClose,
}: {
  option: DownloadOption;
  onClose: () => void;
}) {
  const Icon = option.icon;
  return (
    <button
      type="button"
      disabled={option.disabled}
      onClick={() => {
        option.onSelect?.();
        onClose();
      }}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        option.primary
          ? "bg-[rgba(245,158,11,0.06)] hover:bg-[rgba(245,158,11,0.10)]"
          : "hover:bg-qs-bg-subtle",
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
          option.primary
            ? "border-[rgba(245,158,11,0.25)] bg-[rgba(245,158,11,0.12)] text-qs-amber-bright"
            : "border-qs-line bg-qs-bg-elev-2 text-qs-fg-subtle",
        )}
      >
        <Icon className="h-3 w-3" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12.5px] font-medium text-qs-fg">
          {option.label}
        </span>
        <span className="mt-px block font-mono text-[10.5px] text-qs-fg-faint">
          {option.meta}
        </span>
      </span>
      <Download className="h-3 w-3 shrink-0 text-qs-fg-faint" />
    </button>
  );
}

function isSecondary(opt: DownloadOption): boolean {
  // Subtitles/transcript go below the divider.
  return opt.id === "captions" || opt.id === "transcript";
}

export const DownloadIcons = {
  video: VideoIcon,
  clip: Scissors,
  audio: Mic,
  captions: Captions,
  transcript: FileText,
};
