import {
  ProviderRateLimitError,
  ProviderUnavailableError,
  type ProviderFetch,
  type ProviderKind,
} from "@/server/ai/providers/types";

export const DEFAULT_GROQ_BASE_URL = "https://api.groq.com/openai/v1";
export const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
export const DEFAULT_JINA_BASE_URL = "https://api.jina.ai/v1";
/** Gemini speaks the OpenAI wire format on this path, so one client covers both. */
export const DEFAULT_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai";

export function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

export function getFetcher(fetcher?: ProviderFetch): ProviderFetch {
  return fetcher ?? fetch;
}

/** OpenAI-compatible APIs send `Retry-After`; Groq only says it in the message. */
const RETRY_HINT_PATTERN = /try again in ([\d.]+)s/i;

function retryAfterSeconds(response: Response, body: string): number | null {
  const header = Number(response.headers.get("retry-after"));
  if (Number.isFinite(header) && header > 0) return Math.ceil(header);

  const hinted = RETRY_HINT_PATTERN.exec(body);
  if (hinted) {
    const seconds = Number(hinted[1]);
    if (Number.isFinite(seconds) && seconds > 0) return Math.ceil(seconds);
  }
  return null;
}

export async function assertSuccessfulResponse(
  response: Response,
  provider: ProviderKind,
): Promise<void> {
  if (response.ok) return;

  if (response.status === 429) {
    // Safe to drain: this response is an error and nothing downstream reads it.
    const body = await response.text().catch(() => "");
    throw new ProviderRateLimitError(
      `${provider} provider rate limit reached.`,
      provider,
      retryAfterSeconds(response, body),
    );
  }

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
