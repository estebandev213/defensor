export class TimeoutError extends Error {
  public readonly code = "TIMEOUT" as const;

  public constructor(message = "Operation timed out") {
    super(message);
    this.name = "TimeoutError";
  }
}

export class AbortError extends Error {
  public readonly code = "ABORTED" as const;

  public constructor(message = "Operation aborted") {
    super(message);
    this.name = "AbortError";
  }
}

export function withTimeout<T>(operation: Promise<T>, timeoutMs: number, signal?: AbortSignal): Promise<T> {
  if (signal?.aborted) return Promise.reject(new AbortError());

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError()), timeoutMs);
    const abort = () => reject(new AbortError());
    signal?.addEventListener("abort", abort, { once: true });

    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
    };

    operation.then(
      (value) => {
        cleanup();
        resolve(value);
      },
      (error: unknown) => {
        cleanup();
        reject(error);
      },
    );
  });
}

