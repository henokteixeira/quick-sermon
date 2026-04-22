export type ClipType = "sermon" | "short";

export type ClipStatus =
  | "pending"
  | "downloading"
  | "trimming"
  | "ready"
  | "uploading"
  | "awaiting_review"
  | "published"
  | "discarded"
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
  selected_title?: string | null;
  description?: string | null;
  whatsapp_message?: string | null;
  published_at: string | null;
  discarded_at: string | null;
  downloaded_at: string | null;
  trimmed_at: string | null;
  uploaded_at: string | null;
  created_at: string;
  video_thumbnail_url?: string | null;
}

export interface ClipReviewData {
  id: string;
  video_id: string;
  status: ClipStatus;
  start_time: number;
  end_time: number;
  duration: number | null;
  file_path: string | null;
  generated_titles: string[] | null;
  generated_description: string | null;
  generated_whatsapp_message: string | null;
  selected_title: string | null;
  description: string | null;
  whatsapp_message: string | null;
  published_at: string | null;
  discarded_at: string | null;
  youtube_video_id: string | null;
  youtube_url: string | null;
  can_publish: boolean;
  can_discard: boolean;
}

export interface ClipDraftUpdate {
  selected_title?: string | null;
  description?: string | null;
  whatsapp_message?: string | null;
}

export interface ClipPublishResponse {
  id: string;
  status: ClipStatus;
  published_at: string | null;
  youtube_url: string | null;
}

export type RegenerateField = "titles" | "description" | "whatsapp_message";

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

export type PipelineStageStatus = "pending" | "running" | "completed" | "error";

export interface ClipPipelineStage {
  status: PipelineStageStatus;
  percent: number | null;
  speed: string | null;
  completed_at: string | null;
  error_code: string | null;
  error_message: string | null;
}

export interface ClipPipeline {
  download: ClipPipelineStage;
  trim: ClipPipelineStage;
  upload: ClipPipelineStage;
}

export interface ClipYouTubeStats {
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
}
