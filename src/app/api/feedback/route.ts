import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createDatabaseClient } from "@/db/client";
import { FeedbackRequestSchema, sanitizeFeedbackComment } from "@/server/feedback/schema";
import { env } from "@/server/security/env";
import { publicError } from "@/server/security/errors";
import { requestClientIdentifier, defaultRateLimiter } from "@/server/security/rate-limit";
import { logger } from "@/server/security/logger";

export const dynamic = "force-dynamic";

function hashSessionId(sessionId: string): string {
  const secret = env.RATE_LIMIT_SECRET ?? "development-only-feedback-secret";
  return createHash("sha256").update(`${secret}:${sessionId}`).digest("hex");
}

export async function POST(request: Request): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(publicError("VALIDATION_ERROR"), { status: 400 });
  }

  const parsed = FeedbackRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(publicError("VALIDATION_ERROR"), { status: 400 });
  }

  const rateLimit = await defaultRateLimiter.check({
    clientIdentifier: requestClientIdentifier(request),
    sessionId: parsed.data.sessionId,
    route: "/api/feedback",
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(publicError("RATE_LIMITED"), {
      status: 429,
      headers: {
        "Retry-After": String(rateLimit.retryAfterSeconds),
        "X-RateLimit-Limit": String(rateLimit.limit),
        "X-RateLimit-Remaining": "0",
      },
    });
  }

  if (!env.DATABASE_URL) {
    return NextResponse.json(publicError("DATABASE_UNAVAILABLE"), { status: 503 });
  }

  const db = createDatabaseClient();
  try {
    await db`
      insert into feedback_events (session_id_hash, answer_id, rating, reason_code, safe_comment)
      values (
        ${hashSessionId(parsed.data.sessionId)},
        ${parsed.data.answerId}::uuid,
        ${parsed.data.rating},
        ${parsed.data.reasonCode ?? null},
        ${sanitizeFeedbackComment(parsed.data.safeComment) ?? null}
      )
    `;
    return NextResponse.json({ accepted: true }, { status: 201 });
  } catch {
    logger.error("feedback_insert_failed", { errorCode: "DATABASE_UNAVAILABLE" });
    return NextResponse.json(publicError("DATABASE_UNAVAILABLE"), { status: 503 });
  } finally {
    await db.end({ timeout: 1 }).catch(() => undefined);
  }
}
