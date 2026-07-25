import { createHash } from "node:crypto";
import { env } from "@/server/security/env";

interface Counter {
  count: number;
  resetAt: number;
}

export interface RateLimitStore {
  increment(key: string, windowMs: number, now: number): Promise<Counter>;
}

export class InMemoryRateLimitStore implements RateLimitStore {
  private readonly counters = new Map<string, Counter>();

  public async increment(key: string, windowMs: number, now: number): Promise<Counter> {
    const current = this.counters.get(key);
    const counter = !current || current.resetAt <= now
      ? { count: 1, resetAt: now + windowMs }
      : { count: current.count + 1, resetAt: current.resetAt };
    this.counters.set(key, counter);
    return counter;
  }
}

export interface RateLimitPolicy {
  windowMs: number;
  maxRequests: number;
  dailyMax: number;
  secret: string;
}

export interface RateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

function hashParts(secret: string, parts: readonly string[]): string {
  return createHash("sha256").update(`${secret}:${parts.join(":")}`).digest("hex");
}

export function requestClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "anonymous";
}

export class RateLimiter {
  public constructor(
    private readonly store: RateLimitStore,
    private readonly policy: RateLimitPolicy,
  ) {}

  public async check(input: { clientIdentifier: string; sessionId: string; route: string; now?: number }): Promise<RateLimitDecision> {
    const now = input.now ?? Date.now();
    const identity = hashParts(this.policy.secret, [input.clientIdentifier, input.sessionId, input.route]);
    const minute = await this.store.increment(`minute:${identity}`, this.policy.windowMs, now);
    const day = await this.store.increment(`day:${identity}`, 86_400_000, now);
    const allowed = minute.count <= this.policy.maxRequests && day.count <= this.policy.dailyMax;
    const resetAt = Math.max(minute.resetAt, day.resetAt);
    return {
      allowed,
      limit: Math.min(this.policy.maxRequests, this.policy.dailyMax),
      remaining: Math.max(0, Math.min(this.policy.maxRequests - minute.count, this.policy.dailyMax - day.count)),
      retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)),
    };
  }
}

export const defaultRateLimiter = new RateLimiter(new InMemoryRateLimitStore(), {
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  dailyMax: env.RATE_LIMIT_DAILY_MAX,
  secret: env.RATE_LIMIT_SECRET ?? "development-only-rate-limit-secret",
});

