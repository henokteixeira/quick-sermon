import apiClient from "./client";
import {
  Clip,
  ClipDraftUpdate,
  ClipListResponse,
  ClipPipeline,
  ClipProgress,
  ClipPublishResponse,
  ClipReviewData,
  ClipYouTubeStats,
  RegenerateField,
  VideoFormatsResponse,
} from "../types/clip";

export async function createClip(data: {
  video_id: string;
  start_time: number;
  end_time: number;
  quality: string;
  clip_type?: string;
  format_id?: string;
}): Promise<Clip> {
  const response = await apiClient.post<Clip>("/clips", data);
  return response.data;
}

export async function listClips(params?: {
  video_id?: string;
  status?: string;
  page?: number;
  page_size?: number;
}): Promise<ClipListResponse> {
  const response = await apiClient.get<ClipListResponse>("/clips", { params });
  return response.data;
}

export async function getClip(id: string): Promise<Clip> {
  const response = await apiClient.get<Clip>(`/clips/${id}`);
  return response.data;
}

export async function getClipProgress(id: string): Promise<ClipProgress> {
  const response = await apiClient.get<ClipProgress>(`/clips/${id}/progress`);
  return response.data;
}

export async function retryClip(id: string): Promise<Clip> {
  const response = await apiClient.post<Clip>(`/clips/${id}/retry`);
  return response.data;
}

export async function deleteClip(id: string): Promise<void> {
  await apiClient.delete(`/clips/${id}`);
}

export async function getClipStreamUrl(id: string): Promise<string> {
  const response = await apiClient.get<{ url: string }>(`/clips/${id}/stream-url`);
  const baseURL = apiClient.defaults.baseURL || "";
  // response.data.url is "/api/clips/{id}/stream?token=..." (absolute path)
  // baseURL is "http://localhost/api" — extract origin to build full URL
  const url = new URL(baseURL);
  return `${url.origin}${response.data.url}`;
}

export async function getVideoFormats(
  videoId: string,
  clipDuration?: number
): Promise<VideoFormatsResponse> {
  const response = await apiClient.get<VideoFormatsResponse>(
    `/videos/${videoId}/formats`,
    { params: clipDuration ? { clip_duration: clipDuration } : undefined }
  );
  return response.data;
}

export async function getClipReview(id: string): Promise<ClipReviewData> {
  const response = await apiClient.get<ClipReviewData>(`/clips/${id}/review`);
  return response.data;
}

export async function saveClipDraft(
  id: string,
  data: ClipDraftUpdate
): Promise<Clip> {
  const response = await apiClient.patch<Clip>(`/clips/${id}/draft`, data);
  return response.data;
}

export async function publishClip(id: string): Promise<ClipPublishResponse> {
  const response = await apiClient.post<ClipPublishResponse>(
    `/clips/${id}/publish`
  );
  return response.data;
}

export async function discardClip(id: string): Promise<Clip> {
  const response = await apiClient.post<Clip>(`/clips/${id}/discard`);
  return response.data;
}

export async function regenerateField(
  id: string,
  field: RegenerateField
): Promise<void> {
  await apiClient.post(`/clips/${id}/regenerate/${field}`);
}

export async function getClipPipeline(id: string): Promise<ClipPipeline> {
  const response = await apiClient.get<ClipPipeline>(`/clips/${id}/pipeline`);
  return response.data;
}

export async function getClipYouTubeStats(
  id: string
): Promise<ClipYouTubeStats> {
  const response = await apiClient.get<ClipYouTubeStats>(
    `/clips/${id}/youtube-stats`
  );
  return response.data;
}
