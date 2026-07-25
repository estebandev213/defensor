import { NextResponse } from "next/server";
import { env } from "@/server/security/env";
import { logger } from "@/server/security/logger";

export const dynamic = "force-dynamic";

export function GET() {
  const response = {
    status: "ok" as const,
    database: env.DATABASE_URL ? "configured" : "not_configured",
    version: env.APP_VERSION,
    timestamp: new Date().toISOString(),
  };

  logger.info("health_check", { database: response.database, version: response.version });
  return NextResponse.json(response);
}
