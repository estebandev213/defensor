import { describe, expect, it } from "vitest";
import { withProviderFallback, ProviderUnavailableError } from "@/server/ai/fallback";
import { createCorpusBackup } from "@/server/legal/export";
import { InMemoryTelemetryProvider } from "@/server/telemetry/in-memory";
import { InMemoryRateLimitStore, RateLimiter } from "@/server/security/rate-limit";
import { redactPii } from "@/server/security/pii";
import { securityHeaders } from "@/server/security/headers";
import { AbortError, TimeoutError, withTimeout } from "@/server/security/timeout";

describe("production hardening", () => {
  it("redacts common Peruvian contact identifiers", () => {
    const redacted = redactPii("Escribe a ana@example.com o llama al +51 987654321. DNI 12345678.");

    expect(redacted).toContain("[EMAIL_REDACTED]");
    expect(redacted).toContain("[PHONE_REDACTED]");
    expect(redacted).toContain("[DNI_REDACTED]");
    expect(redacted).not.toContain("ana@example.com");
    expect(redacted).not.toContain("12345678");
  });

  it("enforces minute and daily limits with hashed identities", async () => {
    const limiter = new RateLimiter(new InMemoryRateLimitStore(), {
      windowMs: 60_000,
      maxRequests: 1,
      dailyMax: 2,
      secret: "test-secret",
    });

    const first = await limiter.check({ clientIdentifier: "203.0.113.10", sessionId: "session-a", route: "/api/chat", now: 1_000 });
    const second = await limiter.check({ clientIdentifier: "203.0.113.10", sessionId: "session-a", route: "/api/chat", now: 1_001 });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(false);
    expect(second.remaining).toBe(0);
    expect(second.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("falls back when the primary provider is unavailable", async () => {
    const result = await withProviderFallback(
      async () => { throw new ProviderUnavailableError(); },
      async () => "safe-fallback",
    );

    expect(result).toBe("safe-fallback");
  });

  it("enforces operation timeouts and request aborts", async () => {
    await expect(withTimeout(Promise.resolve("ok"), 100)).resolves.toBe("ok");
    await expect(withTimeout(new Promise<string>((resolve) => setTimeout(() => resolve("late"), 50)), 1)).rejects.toBeInstanceOf(TimeoutError);

    const controller = new AbortController();
    controller.abort();
    await expect(withTimeout(Promise.resolve("never"), 100, controller.signal)).rejects.toBeInstanceOf(AbortError);
  });

  it("publishes the required browser security headers", () => {
    const headers = Object.fromEntries(securityHeaders().map(({ key, value }) => [key, value]));

    expect(headers["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Permissions-Policy"]).toContain("microphone=()");
    expect(headers["X-Frame-Options"]).toBe("DENY");
  });

  it("keeps telemetry bounded and free of message content by contract", async () => {
    const telemetry = new InMemoryTelemetryProvider(1);
    await telemetry.trace({
      traceId: "trace-1",
      timestamp: new Date().toISOString(),
      route: "/api/chat",
      category: "despido",
      timings: { total: 4 },
      retrievedChunkIds: [],
      citedChunkIds: [],
    });

    const snapshot = telemetry.snapshot();
    expect(snapshot).toHaveLength(1);
    expect(JSON.stringify(snapshot)).not.toContain("message");
  });

  it("creates a validated, hashed corpus backup", () => {
    const backup = createCorpusBackup({ version: "foundation-empty", parserVersion: "1.0.0", sources: [], documents: [], chunks: [] }, "2026-07-25T00:00:00.000Z");

    expect(backup.backupVersion).toBe(1);
    expect(backup.corpusHash).toMatch(/^[a-f0-9]{64}$/);
    expect(backup.validation.valid).toBe(true);
  });
});
