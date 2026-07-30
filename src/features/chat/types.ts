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

export interface ChatCaseProfile {
  topic: string | null;
  regime: string | null;
  terminationDate: string | null;
  contractType: string | null;
  tenure: string | null;
  otherFacts: string[];
  questionsAsked: number;
}

export interface ChatReasoningStep {
  id: string;
  label: string;
  detail?: string;
  done: boolean;
}

export interface ChatReasoning {
  understanding: string | null;
  steps: ChatReasoningStep[];
}

export interface ChatAnswerBlock {
  text: string;
  isLegalClaim: boolean;
  citationIds: string[];
}

export interface ChatAnswer {
  answerType: "answer" | "clarification" | "abstention";
  reply: ChatAnswerBlock[];
  followUpQuestion: string | null;
  quickReplies: string[];
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
  reasoning?: ChatReasoning;
  feedback?: "helpful" | "not_helpful";
}

export function hasRetrievedEvidence(message: {
  answer?: Pick<ChatAnswer, "answerType">;
  citations?: Array<Pick<ChatCitation, "id">>;
}): boolean {
  return message.answer?.answerType === "answer" && (message.citations?.length ?? 0) > 0;
}

function lastAssistantMessage(messages: readonly ChatMessage[]): ChatMessage | undefined {
  return [...messages].reverse().find((message) => message.role === "assistant");
}

/** Short taps the user can send back without typing; the newest turn wins. */
export function latestQuickReplies(messages: readonly ChatMessage[]): string[] {
  return lastAssistantMessage(messages)?.answer?.quickReplies ?? [];
}

/** True while the assistant is waiting on an answer to its own question. */
export function hasPendingQuestion(messages: readonly ChatMessage[]): boolean {
  return Boolean(lastAssistantMessage(messages)?.answer?.followUpQuestion);
}

/** Below this a reply is already short enough that rewriting it adds nothing. */
export const SIMPLIFY_THRESHOLD_CHARS = 320;

export function canSimplify(answer: ChatAnswer | undefined): boolean {
  if (!answer || answer.answerType !== "answer") return false;
  const length = answer.reply.reduce((total, block) => total + block.text.length, 0);
  return length >= SIMPLIFY_THRESHOLD_CHARS;
}

export interface ChatState {
  messages: ChatMessage[];
  status: ChatStatus;
  errorMessage: string | null;
  selectedCitationId: string | null;
  sourcesOpen: boolean;
  liveReasoning: ChatReasoning;
  caseProfile: ChatCaseProfile | null;
  /** 0 while on the first try; 2 or 3 while silently retrying a failed turn. */
  attempt: number;
}

export interface ChatConversation {
  id: string;
  title: string;
  sessionId: string;
  state: ChatState;
  selectedTopic: string | null;
}

export type ChatAction =
  | { type: "user_message"; message: ChatMessage }
  | { type: "status"; status: ChatStatus }
  | { type: "stage"; id: string; label: string; state: "active" | "done"; detail?: string }
  | { type: "understanding"; text: string }
  | { type: "retrying"; attempt: number }
  | {
      type: "assistant_result";
      message: ChatMessage;
      caseProfile?: ChatCaseProfile | null;
    }
  | { type: "error"; status: Extract<ChatStatus, "error" | "rate_limited" | "offline">; message: string }
  | { type: "feedback"; messageId: string; rating: "helpful" | "not_helpful" }
  | { type: "open_sources"; citationId?: string }
  | { type: "close_sources" }
  | { type: "restore_conversation"; state: ChatState }
  | { type: "new_conversation" };
