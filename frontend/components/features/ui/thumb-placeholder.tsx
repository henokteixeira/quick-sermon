import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThumbPlaceholderProps {
  width?: number | string;
  height?: number | string;
  label?: string;
  overlay?: React.ReactNode;
  imageUrl?: string;
  /**
   * Video URL used to render the first frame as thumbnail when `imageUrl`
   * is not available. Uses the native <video> element with a media fragment
   * (`#t=0.5`) so the browser paints frame ~0.5s without playing audio.
   */
  videoUrl?: string;
  className?: string;
}

export function ThumbPlaceholder({
  width = 180,
  height = 100,
  label,
  overlay,
  imageUrl,
  videoUrl,
  className,
}: ThumbPlaceholderProps) {
  const showStriped = !imageUrl && !videoUrl;

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-qs-line bg-black",
        className,
      )}
      style={{
        width,
        height,
        backgroundImage: imageUrl
          ? `url(${imageUrl})`
          : showStriped
            ? "repeating-linear-gradient(135deg, #1c1917 0 6px, #201c19 6px 12px)"
            : undefined,
        backgroundSize: imageUrl ? "cover" : undefined,
        backgroundPosition: "center",
      }}
    >
      {videoUrl && !imageUrl && (
        <video
          src={`${videoUrl}#t=0.5`}
          preload="metadata"
          muted
          playsInline
          className="h-full w-full object-cover"
        />
      )}
      {showStriped && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
          <Play className="ml-[1px] h-3 w-3 text-qs-fg" fill="currentColor" />
        </div>
      )}
      {label && (
        <div className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-qs-fg">
          {label}
        </div>
      )}
      {overlay}
    </div>
  );
}
