export type ClipType = "sermon" | "short";

export type ClipStatus =
  | "pending"
  | "downloading"
  | "trimming"
  | "ready"
  | "uploading"
  | "published"
  | "error";

export type ClipErrorCode =
  | "download_failed"
  | "download_timeout"
  | "trim_failed"
  | "trim_corrupted"
  | "invalid_timestamps"
  | "video_unavailable";

export interface Clip {
  id: string;
  video_id: string;
  clip_type: ClipType;
  status: ClipStatus;
  start_time: number;
  end_time: number;
  quality: string;
  file_path: string | null;
  file_size: number | null;
  duration: number | null;
  resolution: string | null;
  error_code: ClipErrorCode | null;
  error_message: string | null;
  submitted_by: string | null;
  created_at: string;
}

export interface ClipListResponse {
  items: Clip[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ClipProgress {
  clip_id: string;
  status: ClipStatus;
  percent: number;
  speed: string | null;
  stage: string;
  started_at: number | null;
}

export interface VideoFormat {
  resolution: string;
  height: number;
  estimated_size_mb: number;
  format_id?: string;
}

export interface VideoFormatsResponse {
  video_id: string;
  duration: number | null;
  formats: VideoFormat[];
}
