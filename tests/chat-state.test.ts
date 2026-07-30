import { describe, expect, it } from "vitest";
import { chatReducer, initialChatState, statusLabel } from "@/features/chat/state";
import { canSimplify, hasPendingQuestion, hasRetrievedEvidence, latestQuickReplies } from "@/features/chat/types";

describe("chat state", () => {
  it("keeps messages temporary and clears them for a new conversation", () => {
    const withUser = chatReducer(initialChatState, {
      type: "user_message",
      message: { id: "user-1", role: "user", content: "Me despidieron" },
    });
    const reset = chatReducer(withUser, { type: "new_conversation" });

    expect(withUser.messages).toHaveLength(1);
    expect(reset).toEqual(initialChatState);
  });

  it("tracks sources and feedback without persisting a conversation", () => {
    const assistant = chatReducer(initialChatState, {
      type: "assistant_result",
      message: { id: "answer-1", role: "assistant", content: "Respuesta" },
    });
    const withFeedback = chatReducer(assistant, { type: "feedback", messageId: "answer-1", rating: "helpful" });
    const withSources = chatReducer(withFeedback, { type: "open_sources", citationId: "citation-1" });

    expect(withSources.messages[0]?.feedback).toBe("helpful");
    expect(withSources.sourcesOpen).toBe(true);
    expect(withSources.selectedCitationId).toBe("citation-1");
  });

  it("restores a conversation snapshot when switching sessions", () => {
    const snapshot = chatReducer(initialChatState, {
      type: "user_message",
      message: { id: "user-2", role: "user", content: "Consulta guardada en memoria" },
    });

    expect(chatReducer(initialChatState, { type: "restore_conversation", state: snapshot })).toEqual(snapshot);
  });

  it("exposes only high-level processing states", () => {
    expect(statusLabel("searching")).toBe("Buscando normas relevantes");
    expect(statusLabel("generating")).toBe("Pensando");
    expect(statusLabel("idle")).toBeNull();
  });

  it("clears the failed attempt's stages and surfaces the retry, without an error yet", () => {
    const sending = chatReducer(initialChatState, {
      type: "user_message",
      message: { id: "user-1", role: "user", content: "Me despidieron" },
    });
    const withStage = chatReducer(sending, {
      type: "stage",
      id: "plan",
      label: "Entendiendo tu situación",
      state: "done",
    });
    const retrying = chatReducer(withStage, { type: "retrying", attempt: 2 });

    expect(retrying.attempt).toBe(2);
    expect(retrying.errorMessage).toBeNull();
    expect(retrying.liveReasoning.steps).toEqual([]);
    expect(retrying.status).toBe("classifying");
  });

  it("drops the retry counter once the turn resolves either way", () => {
    const retrying = chatReducer(initialChatState, { type: "retrying", attempt: 3 });
    const failed = chatReducer(retrying, { type: "error", status: "error", message: "No pude." });
    const answered = chatReducer(retrying, {
      type: "assistant_result",
      message: { id: "answer-1", role: "assistant", content: "Respuesta" },
    });

    expect(failed.attempt).toBe(0);
    expect(answered.attempt).toBe(0);
  });

  it("reads the pending question and quick replies from the newest assistant turn", () => {
    const answered = {
      answerType: "clarification" as const,
      reply: [{ text: "Necesito un dato más.", isLegalClaim: false, citationIds: [] }],
      followUpQuestion: "¿Cuándo dejaste de trabajar allí?",
      quickReplies: ["Esta semana", "El mes pasado"],
      citationIds: [],
      confidenceLabel: "needs_more_information" as const,
    };
    const messages = [
      { id: "user-1", role: "user" as const, content: "Me despidieron" },
      { id: "answer-1", role: "assistant" as const, content: "Necesito un dato más.", answer: answered },
    ];

    expect(hasPendingQuestion(messages)).toBe(true);
    expect(latestQuickReplies(messages)).toEqual(["Esta semana", "El mes pasado"]);
    expect(hasPendingQuestion([messages[0]])).toBe(false);
    expect(
      hasPendingQuestion([...messages, {
        id: "answer-2",
        role: "assistant" as const,
        content: "Listo.",
        answer: { ...answered, followUpQuestion: null, quickReplies: [] },
      }]),
    ).toBe(false);
  });

  it("offers a plainer rewrite only for long, evidence-backed answers", () => {
    const base = {
      answerType: "answer" as const,
      reply: [{ text: "x".repeat(400), isLegalClaim: true, citationIds: ["c1"] }],
      followUpQuestion: null,
      quickReplies: [],
      citationIds: ["c1"],
      confidenceLabel: "evidence_supported" as const,
    };

    expect(canSimplify(base)).toBe(true);
    expect(canSimplify({ ...base, reply: [{ text: "Muy corto.", isLegalClaim: true, citationIds: ["c1"] }] })).toBe(false);
    expect(canSimplify({ ...base, answerType: "abstention" })).toBe(false);
    expect(canSimplify(undefined)).toBe(false);
  });

  it("only marks cited answers as containing retrieved evidence", () => {
    expect(hasRetrievedEvidence({ answer: { answerType: "answer" }, citations: [{ id: "citation-1" }] })).toBe(true);
    expect(hasRetrievedEvidence({ answer: { answerType: "clarification" }, citations: [{ id: "citation-1" }] })).toBe(false);
    expect(hasRetrievedEvidence({ answer: { answerType: "answer" }, citations: [] })).toBe(false);
  });
});
