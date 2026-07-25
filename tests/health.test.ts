import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("reports a live Foundation process without calling external services", async () => {
    const response = GET();
    const body = (await response.json()) as {
      status: string;
      database: string;
      version: string;
      timestamp: string;
    };

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.database).toBe("not_configured");
    expect(body.version).toBeTruthy();
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
  });
});
