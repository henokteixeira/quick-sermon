import { isAxiosError } from "axios";

import apiClient from "./client";
import { Detection } from "../types/detection";

export async function getDetection(videoId: string): Promise<Detection | null> {
  try {
    const response = await apiClient.get<Detection>(
      `/videos/${videoId}/detection`
    );
    return response.data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function retryDetection(videoId: string): Promise<Detection> {
  const response = await apiClient.post<Detection>(
    `/videos/${videoId}/detection/retry`
  );
  return response.data;
}
