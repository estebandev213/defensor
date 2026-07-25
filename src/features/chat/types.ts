export type ChatRole = "user" | "assistant";

export type ChatStatus =
  | "idle"
  | "classifying"
  | "searching"
  | "verifying"
  | "generating"
  | "error"
  | "rate_limited"
  | "offline";

export interface ChatCitation {
  id: string;
  index: number;
  citationLabel: string;
  normTitle: string;
  normNumber?: string;
  articleLabel?: string;
  excerpt: string;
  officialUrl: string;
  officialPublisher: string;
  status: string;
}

export interface ChatAnswerSection {
  heading: string;
  paragraphs: string[];
  citationIds: string[];
}

export interface ChatAnswer {
  answerType: "answer" | "clarification" | "abstention";
  title: string;
  summary: string;
  sections: ChatAnswerSection[];
  nextSteps: string[];
  warnings: string[];
  citationIds: string[];
  confidenceLabel:
    | "evidence_supported"
    | "needs_more_information"
    | "insufficient_evidence";
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  answer?: ChatAnswer;
  citations?: ChatCitation[];
  feedback?: "helpful" | "not_helpful";
}

export interface ChatState {
  messages: ChatMessage[];
  status: ChatStatus;
  errorMessage: string | null;
  selectedCitationId: string | null;
  sourcesOpen: boolean;
}

export type ChatAction =
  | { type: "user_message"; message: ChatMessage }
  | { type: "status"; status: ChatStatus }
  | {
      type: "assistant_result";
      message: ChatMessage;
    }
  | { type: "error"; status: Extract<ChatStatus, "error" | "rate_limited" | "offline">; message: string }
  | { type: "feedback"; messageId: string; rating: "helpful" | "not_helpful" }
  | { type: "open_sources"; citationId?: string }
  | { type: "close_sources" }
  | { type: "new_conversation" };
