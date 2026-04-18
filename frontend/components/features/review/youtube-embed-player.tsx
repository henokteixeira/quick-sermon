"use client";

interface YouTubeEmbedPlayerProps {
  videoId: string;
  title?: string;
}

export function YouTubeEmbedPlayer({ videoId, title }: YouTubeEmbedPlayerProps) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
      <iframe
        className="absolute inset-0 h-full w-full"
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
        title={title || "YouTube video player"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
