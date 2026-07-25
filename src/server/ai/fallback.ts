export class ProviderUnavailableError extends Error {
  public readonly code = "PROVIDER_UNAVAILABLE" as const;

  public constructor(message = "Provider unavailable") {
    super(message);
    this.name = "ProviderUnavailableError";
  }
}

export async function withProviderFallback<T>(primary: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await primary();
  } catch {
    return fallback();
  }
}

