export interface ApiError {
  code: string;
  message: string;
}

export type ApiResult<T> =
  { success: true; data: T } | { success: false; error: ApiError };

export const API_ERROR_CODES = {
  QUEUE_LIMIT_REACHED: "QUEUE_LIMIT_REACHED",
  PLAYLIST_LIMIT_REACHED: "PLAYLIST_LIMIT_REACHED",
  UNAUTHORIZED: "UNAUTHORIZED",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  YOUTUBE_SEARCH_FAILED: "YOUTUBE_SEARCH_FAILED",
  UNKNOWN: "UNKNOWN"
} as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];
