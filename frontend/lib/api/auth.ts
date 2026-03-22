import apiClient from "./client";
import { LoginRequest, TokenResponse } from "../types/auth";

export async function login(data: LoginRequest): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>("/auth/login", data);
  return response.data;
}

export async function register(data: {
  email: string;
  password: string;
  name: string;
}): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>(
    "/auth/register",
    data
  );
  return response.data;
}

export async function refreshToken(token: string): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>("/auth/refresh", {
    refresh_token: token,
  });
  return response.data;
}
