import { describe, expect, it } from "vitest";
import { chatReducer, initialChatState, statusLabel } from "@/features/chat/state";

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

  it("exposes only high-level processing states", () => {
    expect(statusLabel("searching")).toBe("Buscando normas relevantes");
    expect(statusLabel("idle")).toBeNull();
  });
});
