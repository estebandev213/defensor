import type { ChatAction, ChatReasoning, ChatState, ChatStatus } from "@/features/chat/types";

const emptyReasoning: ChatReasoning = { understanding: null, steps: [] };

export const initialChatState: ChatState = {
  messages: [],
  status: "idle",
  errorMessage: null,
  selectedCitationId: null,
  sourcesOpen: false,
  liveReasoning: emptyReasoning,
  caseProfile: null,
  attempt: 0,
};

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "user_message":
      return {
        ...state,
        messages: [...state.messages, action.message],
        status: "classifying",
        errorMessage: null,
        liveReasoning: emptyReasoning,
        attempt: 0,
      };
    case "status":
      return { ...state, status: action.status, errorMessage: null };
    case "stage": {
      const steps = state.liveReasoning.steps.some((step) => step.id === action.id)
        ? state.liveReasoning.steps.map((step) =>
            step.id === action.id
              ? { ...step, label: action.label, detail: action.detail, done: action.state === "done" }
              : step,
          )
        : [
            ...state.liveReasoning.steps,
            { id: action.id, label: action.label, detail: action.detail, done: action.state === "done" },
          ];
      return { ...state, liveReasoning: { ...state.liveReasoning, steps } };
    }
    case "understanding":
      return { ...state, liveReasoning: { ...state.liveReasoning, understanding: action.text } };
    case "retrying":
      // A retry starts the pipeline over, so the stages from the failed attempt go away.
      return {
        ...state,
        status: "classifying",
        errorMessage: null,
        liveReasoning: emptyReasoning,
        attempt: action.attempt,
      };
    case "assistant_result":
      return {
        ...state,
        messages: [...state.messages, action.message],
        status: "idle",
        errorMessage: null,
        liveReasoning: emptyReasoning,
        caseProfile: action.caseProfile ?? state.caseProfile,
        attempt: 0,
      };
    case "error":
      return {
        ...state,
        status: action.status,
        errorMessage: action.message,
        liveReasoning: emptyReasoning,
        attempt: 0,
      };
    case "feedback":
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === action.messageId ? { ...message, feedback: action.rating } : message,
        ),
      };
    case "open_sources":
      return {
        ...state,
        sourcesOpen: true,
        selectedCitationId: action.citationId ?? state.selectedCitationId,
      };
    case "close_sources":
      return { ...state, sourcesOpen: false };
    case "restore_conversation":
      return action.state;
    case "new_conversation":
      return initialChatState;
  }
}

/** Accessible fallback while the server has not sent its own reasoning labels yet. */
export function statusLabel(status: ChatStatus): string | null {
  const labels: Record<Exclude<ChatStatus, "idle" | "error" | "rate_limited" | "offline">, string> = {
    classifying: "Analizando tu consulta",
    searching: "Buscando normas relevantes",
    verifying: "Verificando las citas",
    generating: "Pensando",
  };
  return status in labels ? labels[status as keyof typeof labels] : null;
}
