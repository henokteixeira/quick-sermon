export type VideoStatus =
  | "pending"
  | "detecting"
  | "processing"
  | "awaiting_review"
  | "published"
  | "error";

export interface Video {
  id: string;
  source_url: string;
  title: string | null;
  duration: number | null;
  thumbnail_url: string | null;
  status: VideoStatus;
  youtube_video_id: string | null;
  sermon_start: number | null;
  sermon_end: number | null;
  confidence: number | null;
  selected_title: string | null;
  created_at: string;
}

export interface VideoListResponse {
  items: Video[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
