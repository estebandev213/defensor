export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "DATABASE_UNAVAILABLE"
  | "EMBEDDING_PROVIDER_ERROR"
  | "LLM_PROVIDER_ERROR"
  | "RETRIEVAL_ERROR"
  | "INSUFFICIENT_EVIDENCE"
  | "CITATION_VALIDATION_FAILED"
  | "UNSUPPORTED_CATEGORY"
  | "TIMEOUT"
  | "INTERNAL_ERROR";

export function publicError(code: AppErrorCode): { error: AppErrorCode } {
  return { error: code };
}

