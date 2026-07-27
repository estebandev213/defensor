import { z } from "zod";

export type ProviderKind = "llm" | "embedding";

export interface ProviderFetch {
  (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

export class ProviderUnavailableError extends Error {
  public readonly code = "PROVIDER_UNAVAILABLE" as const;

  public constructor(
    message: string,
    public readonly provider: ProviderKind,
  ) {
    super(message);
    this.name = "ProviderUnavailableError";
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
