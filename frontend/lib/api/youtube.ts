import apiClient from "./client";
import {
  YouTubeConnection,
  YouTubeUpload,
  YouTubeQuota,
  OAuthAuthorizeResponse,
} from "../types/youtube";

export async function getOAuthAuthorizeUrl(): Promise<string> {
  const response = await apiClient.get<OAuthAuthorizeResponse>(
    "/youtube/oauth/authorize"
  );
  return response.data.authorize_url;
}

export async function getYouTubeConnection(): Promise<YouTubeConnection | null> {
  const response = await apiClient.get<YouTubeConnection | null>(
    "/youtube/connection"
  );
  return response.data;
}

export async function disconnectYouTube(): Promise<void> {
  await apiClient.delete("/youtube/connection");
}

export async function triggerUpload(data: {
  clip_id: string;
  title?: string;
  description?: string;
}): Promise<YouTubeUpload> {
  const response = await apiClient.post<YouTubeUpload>("/youtube/uploads", data);
  return response.data;
}

export async function getUploadByClip(clipId: string): Promise<YouTubeUpload | null> {
  const response = await apiClient.get<YouTubeUpload | null>(
    `/youtube/uploads/clip/${clipId}`
  );
  return response.data;
}

export async function getYouTubeQuota(): Promise<YouTubeQuota> {
  const response = await apiClient.get<YouTubeQuota>("/youtube/quota");
  return response.data;
}
