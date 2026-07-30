import type { ChatAnswer, ChatCaseProfile, ChatCitation } from "@/features/chat/types";

export interface ChatTransportResult {
  answerId: string;
  answer: ChatAnswer;
  citations: ChatCitation[];
  caseProfile: ChatCaseProfile | null;
  reasoning: { understanding: string; steps: { label: string; detail?: string }[] } | null;
}

export type ChatStreamEvent =
  | { type: "stage"; id: string; label: string; state: "active" | "done"; detail?: string }
  | { type: "understanding"; text: string }
  | { type: "error"; code: string; retryAfterSeconds?: number };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function parseStreamEvent(value: unknown): ChatStreamEvent | null {
  if (!isRecord(value)) return null;
  if (value.type === "stage" && isString(value.id) && isString(value.label)) {
    const state = value.state === "done" ? "done" : "active";
    return {
      type: "stage",
      id: value.id,
      label: value.label,
      state,
      detail: isString(value.detail) ? value.detail : undefined,
    };
  }
  if (value.type === "understanding" && isString(value.text)) {
    return { type: "understanding", text: value.text };
  }
  if (value.type === "error" && isString(value.code)) {
    return {
      type: "error",
      code: value.code,
      ...(typeof value.retryAfterSeconds === "number" && Number.isFinite(value.retryAfterSeconds)
        ? { retryAfterSeconds: value.retryAfterSeconds }
        : {}),
    };
  }
  return null;
}

export function parseChatTransportResult(value: unknown): ChatTransportResult | null {
  if (!isRecord(value) || !isString(value.answerId) || !isRecord(value.answer)) return null;
  const answer = value.answer;
  if (
    !Array.isArray(answer.reply) ||
    answer.reply.length === 0 ||
    !answer.reply.every(
      (block) => isRecord(block) && isString(block.text) && Array.isArray(block.citationIds),
    ) ||
    !Array.isArray(answer.quickReplies) ||
    !Array.isArray(answer.citationIds)
  ) {
    return null;
  }

  const citations = Array.isArray(value.citations) ? value.citations : [];
  if (
    !citations.every(
      (citation) =>
        isRecord(citation) &&
        isString(citation.id) &&
        typeof citation.index === "number" &&
        isString(citation.citationLabel) &&
        isString(citation.normTitle) &&
        isString(citation.excerpt) &&
        isString(citation.officialUrl) &&
        isString(citation.officialPublisher) &&
        isString(citation.status),
    )
  ) {
    return null;
  }

  const reasoning =
    isRecord(value.reasoning) && isString(value.reasoning.understanding) && Array.isArray(value.reasoning.steps)
      ? (value.reasoning as ChatTransportResult["reasoning"])
      : null;

  return {
    answerId: value.answerId,
    answer: answer as unknown as ChatAnswer,
    citations: citations as unknown as ChatCitation[],
    caseProfile: isRecord(value.caseProfile) ? (value.caseProfile as unknown as ChatCaseProfile) : null,
    reasoning,
  };
}

/**
 * Reads the SSE body frame by frame so reasoning stages surface while the
 * server is still working; the final answer frame ends the turn.
 */
export async function readChatStream(
  response: Response,
  onEvent?: (event: ChatStreamEvent) => void,
): Promise<ChatTransportResult | null> {
  const body = response.body;
  if (!body) return null;

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: ChatTransportResult | null = null;

  const consume = (line: string) => {
    if (!line.startsWith("data: ")) return;
    const data = line.slice("data: ".length);
    if (data === "[DONE]") return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(data) as unknown;
    } catch {
      return;
    }
    const answer = parseChatTransportResult(parsed);
    if (answer) {
      result = answer;
      return;
    }
    const event = parseStreamEvent(parsed);
    if (event && onEvent) onEvent(event);
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (value) buffer += decoder.decode(value, { stream: true });
    let newlineIndex = buffer.indexOf("\n");
    while (newlineIndex !== -1) {
      consume(buffer.slice(0, newlineIndex).trimEnd());
      buffer = buffer.slice(newlineIndex + 1);
      newlineIndex = buffer.indexOf("\n");
    }
    if (done) break;
  }
  consume(buffer.trimEnd());

  return result;
}
