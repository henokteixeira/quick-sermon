export interface ApiError {
  error: {
    code: string;
    message: string;
    details: Record<string, unknown> | null;
    timestamp: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
