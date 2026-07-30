import { z } from "zod";

const optionalEnvString = () =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(1).optional(),
  );

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  APP_VERSION: z.string().min(1).default("0.1.0"),
  DATABASE_URL: optionalEnvString(),
  SUPABASE_URL: optionalEnvString(),
  SUPABASE_ANON_KEY: optionalEnvString(),
  SUPABASE_SERVICE_ROLE_KEY: optionalEnvString(),
  LLM_PROVIDER: optionalEnvString(),
  LLM_API_KEY: optionalEnvString(),
  LLM_MODEL: optionalEnvString(),
  LLM_BASE_URL: optionalEnvString(),
  /** Second provider, used when the primary is rate limited or unreachable. */
  LLM_FALLBACK_PROVIDER: optionalEnvString(),
  LLM_FALLBACK_API_KEY: optionalEnvString(),
  LLM_FALLBACK_MODEL: optionalEnvString(),
  LLM_FALLBACK_BASE_URL: optionalEnvString(),
  EMBEDDING_PROVIDER: optionalEnvString(),
  EMBEDDING_API_KEY: optionalEnvString(),
  EMBEDDING_MODEL: optionalEnvString(),
  EMBEDDING_DIMENSIONS: z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.coerce.number().int().positive().optional(),
  ),
  RERANKER_PROVIDER: optionalEnvString(),
  RERANKER_API_KEY: optionalEnvString(),
  RERANKER_MODEL: optionalEnvString(),
  TELEMETRY_PROVIDER: optionalEnvString(),
  TELEMETRY_API_KEY: optionalEnvString(),
  TELEMETRY_ENABLED: z.preprocess(
    (value) =>
      typeof value === "string" ? value.toLowerCase() === "true" : value,
    z.boolean().default(false),
  ),
  RATE_LIMIT_PROVIDER: optionalEnvString(),
  RATE_LIMIT_SECRET: optionalEnvString(),
  RATE_LIMIT_WINDOW_MS: z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.coerce.number().int().positive().default(60_000),
  ),
  RATE_LIMIT_MAX_REQUESTS: z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.coerce.number().int().positive().default(10),
  ),
  RATE_LIMIT_DAILY_MAX: z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.coerce.number().int().positive().default(100),
  ),
  REQUEST_TIMEOUT_MS: z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.coerce.number().int().positive().default(12_000),
  ),
  PII_REDACTION_ENABLED: z.preprocess(
    (value) =>
      typeof value === "string" ? value.toLowerCase() !== "false" : value,
    z.boolean().default(true),
  ),
  LEGAL_CORPUS_VERSION: optionalEnvString(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type AppEnv = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);

export function validateEnvironment(input: NodeJS.ProcessEnv): AppEnv {
  return envSchema.parse(input);
}
