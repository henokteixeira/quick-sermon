export interface ClipStatsItem {
  clip_id: string;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
}

export interface ClipsStatsResponse {
  items: ClipStatsItem[];
}

export interface AnalyticsSummary {
  total_views: number | null;
  total_likes: number | null;
  total_comments: number | null;
  published_clips: number;
  processed_duration_seconds: number;
}
