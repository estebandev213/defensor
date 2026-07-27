import { z } from "zod";
import { env } from "@/server/security/env";
import {
  DEFAULT_JINA_BASE_URL,
  DEFAULT_OPENAI_BASE_URL,
  getFetcher,
  normalizeBaseUrl,
  readJsonResponse,
} from "@/server/ai/providers/http";
import {
  ProviderUnavailableError,
  type EmbeddingProvider,
  type ProviderConfig,
} from "@/server/ai/providers/types";
import { EMBEDDING_DIMENSIONS, validateEmbedding } from "@/server/rag/providers";

const EmbeddingResponseSchema = z.object({
  data: z
    .array(
      z.object({
        embedding: z.array(z.number()),
        index: z.number().int().nonnegative(),
      }),
    )
    .min(1),
});

function requireConfig(value: string | undefined, name: string): string {
  if (!value) throw new ProviderUnavailableError(`${name} is not configured.`, "embedding");
  return value;
}

function providerBaseUrl(provider: string, configured?: string): string {
  if (configured) return normalizeBaseUrl(configured);
  if (provider === "jina") return DEFAULT_JINA_BASE_URL;
  if (provider === "openai") return DEFAULT_OPENAI_BASE_URL;
  throw new ProviderUnavailableError("An API base URL is required for this embedding provider.", "embedding");
}

export class HttpEmbeddingProvider implements EmbeddingProvider {
  private readonly fetcher: ReturnType<typeof getFetcher>;
  private readonly baseUrl: string;
  private readonly dimensions: number;

  public constructor(private readonly config: ProviderConfig) {
    this.fetcher = getFetcher(config.fetcher);
    this.baseUrl = providerBaseUrl(config.provider, config.baseUrl);
    this.dimensions = config.dimensions ?? EMBEDDING_DIMENSIONS;
  }

  public async embedDocuments(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const response = await this.fetcher(`${this.baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.config.model,
        input: texts,
        ...(this.config.provider === "jina" ? { dimensions: this.dimensions } : {}),
      }),
    });
    const payload = await readJsonResponse(response, "embedding");
    const parsed = EmbeddingResponseSchema.safeParse(payload);
    if (!parsed.success) {
      throw new ProviderUnavailableError("Embedding provider returned an unexpected response shape.", "embedding");
    }

    const vectors = [...parsed.data.data].sort((left, right) => left.index - right.index).map((item) =>
      validateEmbedding(item.embedding, this.dimensions),
    );
    if (vectors.length !== texts.length) {
      throw new ProviderUnavailableError("Embedding provider returned an incomplete batch.", "embedding");
    }
    return vectors;
  }

  public async embedQuery(text: string): Promise<number[]> {
    const [embedding] = await this.embedDocuments([text]);
    if (!embedding) throw new ProviderUnavailableError("Embedding provider returned no query vector.", "embedding");
    return embedding;
  }
}

export function createEmbeddingProvider(config: ProviderConfig): EmbeddingProvider {
  const provider = config.provider.trim().toLowerCase();
  requireConfig(config.apiKey, "EMBEDDING_API_KEY");
  requireConfig(config.model, "EMBEDDING_MODEL");

  if (provider !== "jina" && provider !== "openai") {
    throw new ProviderUnavailableError(`Unsupported embedding provider: ${config.provider}.`, "embedding");
  }
  return new HttpEmbeddingProvider({ ...config, provider });
}

export function createEmbeddingProviderFromEnv(): EmbeddingProvider {
  if (!env.EMBEDDING_PROVIDER || !env.EMBEDDING_API_KEY || !env.EMBEDDING_MODEL) {
    throw new ProviderUnavailableError("Embedding provider configuration is incomplete.", "embedding");
  }
  return createEmbeddingProvider({
    provider: env.EMBEDDING_PROVIDER,
    apiKey: env.EMBEDDING_API_KEY,
    model: env.EMBEDDING_MODEL,
    dimensions: env.EMBEDDING_DIMENSIONS,
  });
}
