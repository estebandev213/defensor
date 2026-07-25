import { z } from "zod";

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
  locale: z.literal("es-PE").default("es-PE"),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
