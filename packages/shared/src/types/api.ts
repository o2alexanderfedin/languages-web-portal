/**
 * API error type discriminator for INFRA-04
 */
export type ApiErrorType = "user_error" | "system_error";

/**
 * API error structure
 */
export interface ApiError {
  type: ApiErrorType;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * API response envelope
 */
export type ApiResponse<T> = { data: T } | { error: ApiError };

/**
 * Health check response structure
 */
export interface HealthResponse {
  status: "ok";
  timestamp: number;
  uptime: number;
  environment: string;
  version: string;
}
