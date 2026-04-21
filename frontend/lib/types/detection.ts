export type DetectionStatus = "running" | "completed" | "failed" | "skipped";

export type DetectionMethod = "chapters" | "captions" | "cascade";

export interface Detection {
  id: string;
  video_id: string;
  status: DetectionStatus;
  method: DetectionMethod | null;
  start_seconds: number | null;
  end_seconds: number | null;
  confidence: number | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}
