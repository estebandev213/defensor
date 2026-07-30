import { z } from "zod";
import { env } from "@/server/security/env";
import {
  assertSuccessfulResponse,
  DEFAULT_GEMINI_BASE_URL,
  DEFAULT_GROQ_BASE_URL,
  DEFAULT_OPENAI_BASE_URL,
  getFetcher,
  normalizeBaseUrl,
  readJsonResponse,
} from "@/server/ai/providers/http";
import {
  ProviderRateLimitError,
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
  if (provider === "google") return DEFAULT_GEMINI_BASE_URL;
  throw new ProviderUnavailableError("An API base URL is required for this LLM provider.", "llm");
}

function requestBody(
  provider: string,
  model: string,
  input: LLMStructuredInput,
  stream: boolean,
): Record<string, unknown> {
  const maxOutputTokens = input.maxOutputTokens ?? 1800;
  return {
    model,
    messages: input.messages,
    temperature: input.temperature ?? 0,
    // Gemini's OpenAI-compatible layer predates `max_completion_tokens` and
    // only reads `max_tokens`; sending the wrong one silently uncaps output.
    ...(provider === "google"
      ? { max_tokens: maxOutputTokens }
      : { max_completion_tokens: maxOutputTokens }),
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
      body: JSON.stringify(requestBody(this.config.provider, this.config.model, input, true)),
    });

    await assertSuccessfulResponse(response, "llm");
    if (!response.body) {
      throw new ProviderUnavailableError("LLM provider could not start a streaming response.", "llm");
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
      body: JSON.stringify(requestBody(this.config.provider, this.config.model, input, false)),
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

const SUPPORTED_LLM_PROVIDERS = ["groq", "openai", "openai-compatible", "google"];

/** Accepts the names people actually write in a .env file. */
function canonicalProvider(value: string): string {
  const provider = value.trim().toLowerCase();
  if (provider === "gemini" || provider === "google-ai" || provider === "googleai") return "google";
  return provider;
}

export function createLLMProvider(config: ProviderConfig): LLMProvider {
  const provider = canonicalProvider(config.provider);
  requireConfig(config.apiKey, "LLM_API_KEY");
  requireConfig(config.model, "LLM_MODEL");

  if (!SUPPORTED_LLM_PROVIDERS.includes(provider)) {
    throw new ProviderUnavailableError(`Unsupported LLM provider: ${config.provider}.`, "llm");
  }
  return new OpenAICompatibleLLMProvider({ ...config, provider });
}

/**
 * One quota is a single point of failure: when the primary is rate limited or
 * down, the turn moves to the next provider instead of failing the person.
 * Only provider-level failures advance the chain — an abort or a timeout means
 * the caller stopped caring, so trying another provider would just waste it.
 */
export class FailoverLLMProvider implements LLMProvider {
  public constructor(private readonly providers: readonly LLMProvider[]) {
    if (providers.length === 0) {
      throw new ProviderUnavailableError("At least one LLM provider is required.", "llm");
    }
  }

  public streamAnswer(input: LLMStructuredInput): Promise<ReadableStream<Uint8Array>> {
    return this.run((provider) => provider.streamAnswer(input));
  }

  public generateStructured<T>(input: LLMStructuredInput, schema: z.ZodSchema<T>): Promise<T> {
    return this.run((provider) => provider.generateStructured(input, schema));
  }

  private async run<T>(call: (provider: LLMProvider) => Promise<T>): Promise<T> {
    const failures: ProviderUnavailableError[] = [];

    for (const provider of this.providers) {
      try {
        return await call(provider);
      } catch (error) {
        if (!(error instanceof ProviderUnavailableError)) throw error;
        failures.push(error);
      }
    }

    throw worstFailure(failures);
  }
}

/**
 * When every provider is merely rate limited the turn is not broken, only
 * early: report the soonest one to recover so the wait we show is achievable.
 */
function worstFailure(failures: readonly ProviderUnavailableError[]): ProviderUnavailableError {
  const last = failures[failures.length - 1];
  if (!last) return new ProviderUnavailableError("No LLM provider was reachable.", "llm");

  const rateLimits = failures.filter(
    (failure): failure is ProviderRateLimitError => failure instanceof ProviderRateLimitError,
  );
  if (rateLimits.length !== failures.length) return last;

  return rateLimits.reduce((soonest, candidate) => {
    if (candidate.retryAfterSeconds === null) return soonest;
    if (soonest.retryAfterSeconds === null) return candidate;
    return candidate.retryAfterSeconds < soonest.retryAfterSeconds ? candidate : soonest;
  });
}

export function createLLMProviderFromEnv(): LLMProvider {
  if (!env.LLM_PROVIDER || !env.LLM_API_KEY || !env.LLM_MODEL) {
    throw new ProviderUnavailableError("LLM provider configuration is incomplete.", "llm");
  }

  const providers = [
    createLLMProvider({
      provider: env.LLM_PROVIDER,
      apiKey: env.LLM_API_KEY,
      model: env.LLM_MODEL,
      baseUrl: env.LLM_BASE_URL,
    }),
  ];

  // A partially configured fallback is a silent single point of failure, so it
  // only counts when all three values are present.
  if (env.LLM_FALLBACK_PROVIDER && env.LLM_FALLBACK_API_KEY && env.LLM_FALLBACK_MODEL) {
    providers.push(
      createLLMProvider({
        provider: env.LLM_FALLBACK_PROVIDER,
        apiKey: env.LLM_FALLBACK_API_KEY,
        model: env.LLM_FALLBACK_MODEL,
        baseUrl: env.LLM_FALLBACK_BASE_URL,
      }),
    );
  }

  return providers.length === 1 ? providers[0]! : new FailoverLLMProvider(providers);
}
