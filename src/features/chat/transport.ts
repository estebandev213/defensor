import type { ChatAnswer, ChatCitation } from "@/features/chat/types";

export interface ChatTransportResult {
  answerId: string;
  answer: ChatAnswer;
  citations: ChatCitation[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function parseChatTransportResult(value: unknown): ChatTransportResult | null {
  if (!isRecord(value) || !isString(value.answerId) || !isRecord(value.answer)) return null;
  const answer = value.answer;
  if (
    !isString(answer.title) ||
    !isString(answer.summary) ||
    !Array.isArray(answer.sections) ||
    !Array.isArray(answer.nextSteps) ||
    !Array.isArray(answer.warnings) ||
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

  return {
    answerId: value.answerId,
    answer: answer as unknown as ChatAnswer,
    citations: citations as unknown as ChatCitation[],
  };
}

export async function readChatStream(response: Response): Promise<ChatTransportResult | null> {
  const body = response.body;
  if (!body) return null;
  const text = await new Response(body).text();
  const dataLines = text
    .split("\n")
    .filter((line) => line.startsWith("data: "))
    .map((line) => line.slice("data: ".length))
    .filter((line) => line !== "[DONE]");

  for (const line of dataLines) {
    try {
      const parsed = parseChatTransportResult(JSON.parse(line) as unknown);
      if (parsed) return parsed;
    } catch {
      continue;
    }
  }
  return null;
}
