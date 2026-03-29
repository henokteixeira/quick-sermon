export type YouTubeUploadStatus = "uploading" | "completed" | "failed";

export type YouTubeUploadErrorCode =
  | "quota_exceeded"
  | "auth_expired"
  | "upload_failed"
  | "file_not_found"
  | "network_error";

export interface YouTubeConnection {
  id: string;
  channel_id: string;
  channel_title: string;
  connected_by: string;
  created_at: string;
}

export interface YouTubeUpload {
  id: string;
  clip_id: string;
  youtube_video_id: string | null;
  youtube_url: string | null;
  youtube_status: YouTubeUploadStatus;
  title: string;
  description: string | null;
  error_code: YouTubeUploadErrorCode | null;
  error_message: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface YouTubeQuota {
  daily_limit: number;
  used: number;
  remaining: number;
  percent_used: number;
  warning: boolean;
  blocked: boolean;
}

export interface OAuthAuthorizeResponse {
  authorize_url: string;
}
