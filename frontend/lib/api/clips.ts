import apiClient from "./client";
import {
  Clip,
  ClipListResponse,
  ClipProgress,
  VideoFormatsResponse,
} from "../types/clip";

export async function createClip(data: {
  video_id: string;
  start_time: number;
  end_time: number;
  quality: string;
  clip_type?: string;
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
