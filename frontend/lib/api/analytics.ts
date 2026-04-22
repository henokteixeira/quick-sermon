import apiClient from "./client";
import {
  AnalyticsSummary,
  ClipsStatsResponse,
} from "../types/analytics";

export async function getClipsStats(
  status: string = "published"
): Promise<ClipsStatsResponse> {
  const response = await apiClient.get<ClipsStatsResponse>(
    "/analytics/clips-stats",
    { params: { status } }
  );
  return response.data;
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const response = await apiClient.get<AnalyticsSummary>("/analytics/summary");
  return response.data;
}
