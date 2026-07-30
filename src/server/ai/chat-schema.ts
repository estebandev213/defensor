import { z } from "zod";
import { CaseProfileSchema } from "@/server/ai/schemas";

export const ChatRequestSchema = z.object({
  sessionId: z.string().uuid(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(5000),
      }),
    )
    .max(20),
  // Case memory lives in the client so the server stays stateless; it is
  // re-validated on every turn and never trusted for legal claims.
  caseProfile: CaseProfileSchema.optional(),
  // "simple" is the person asking for the same guidance in plainer words; it
  // changes the writing style only, never the evidence or the safety gates.
  style: z.enum(["normal", "simple"]).default("normal"),
  locale: z.literal("es-PE").default("es-PE"),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
