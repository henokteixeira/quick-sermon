/** Format seconds as H:MM:SS */
export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Parse H:MM:SS or MM:SS string to seconds, returns null if invalid */
export function parseTime(value: string): number | null {
  const parts = value.split(":").map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 3) {
    const [h, m, s] = parts;
    if (m >= 60 || s >= 60 || h < 0 || m < 0 || s < 0) return null;
    return h * 3600 + m * 60 + s;
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    if (s >= 60 || m < 0 || s < 0) return null;
    return m * 60 + s;
  }
  return null;
}

/** Format megabytes as human-readable size (e.g. "350 MB", "1.2 GB") */
export function formatFileSize(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(0)} MB`;
}

/** Format bytes as human-readable size */
export function formatFileSizeFromBytes(bytes: number | null): string {
  if (!bytes) return "--";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(1)} MB`;
}

/** Format seconds as short duration for thumbnails (e.g. "1h30m", "3:45") */
export function formatDurationShort(seconds: number | null): string {
  if (!seconds) return "--";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}m`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Format seconds as compact duration (e.g. "1h30m00s", "45m12s") */
export function formatDuration(seconds: number | null): string {
  if (!seconds) return "--";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}h${String(m).padStart(2, "0")}m${String(s).padStart(2, "0")}s`;
  return `${m}m${String(s).padStart(2, "0")}s`;
}

/** Format view count with K/M suffixes */
export function formatViews(count: number | null): string {
  if (!count) return "--";
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toLocaleString("pt-BR");
}

/** Format YYYYMMDD string to localized date */
export function formatUploadDate(dateStr: string | null): string {
  if (!dateStr || dateStr.length !== 8) return "--";
  const y = dateStr.slice(0, 4);
  const m = dateStr.slice(4, 6);
  const d = dateStr.slice(6, 8);
  return new Date(`${y}-${m}-${d}`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Format ISO date string to localized date */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
