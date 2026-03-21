import apiClient from "./client";
import { Video, VideoListResponse } from "../types/video";

export async function createVideo(sourceUrl: string): Promise<Video> {
  const response = await apiClient.post<Video>("/api/videos", {
    source_url: sourceUrl,
  });
  return response.data;
}

export async function listVideos(params?: {
  status?: string;
  page?: number;
  page_size?: number;
}): Promise<VideoListResponse> {
  const response = await apiClient.get<VideoListResponse>("/api/videos", {
    params,
  });
  return response.data;
}

export async function getVideo(id: string): Promise<Video> {
  const response = await apiClient.get<Video>(`/api/videos/${id}`);
  return response.data;
}

export async function updateTimestamps(
  id: string,
  data: { sermon_start: number; sermon_end: number }
): Promise<Video> {
  const response = await apiClient.patch<Video>(
    `/api/videos/${id}/timestamps`,
    data
  );
  return response.data;
}

export async function publishVideo(id: string): Promise<Video> {
  const response = await apiClient.post<Video>(`/api/videos/${id}/publish`);
  return response.data;
}
