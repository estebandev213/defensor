import { z } from "zod";

export type ProviderKind = "llm" | "embedding";

export interface ProviderFetch {
  (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

export class ProviderUnavailableError extends Error {
  public readonly code: "PROVIDER_UNAVAILABLE" | "PROVIDER_RATE_LIMITED" = "PROVIDER_UNAVAILABLE";

  public constructor(
    message: string,
    public readonly provider: ProviderKind,
  ) {
    super(message);
    this.name = "ProviderUnavailableError";
  }
}

/**
 * An upstream 429 is not the same failure as an outage: retrying makes it
 * strictly worse, because the tokens a retry reserves count against the same
 * window that is already exhausted. It subclasses ProviderUnavailableError so
 * existing catch sites keep degrading safely, while callers that can back off
 * are able to tell the two apart.
 */
export class ProviderRateLimitError extends ProviderUnavailableError {
  public override readonly code = "PROVIDER_RATE_LIMITED" as const;

  public constructor(
    message: string,
    provider: ProviderKind,
    /** Seconds the provider asked us to wait, when it said. */
    public readonly retryAfterSeconds: number | null = null,
  ) {
    super(message, provider);
    this.name = "ProviderRateLimitError";
  }
}

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMStructuredInput {
  messages: readonly LLMMessage[];
  temperature?: number;
  maxOutputTokens?: number;
}

export type LLMAnswerInput = LLMStructuredInput;

export interface LLMProvider {
  streamAnswer(input: LLMAnswerInput): Promise<ReadableStream<Uint8Array>>;
  generateStructured<T>(input: LLMStructuredInput, schema: z.ZodSchema<T>): Promise<T>;
}

export interface EmbeddingProvider {
  embedDocuments(texts: string[]): Promise<number[][]>;
  embedQuery(text: string): Promise<number[]>;
}

export interface ProviderConfig {
  provider: string;
  apiKey: string;
  model: string;
  baseUrl?: string;
  dimensions?: number;
  fetcher?: ProviderFetch;
}
