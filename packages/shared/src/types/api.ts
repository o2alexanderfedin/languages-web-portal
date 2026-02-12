export type ApiErrorType = 'user_error' | 'system_error';

export interface ApiError {
  type: ApiErrorType;
  message: string;
  details?: Record<string, unknown>;
}

export type ApiResponse<T> = { data: T } | { error: ApiError };

export interface HealthResponse {
  status: 'ok';
  timestamp: number;
  uptime: number;
  environment: string;
  version: string;
}
