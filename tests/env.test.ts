import { describe, expect, it } from "vitest";
import { validateEnvironment } from "@/server/security/env";

describe("environment validation", () => {
  it("accepts the minimal Foundation configuration", () => {
    const result = validateEnvironment({
      NODE_ENV: "test",
      APP_URL: "http://localhost:3000",
      APP_VERSION: "test-version",
      TELEMETRY_ENABLED: "false",
      EMBEDDING_DIMENSIONS: "1536",
    });

    expect(result.NODE_ENV).toBe("test");
    expect(result.APP_VERSION).toBe("test-version");
    expect(result.TELEMETRY_ENABLED).toBe(false);
    expect(result.EMBEDDING_DIMENSIONS).toBe(1536);
  });

  it("rejects an invalid application URL", () => {
    expect(() => validateEnvironment({ NODE_ENV: "test", APP_URL: "not-a-url" })).toThrow();
  });
});
