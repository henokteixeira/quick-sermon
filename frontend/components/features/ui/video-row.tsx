import Link from "next/link";
import { ChevronRight, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThumbPlaceholder } from "./thumb-placeholder";

interface VideoRowProps {
  href: string;
  title: string;
  channel?: string;
  date?: string;
  duration?: string;
  clipsCount: number;
  thumbnailUrl?: string;
  className?: string;
}

export function VideoRow({
  href,
  title,
  channel,
  date,
  duration,
  clipsCount,
  thumbnailUrl,
  className,
}: VideoRowProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-4 overflow-hidden rounded-xl border border-qs-line bg-qs-bg-elev p-3 transition-colors hover:border-[rgba(245,158,11,0.2)] hover:bg-[rgba(245,158,11,0.03)]",
        className,
      )}
    >
      <ThumbPlaceholder
        width={140}
        height={80}
        label={duration}
        imageUrl={thumbnailUrl}
      />

      <div className="min-w-0 flex-1">
        <div className="mb-1 truncate text-[14px] font-medium text-qs-fg">
          {title}
        </div>
        <div className="mb-2 text-[11px] text-qs-fg-faint">
          {channel}
          {channel && date && " · "}
          {date}
        </div>
        {clipsCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-qs-fg-subtle">
            <Scissors className="h-3 w-3" />
            {clipsCount} {clipsCount === 1 ? "clipe" : "clipes"}
          </span>
        ) : (
          <span className="text-[11px] text-qs-fg-faint">Sem clipes ainda</span>
        )}
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-qs-fg-ghost" />
    </Link>
  );
}
