import axios, { AxiosRequestConfig } from "axios";

interface RetryableRequest extends AxiosRequestConfig {
  _retry?: boolean;
}

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest: RetryableRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (typeof window !== "undefined") {
        const refreshToken = localStorage.getItem("refresh_token");

        if (refreshToken) {
          try {
            const { data } = await axios.post(
              `${apiClient.defaults.baseURL}/auth/refresh`,
              { refresh_token: refreshToken }
            );
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("refresh_token", data.refresh_token);
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${data.access_token}`,
            };
            return apiClient(originalRequest);
          } catch {
            // Refresh failed — clear and redirect
          }
        }

        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

/** Extract error code from an Axios error response */
export function getApiErrorCode(error: unknown): string {
  return (
    (error as { response?: { data?: { error?: { code?: string } } } })
      ?.response?.data?.error?.code || "unknown"
  );
}

/** Extract human-readable error message from an Axios error response */
export function getApiErrorMessage(error: unknown): string | null {
  return (
    (error as { response?: { data?: { error?: { message?: string } } } })
      ?.response?.data?.error?.message || null
  );
}
