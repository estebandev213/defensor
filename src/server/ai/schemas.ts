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

const AnswerSectionSchema = z.object({
  heading: z.string().min(1).max(120),
  paragraphs: z.array(z.string().min(1)).min(1).max(8),
  citationIds: z.array(z.string().uuid()).max(12),
});

export const LegalAnswerSchema = z.object({
  answerType: z.enum(["answer", "clarification", "abstention"]),
  title: z.string().min(1).max(100),
  summary: z.string().min(1).max(1200),
  sections: z.array(AnswerSectionSchema).max(8),
  nextSteps: z.array(z.string().min(1)).max(4),
  warnings: z.array(z.string().min(1)).max(3),
  citationIds: z.array(z.string().uuid()).max(20),
  confidenceLabel: z.enum([
    "evidence_supported",
    "needs_more_information",
    "insufficient_evidence",
  ]),
});

export type LegalAnswer = z.infer<typeof LegalAnswerSchema>;
