import type { ChatAction, ChatState, ChatStatus } from "@/features/chat/types";

export const initialChatState: ChatState = {
  messages: [],
  status: "idle",
  errorMessage: null,
  selectedCitationId: null,
  sourcesOpen: false,
};

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "user_message":
      return {
        ...state,
        messages: [...state.messages, action.message],
        status: "classifying",
        errorMessage: null,
      };
    case "status":
      return { ...state, status: action.status, errorMessage: null };
    case "assistant_result":
      return {
        ...state,
        messages: [...state.messages, action.message],
        status: "idle",
        errorMessage: null,
      };
    case "error":
      return { ...state, status: action.status, errorMessage: action.message };
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
    case "new_conversation":
      return initialChatState;
  }
}

export function statusLabel(status: ChatStatus): string | null {
  const labels: Record<Exclude<ChatStatus, "idle" | "error" | "rate_limited" | "offline">, string> = {
    classifying: "Analizando tu consulta",
    searching: "Buscando normas relevantes",
    verifying: "Verificando las citas",
    generating: "Preparando una respuesta clara",
  };
  return status in labels ? labels[status as keyof typeof labels] : null;
}
