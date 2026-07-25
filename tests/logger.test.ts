import { describe, expect, it } from "vitest";
import { sanitizeLogMetadata } from "@/server/security/logger";

describe("secure logging", () => {
  it("redacts secrets and user content recursively", () => {
    const metadata = sanitizeLogMetadata({
      traceId: "trace-123",
      authorization: "Bearer secret",
      prompt: "DNI 00000000",
      nested: { email: "person@example.com", durationMs: 12 },
    });

    expect(metadata).toEqual({
      traceId: "trace-123",
      authorization: "[REDACTED]",
      prompt: "[REDACTED]",
      nested: { email: "[REDACTED]", durationMs: 12 },
    });
  });
});
