import type { QueryClassification } from "@/server/ai/schemas";
import type { ClarificationDecision } from "@/server/safety/types";

export function runClarificationGate(
  classification: QueryClassification,
): ClarificationDecision {
  if (
    classification.intent !== "legal_question" ||
    classification.coverageStatus === "unsupported"
  ) {
    return {
      action: "continue",
      reasonCode: "no_missing_fact",
      missingFacts: [],
    };
  }

  const missingFact = classification.missingFacts[0];
  if (!missingFact) {
    return {
      action: "continue",
      reasonCode: "no_missing_fact",
      missingFacts: [],
    };
  }

  return {
    action: "clarify",
    reasonCode: "missing_material_fact",
    missingFacts: [missingFact.key],
    question: missingFact.question,
  };
}
