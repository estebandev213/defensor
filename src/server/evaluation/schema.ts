import { z } from "zod";

export const EvaluationCaseSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  userContext: z.record(z.string()).optional(),
  expectedAnswerPoints: z.array(z.string().min(1)).min(1),
  expectedSourceIds: z.array(z.string()),
  expectedArticleLabels: z.array(z.string()),
  legalRegime: z.string().min(1),
  category: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  shouldAbstain: z.boolean(),
  notes: z.string().optional(),
});

export const EvaluationDatasetSchema = z.array(EvaluationCaseSchema).min(1);

export type EvaluationCase = z.infer<typeof EvaluationCaseSchema>;
