import { ProviderUnavailableError, type ProviderFetch, type ProviderKind } from "@/server/ai/providers/types";

export const DEFAULT_GROQ_BASE_URL = "https://api.groq.com/openai/v1";
export const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
export const DEFAULT_JINA_BASE_URL = "https://api.jina.ai/v1";

export function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

export function getFetcher(fetcher?: ProviderFetch): ProviderFetch {
  return fetcher ?? fetch;
}

export async function assertSuccessfulResponse(
  response: Response,
  provider: ProviderKind,
): Promise<void> {
  if (response.ok) return;
  throw new ProviderUnavailableError(
    `${provider} provider returned HTTP ${response.status}.`,
    provider,
  );
}

export async function readJsonResponse(
  response: Response,
  provider: ProviderKind,
): Promise<unknown> {
  await assertSuccessfulResponse(response, provider);
  try {
    return (await response.json()) as unknown;
  } catch {
    throw new ProviderUnavailableError(
      `${provider} provider returned invalid JSON.`,
      provider,
    );
  }
}
