import { z } from "zod";

export const QueryClassificationSchema = z.object({
  intent: z.enum([
    "legal_question",
    "calculation_request",
    "document_request",
    "out_of_scope",
    "emergency",
    "general_conversation",
  ]),
  category: z.string().min(1),
  possibleRegimes: z.array(z.string()),
  coverageStatus: z.enum(["supported", "beta", "unsupported"]),
  missingFacts: z.array(
    z.object({
      key: z.string().min(1),
      question: z.string().min(1),
      reason: z.string().min(1),
    }),
  ),
  searchQueries: z.array(z.string().min(1)).min(1).max(4),
  riskLevel: z.enum(["low", "medium", "high"]),
});

export type QueryClassification = z.infer<typeof QueryClassificationSchema>;

const QuickRepliesSchema = z.array(z.string().min(1).max(48)).max(3);

/** What the planner may extract from the conversation. */
export const CaseFactsSchema = z.object({
  topic: z.string().min(1).max(60).nullable(),
  regime: z.string().min(1).max(60).nullable(),
  terminationDate: z.string().min(1).max(40).nullable(),
  contractType: z.string().min(1).max(60).nullable(),
  tenure: z.string().min(1).max(60).nullable(),
  otherFacts: z.array(z.string().min(1).max(160)).max(6),
});

export type CaseFacts = z.infer<typeof CaseFactsSchema>;

/** The facts plus a counter the server owns, so the model cannot reset it. */
export const CaseProfileSchema = CaseFactsSchema.extend({
  questionsAsked: z.number().int().min(0).max(10),
});

export type CaseProfile = z.infer<typeof CaseProfileSchema>;

export const emptyCaseFacts: CaseFacts = {
  topic: null,
  regime: null,
  terminationDate: null,
  contractType: null,
  tenure: null,
  otherFacts: [],
};

export const emptyCaseProfile: CaseProfile = { ...emptyCaseFacts, questionsAsked: 0 };

export const TurnPlanSchema = z.object({
  action: z.enum(["converse", "ask", "research"]),
  understanding: z.string().min(1).max(240),
  reasoningSteps: z.array(z.object({ label: z.string().min(1).max(90) })).min(1).max(4),
  caseProfile: CaseFactsSchema,
  missingFacts: z
    .array(
      z.object({
        key: z.string().min(1).max(60),
        question: z.string().min(1).max(220),
        whyItMatters: z.string().min(1).max(220),
        quickReplies: QuickRepliesSchema,
      }),
    )
    .max(3),
  reply: z.string().min(1).max(900).nullable(),
  quickReplies: QuickRepliesSchema,
  searchQueries: z.array(z.string().min(1).max(240)).min(1).max(4),
  riskFlags: z
    .array(z.enum(["emergency", "out_of_scope", "calculation", "document_request"]))
    .max(4),
});

export type TurnPlan = z.infer<typeof TurnPlanSchema>;

const AnswerBlockSchema = z.object({
  text: z.string().min(1).max(900),
  isLegalClaim: z.boolean(),
  citationIds: z.array(z.string().uuid()).max(6),
});

export type AnswerBlock = z.infer<typeof AnswerBlockSchema>;

export const LegalAnswerSchema = z.object({
  answerType: z.enum(["answer", "clarification", "abstention"]),
  reply: z.array(AnswerBlockSchema).min(1).max(6),
  followUpQuestion: z.string().min(1).max(220).nullable(),
  quickReplies: QuickRepliesSchema,
  citationIds: z.array(z.string().uuid()).max(20),
  confidenceLabel: z.enum([
    "evidence_supported",
    "needs_more_information",
    "insufficient_evidence",
  ]),
});

export type LegalAnswer = z.infer<typeof LegalAnswerSchema>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Models drop optional-looking fields, especially under a terser style. Filling
 * them in beats rejecting an otherwise good answer — but every default leans
 * toward more scrutiny, never less: a block with no explicit isLegalClaim is
 * treated as a legal claim, so the citation validator still has to clear it.
 */
export const LegalAnswerDraftSchema = z.preprocess((value) => {
  if (!isRecord(value)) return value;

  const reply = Array.isArray(value.reply)
    ? value.reply.map((block) =>
        isRecord(block)
          ? {
              ...block,
              isLegalClaim: typeof block.isLegalClaim === "boolean" ? block.isLegalClaim : true,
              citationIds: Array.isArray(block.citationIds) ? block.citationIds : [],
            }
          : block,
      )
    : value.reply;

  const citationIds = Array.isArray(value.citationIds)
    ? value.citationIds
    : Array.isArray(reply)
      ? [
          ...new Set(
            reply.flatMap((block) =>
              isRecord(block) && Array.isArray(block.citationIds) ? (block.citationIds as unknown[]) : [],
            ),
          ),
        ]
      : [];

  return {
    ...value,
    reply,
    citationIds,
    followUpQuestion: typeof value.followUpQuestion === "string" ? value.followUpQuestion : null,
    quickReplies: Array.isArray(value.quickReplies) ? value.quickReplies.slice(0, 3) : [],
  };
}, LegalAnswerSchema);
