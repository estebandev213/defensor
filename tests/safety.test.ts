import { describe, expect, it } from "vitest";
import type { LegalSource } from "@/db/types";
import type { LegalAnswer } from "@/server/ai/schemas";
import { classifyQuery } from "@/server/safety/classify";
import { runClarificationGate } from "@/server/safety/clarification";
import {
  createGroundedCategoryFallback,
  createSafeAbstention,
  evaluateEvidence,
} from "@/server/safety/evidence";
import { runSafetyGates } from "@/server/safety/pipeline";
import { validateCitations } from "@/server/safety/citations";
import { evaluateClaimSupport } from "@/server/safety/claim-support";
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
    lexicalScore: 0.1,
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
    reply: [
      {
        text: "Entiendo, y lamento que estés pasando por esto.",
        isLegalClaim: false,
        citationIds: [],
      },
      {
        text: "El trabajador tiene derecho a los beneficios establecidos por la norma vigente.",
        isLegalClaim: true,
        citationIds,
      },
    ],
    followUpQuestion: "¿Quieres que veamos qué documentos te conviene reunir?",
    quickReplies: ["Sí, veamos eso"],
    citationIds,
    confidenceLabel: "evidence_supported",
  };
}

describe("query classification and clarification", () => {
  it("does not block a generic dismissal question on the regime", () => {
    const result = classifyQuery("Me despidieron");

    expect(result.intent).toBe("legal_question");
    expect(result.category).toBe("despido");
    expect(result.coverageStatus).toBe("supported");
    expect(result.missingFacts).toEqual([]);
  });

  it("uses a self-contained legal search before a conversational follow-up", () => {
    const result = classifyQuery("Me despidieron\nEsta semana");

    expect(result.category).toBe("despido");
    expect(result.searchQueries[0]).toBe(
      "despido causa justa régimen actividad privada",
    );
    expect(result.searchQueries[1]).toBe("me despidieron\nesta semana");
  });

  it("asks for the date before assessing a potentially unlawful dismissal", () => {
    const result = classifyQuery("¿Mi despido fue injustificado?");

    expect(result.missingFacts[0]?.key).toBe("termination_date");
    expect(result.missingFacts[0]?.question).toContain("fecha");
  });

  it("asks for the regime when a concrete CTS entitlement is requested", () => {
    const result = classifyQuery("¿Me corresponde CTS?");

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

    expect(decision.action).toBe("continue");
    expect(decision.missingFacts).toEqual([]);
  });

  it("does not treat a statutory duration question as a calculation", () => {
    const result = classifyQuery("¿Cuántos días de vacaciones corresponden al trabajador?");

    expect(result.intent).toBe("legal_question");
    expect(result.category).toBe("vacaciones");
    expect(result.coverageStatus).toBe("supported");
    expect(result.missingFacts).toEqual([]);
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
      chunks: [chunk({ fusionScore: 0.001, lexicalScore: undefined })],
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

  it("rejects evidence from an unrelated topic or regime", () => {
    const classification = classifyQuery("¿Qué dice el despido en el régimen privado general?");
    const unrelatedTopic = evaluateEvidence({
      classification,
      chunks: [chunk({ topics: ["gratificaciones"] })],
    });
    const unrelatedRegime = evaluateEvidence({
      classification,
      chunks: [chunk({ legalRegime: ["mype"] })],
    });

    expect(unrelatedTopic.reasonCode).toBe("low_retrieval_confidence");
    expect(unrelatedRegime.reasonCode).toBe("low_retrieval_confidence");
  });

  it("rejects weak semantic-only evidence", () => {
    const classification = classifyQuery("¿Qué dice el despido en el régimen privado general?");
    const decision = evaluateEvidence({
      classification,
      chunks: [chunk({ lexicalScore: undefined, semanticScore: 0.42 })],
    });

    expect(decision.reasonCode).toBe("low_retrieval_confidence");
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

    expect(result.clarification.action).toBe("continue");
    expect(result.evidence.action).toBe("abstain");
    expect(createSafeAbstention(result.evidence).answerType).toBe("abstention");
  });
});

describe("citation validator", () => {
  it("builds a validated extractive fallback for a broad dismissal turn", () => {
    const dismissalChunk = chunk({
      text: "Artículo 22.- Para el despido de un trabajador sujeto a régimen de la actividad privada, que labore cuatro o más horas diarias para un mismo empleador, es indispensable la existencia de causa justa contemplada en la ley y debidamente comprobada. La causa justa puede estar relacionada con la capacidad o con la conducta del trabajador.",
    });
    const fallback = createGroundedCategoryFallback("despido", [dismissalChunk]);

    expect(fallback).not.toBeNull();
    const result = validateCitations({
      answer: fallback,
      chunks: [dismissalChunk],
      sources: new Map([[sourceId, source()]]),
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.citations).toHaveLength(1);
  });

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

  it("rejects a legal claim that is irrelevant to its cited passage", () => {
    const unsupported = answer([chunkId]);
    unsupported.reply[1] = {
      text: "La ley ordena pagar dos gratificaciones por Fiestas Patrias y Navidad.",
      isLegalClaim: true,
      citationIds: [chunkId],
    };
    const result = validateCitations({
      answer: unsupported,
      chunks: [chunk()],
      sources: new Map([[sourceId, source()]]),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("claim_not_supported_by_cited_passage");
  });

  it("rejects factual anchors that do not exist in the cited passage", () => {
    const unsupported = answer([chunkId]);
    unsupported.reply[1] = {
      text: "El trabajador tiene derecho a los beneficios por 30 días.",
      isLegalClaim: true,
      citationIds: [chunkId],
    };
    const result = validateCitations({
      answer: unsupported,
      chunks: [chunk()],
      sources: new Map([[sourceId, source()]]),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("claim_not_supported_by_cited_passage");
  });

  it("measures deterministic support for close legal paraphrases", () => {
    const support = evaluateClaimSupport(
      "El trabajador tiene derecho a beneficios establecidos por la norma vigente.",
      chunk().text,
    );

    expect(support.supported).toBe(true);
    expect(support.coverage).toBeGreaterThanOrEqual(0.42);
  });

  it("rejects a legal claim without citations", () => {
    const result = validateCitations({
      answer: answer([]),
      chunks: [chunk()],
      sources: new Map([[sourceId, source()]]),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("uncited_legal_claim");
  });

  it("rejects an answer made only of conversational blocks", () => {
    const conversationalOnly: LegalAnswer = {
      ...answer(),
      reply: [{ text: "Entiendo tu situación.", isLegalClaim: false, citationIds: [] }],
      citationIds: [],
    };
    const result = validateCitations({
      answer: conversationalOnly,
      chunks: [chunk()],
      sources: new Map([[sourceId, source()]]),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("uncited_legal_claim");
  });

  it("does not require citations on conversational blocks that carry no legal claim", () => {
    const result = validateCitations({
      answer: answer([chunkId]),
      chunks: [chunk()],
      sources: new Map([[sourceId, source()]]),
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.answer.reply[0]?.citationIds).toEqual([]);
  });
});
