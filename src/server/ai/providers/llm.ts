import { z } from "zod";
import { env } from "@/server/security/env";
import {
  DEFAULT_GROQ_BASE_URL,
  DEFAULT_OPENAI_BASE_URL,
  getFetcher,
  normalizeBaseUrl,
  readJsonResponse,
} from "@/server/ai/providers/http";
import {
  ProviderUnavailableError,
  type LLMProvider,
  type LLMStructuredInput,
  type ProviderConfig,
} from "@/server/ai/providers/types";

const ChatResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string().nullable(),
        }),
      }),
    )
    .min(1),
});

function requireConfig(value: string | undefined, name: string): string {
  if (!value) throw new ProviderUnavailableError(`${name} is not configured.`, "llm");
  return value;
}

function providerBaseUrl(provider: string, configured?: string): string {
  if (configured) return normalizeBaseUrl(configured);
  if (provider === "groq") return DEFAULT_GROQ_BASE_URL;
  if (provider === "openai") return DEFAULT_OPENAI_BASE_URL;
  throw new ProviderUnavailableError("An API base URL is required for this LLM provider.", "llm");
}

function requestBody(model: string, input: LLMStructuredInput, stream: boolean): Record<string, unknown> {
  return {
    model,
    messages: input.messages,
    temperature: input.temperature ?? 0,
    max_completion_tokens: input.maxOutputTokens ?? 1800,
    response_format: { type: "json_object" },
    stream,
  };
}

export class OpenAICompatibleLLMProvider implements LLMProvider {
  private readonly fetcher: ReturnType<typeof getFetcher>;
  private readonly baseUrl: string;

  public constructor(private readonly config: ProviderConfig) {
    this.fetcher = getFetcher(config.fetcher);
    this.baseUrl = providerBaseUrl(config.provider, config.baseUrl);
  }

  public async streamAnswer(input: LLMStructuredInput): Promise<ReadableStream<Uint8Array>> {
    const response = await this.fetcher(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(requestBody(this.config.model, input, true)),
    });

    if (!response.ok || !response.body) {
      throw new ProviderUnavailableError(
        `LLM provider could not start a streaming response (HTTP ${response.status}).`,
        "llm",
      );
    }
    return response.body;
  }

  public async generateStructured<T>(input: LLMStructuredInput, schema: z.ZodSchema<T>): Promise<T> {
    const response = await this.fetcher(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody(this.config.model, input, false)),
    });
    const payload = await readJsonResponse(response, "llm");
    const parsedResponse = ChatResponseSchema.safeParse(payload);
    if (!parsedResponse.success) {
      throw new ProviderUnavailableError("LLM provider returned an unexpected response shape.", "llm");
    }

    const content = parsedResponse.data.choices[0]?.message.content;
    if (!content) throw new ProviderUnavailableError("LLM provider returned an empty response.", "llm");

    let decoded: unknown;
    try {
      decoded = JSON.parse(content) as unknown;
    } catch {
      throw new ProviderUnavailableError("LLM provider returned non-JSON content.", "llm");
    }

    const result = schema.safeParse(decoded);
    if (!result.success) {
      throw new ProviderUnavailableError("LLM provider returned data that failed schema validation.", "llm");
    }
    return result.data;
  }
}

export function createLLMProvider(config: ProviderConfig): LLMProvider {
  const provider = config.provider.trim().toLowerCase();
  requireConfig(config.apiKey, "LLM_API_KEY");
  requireConfig(config.model, "LLM_MODEL");

  if (provider !== "groq" && provider !== "openai" && provider !== "openai-compatible") {
    throw new ProviderUnavailableError(`Unsupported LLM provider: ${config.provider}.`, "llm");
  }
  return new OpenAICompatibleLLMProvider({ ...config, provider });
}

export function createLLMProviderFromEnv(): LLMProvider {
  if (!env.LLM_PROVIDER || !env.LLM_API_KEY || !env.LLM_MODEL) {
    throw new ProviderUnavailableError("LLM provider configuration is incomplete.", "llm");
  }
  return createLLMProvider({
    provider: env.LLM_PROVIDER,
    apiKey: env.LLM_API_KEY,
    model: env.LLM_MODEL,
  });
}
