import { redactPii } from "@/server/security/pii";

export type LogLevel = "debug" | "info" | "warn" | "error";

type SafeLogValue =
  | string
  | number
  | boolean
  | null
  | SafeLogValue[]
  | { [key: string]: SafeLogValue };

const sensitiveKeyPattern =
  /(authorization|cookie|password|secret|token|api[-_]?key|prompt|content|query|email|phone|dni)/i;

function toSafeValue(value: unknown, key = ""): SafeLogValue | undefined {
  if (sensitiveKeyPattern.test(key)) {
    return "[REDACTED]";
  }

  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "string") return redactPii(value);

  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      const safeItem = toSafeValue(item);
      return safeItem === undefined ? [] : [safeItem];
    });
  }

  if (typeof value === "object") {
    const safeObject: { [key: string]: SafeLogValue } = {};
    for (const [entryKey, entryValue] of Object.entries(value)) {
      const safeEntry = toSafeValue(entryValue, entryKey);
      if (safeEntry !== undefined) {
        safeObject[entryKey] = safeEntry;
      }
    }
    return safeObject;
  }

  return undefined;
}

export function sanitizeLogMetadata(
  metadata: Record<string, unknown> = {},
): Record<string, SafeLogValue> {
  const safeMetadata = toSafeValue(metadata);
  return safeMetadata && typeof safeMetadata === "object" && !Array.isArray(safeMetadata)
    ? safeMetadata
    : {};
}

function writeLog(level: LogLevel, message: string, metadata: Record<string, unknown>) {
  const record = JSON.stringify({
    level,
    message,
    ...sanitizeLogMetadata(metadata),
    timestamp: new Date().toISOString(),
  });

  if (level === "error") {
    console.error(record);
  } else if (level === "warn") {
    console.warn(record);
  } else {
    console.log(record);
  }
}

export const logger = {
  debug(message: string, metadata?: Record<string, unknown>) {
    writeLog("debug", message, metadata ?? {});
  },
  info(message: string, metadata?: Record<string, unknown>) {
    writeLog("info", message, metadata ?? {});
  },
  warn(message: string, metadata?: Record<string, unknown>) {
    writeLog("warn", message, metadata ?? {});
  },
  error(message: string, metadata?: Record<string, unknown>) {
    writeLog("error", message, metadata ?? {});
  },
};
