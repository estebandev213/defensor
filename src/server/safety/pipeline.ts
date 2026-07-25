import { classifyQuery } from "@/server/safety/classify";
import { runClarificationGate } from "@/server/safety/clarification";
import { evaluateEvidence } from "@/server/safety/evidence";
import type { RetrievedChunk } from "@/server/rag/types";

export function runSafetyGates(input: {
  query: string;
  chunks: readonly RetrievedChunk[];
}) {
  const classification = classifyQuery(input.query);
  const clarification = runClarificationGate(classification);
  const evidence = evaluateEvidence({
    classification,
    clarification,
    chunks: input.chunks,
  });

  return { classification, clarification, evidence };
}
