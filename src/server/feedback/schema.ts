import { z } from "zod";
import { redactPii } from "@/server/security/pii";

export const FeedbackRequestSchema = z.object({
  sessionId: z.string().uuid(),
  answerId: z.string().uuid(),
  rating: z.enum(["helpful", "not_helpful"]),
  reasonCode: z.string().trim().min(1).max(80).optional(),
  safeComment: z.string().max(1000).optional(),
});

export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;

function removeControlCharacters(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

export function sanitizeFeedbackComment(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const sanitized = redactPii(removeControlCharacters(value)).trim().slice(0, 1000);
  return sanitized.length > 0 ? sanitized : undefined;
}
