import { describe, expect, it } from "vitest";
import type { LegalSource } from "@/db/types";
import type { LegalAnswer } from "@/server/ai/schemas";
import { classifyQuery } from "@/server/safety/classify";
import { runClarificationGate } from "@/server/safety/clarification";
import {
  createSafeAbstention,
  evaluateEvidence,
} from "@/server/safety/evidence";
import { runSafetyGates } from "@/server/safety/pipeline";
import { validateCitations } from "@/server/safety/citations";
import type { RetrievedChunk } from "@/server/rag/types";

const sourceId = "11111111-1111-4111-8111-111111111111";
const chunkId = "22222222-2222-4222-8222-222222222222";

function chunk(overrides: Partial<RetrievedChunk> = {}): RetrievedChunk {
  return {
    id: chunkId,
    sourceId,
    text: "El trabajador tiene derecho a los beneficios establecidos por la norma vigente.",
    articleLabel: "Artículo 1",
    citationLabel: "Norma oficial, artículo 1",
    officialUrl: "https://www.gob.pe/norma",
    fusionScore: 0.02,
    status: "vigente",
    legalRegime: ["privado_general"],
    topics: ["despido"],
    ...overrides,
  };
}

function source(overrides: Partial<LegalSource> = {}): LegalSource {
  return {
    id: sourceId,
    title: "Norma laboral oficial",
    normType: "ley",
    normNumber: "00000",
    officialPublisher: "Gobierno del Perú",
    officialUrl: "https://www.gob.pe/norma",
    sourceDomain: "gob.pe",
    status: "vigente",
    retrievedAt: "2026-07-24T00:00:00.000Z",
    contentHash: "hash",
    metadata: {},
    ...overrides,
  };
}

function answer(citationIds: string[] = [chunkId]): LegalAnswer {
  return {
    answerType: "answer",
    title: "Orientación inicial",
    summary: "Esta es una explicación basada en la fuente recuperada.",
    sections: [
      {
        heading: "Qué dice la norma",
        paragraphs: ["La norma establece esta regla."],
        citationIds,
      },
    ],
    nextSteps: ["Verifica las fechas y documentos de tu caso."],
    warnings: [],
    citationIds,
    confidenceLabel: "evidence_supported",
  };
}

describe("query classification and clarification", () => {
  it("classifies a supported labor question and identifies a material regime fact", () => {
    const result = classifyQuery("Me despidieron, ¿qué beneficios me corresponden?");

    expect(result.intent).toBe("legal_question");
    expect(result.category).toBe("despido");
    expect(result.coverageStatus).toBe("supported");
    expect(result.missingFacts[0]?.key).toBe("legal_regime");
  });

  it("marks non-labor matters as out of scope", () => {
    const result = classifyQuery("¿Qué delito cometió mi empleador?");

    expect(result.intent).toBe("out_of_scope");
    expect(result.coverageStatus).toBe("unsupported");
    expect(result.riskLevel).toBe("high");
  });

  it("asks at most one clarification question per turn", () => {
    const classification = classifyQuery("Me despidieron y necesito saber mi liquidación");
    const decision = runClarificationGate(classification);

    expect(decision.action).toBe("clarify");
    expect(decision.missingFacts).toHaveLength(1);
    expect(decision.question).toContain("régimen");
  });

  it("does not treat a statutory duration question as a calculation", () => {
    const result = classifyQuery("¿Cuántos días de vacaciones corresponden al trabajador?");

    expect(result.intent).toBe("legal_question");
    expect(result.category).toBe("vacaciones");
    expect(result.coverageStatus).toBe("supported");
    expect(result.missingFacts[0]?.key).toBe("legal_regime");
  });
});

describe("evidence gate", () => {
  it("allows an answer only with active, official, relevant evidence", () => {
    const classification = classifyQuery("¿Qué dice el despido en el régimen privado general?");
    const decision = evaluateEvidence({
      classification,
      clarification: { action: "continue", reasonCode: "no_missing_fact", missingFacts: [] },
      chunks: [chunk()],
    });

    expect(decision.action).toBe("answer");
    expect(decision.reasonCode).toBe("sufficient_evidence");
    expect(decision.supportingChunkIds).toEqual([chunkId]);
  });

  it("abstains when retrieval confidence is too low", () => {
    const classification = classifyQuery("¿Qué dice el despido en el régimen privado general?");
    const decision = evaluateEvidence({
      classification,
      chunks: [chunk({ fusionScore: 0.001 })],
    });

    expect(decision.action).toBe("abstain");
    expect(decision.reasonCode).toBe("low_retrieval_confidence");
  });

  it("abstains on outdated or conflicting evidence", () => {
    const classification = classifyQuery("¿Qué dice el despido en el régimen privado general?");
    const outdated = evaluateEvidence({
      classification,
      chunks: [chunk({ status: "derogada" })],
    });
    const conflicting = evaluateEvidence({
      classification,
      chunks: [
        chunk(),
        chunk({
          id: "33333333-3333-4333-8333-333333333333",
          sourceId: "44444444-4444-4444-8444-444444444444",
          text: "La regla aplicable es distinta según esta segunda fuente.",
        }),
      ],
    });

    expect(outdated.reasonCode).toBe("outdated_or_unknown_status");
    expect(conflicting.reasonCode).toBe("conflicting_sources");
  });

  it("allows official sources that are current with modifications", () => {
    const classification = classifyQuery("Que dice el despido en el regimen privado general?");
    const decision = evaluateEvidence({
      classification,
      chunks: [chunk({ status: "modificada" })],
    });

    expect(decision.action).toBe("answer");
    expect(decision.reasonCode).toBe("sufficient_evidence");
  });

  it("runs classification and clarification before retrieval evidence", () => {
    const result = runSafetyGates({ query: "Me despidieron, ¿qué me corresponde?", chunks: [] });

    expect(result.clarification.action).toBe("clarify");
    expect(result.evidence.action).toBe("clarify");
    expect(createSafeAbstention(result.evidence).answerType).toBe("clarification");
  });
});

describe("citation validator", () => {
  it("creates indexed, source-backed citations and removes orphan IDs", () => {
    const answerWithOrphan = answer([chunkId]);
    const result = validateCitations({
      answer: answerWithOrphan,
      chunks: [chunk()],
      sources: new Map([[sourceId, source()]]),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.citations[0]?.index).toBe(1);
      expect(result.citations[0]?.officialUrl).toBe("https://www.gob.pe/norma");
      expect(result.answer.citationIds).toEqual([chunkId]);
    }
  });

  it("validates citations from official sources current with modifications", () => {
    const result = validateCitations({
      answer: answer([chunkId]),
      chunks: [chunk({ status: "modificada" })],
      sources: new Map([[sourceId, source({ status: "modificada" })]]),
    });

    expect(result.ok).toBe(true);
  });

  it("rejects invented citation IDs with a safe abstention", () => {
    const inventedId = "55555555-5555-4555-8555-555555555555";
    const result = validateCitations({
      answer: answer([inventedId]),
      chunks: [chunk()],
      sources: new Map([[sourceId, source()]]),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorCode).toBe("CITATION_VALIDATION_FAILED");
      expect(result.answer.answerType).toBe("abstention");
    }
  });

  it("rejects an answer section without citations", () => {
    const result = validateCitations({
      answer: answer([]),
      chunks: [chunk()],
      sources: new Map([[sourceId, source()]]),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("uncited_legal_section");
  });
});
