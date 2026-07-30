"use client";

import Image from "next/image";
import { useEffect, useMemo, useReducer, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { EmphasizedText } from "@/components/emphasized-text";
import { ReasoningTrail } from "@/components/reasoning-trail";
import { Sidebar } from "@/components/sidebar";
import { SourcesPanel } from "@/components/sources-panel";
import { TypingText } from "@/components/typing-text";
import { chatReducer, initialChatState, statusLabel } from "@/features/chat/state";
import { readChatStream } from "@/features/chat/transport";
import { canSimplify, hasPendingQuestion, latestQuickReplies } from "@/features/chat/types";
import type { ChatCitation, ChatConversation, ChatMessage } from "@/features/chat/types";
import { cn } from "@/lib/cn";

const SIMPLIFY_PROMPT = "Explícamelo más simple, por favor.";

/** A failed turn is retried silently; only a third failure is worth interrupting for. */
const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [1_200, 2_500];

/** Hitting the limit again immediately would only push it further out. */
class RateLimitedError extends Error {
  public constructor(public readonly retryAfterSeconds: number | null = null) {
    super("rate_limited");
    this.name = "RateLimitedError";
  }
}

/**
 * The limit can come from our own gate or from the upstream model provider. In
 * both cases the only useful thing to say is how long to wait.
 */
function rateLimitMessage(retryAfterSeconds: number | null): string {
  if (retryAfterSeconds === null) {
    return "Se alcanzó el límite temporal de consultas. Espera un momento y vuelve a intentarlo.";
  }
  if (retryAfterSeconds < 60) {
    return `Se alcanzó el límite temporal de consultas. Espera unos ${retryAfterSeconds} segundos y vuelve a intentarlo.`;
  }
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return `Se alcanzó el límite temporal de consultas. Espera ${minutes} ${minutes === 1 ? "minuto" : "minutos"} y vuelve a intentarlo.`;
}

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = globalThis.setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      globalThis.clearTimeout(timer);
      resolve();
    }, { once: true });
  });
}

const suggestedPrompts = [
  { label: "Me despidieron", icon: "briefcase" },
  { label: "No me pagaron horas extra", icon: "clock" },
  { label: "¿Me corresponde CTS?", icon: "document" },
  { label: "Vacaciones truncas", icon: "document" },
] as const;

const openingPhrases = [
  "Cuéntame tu caso",
  "¿Te despidieron?",
  "¿No te pagaron CTS?",
  "¿Tienes dudas sobre vacaciones?",
  "¿Necesitas revisar tu contrato?",
] as const;

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createConversation(id: string, title: string): ChatConversation {
  return {
    id,
    title,
    sessionId: createId(),
    state: initialChatState,
    selectedTopic: null,
  };
}

function conversationTitle(question: string): string {
  const normalized = question.replace(/\s+/g, " ").trim();
  return normalized.length > 42 ? `${normalized.slice(0, 42).trimEnd()}…` : normalized;
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="m21 3-7.5 18-3.2-7.3L3 10.5 21 3Z" strokeLinejoin="round" />
      <path d="m10.3 13.7 4.6-4.6" strokeLinecap="round" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M12 3.5 19 6v5.1c0 4.2-2.7 7.6-7 9.4-4.3-1.8-7-5.2-7-9.4V6l7-2.5Z" strokeLinejoin="round" />
      <path d="m8.7 12 2.1 2.1 4.5-4.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SuggestionIcon({ name }: { name: (typeof suggestedPrompts)[number]["icon"] }) {
  if (name === "clock") {
    return (
      <svg viewBox="0 0 24 24" className="size-[1.15rem]" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.2 2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "document") {
    return (
      <svg viewBox="0 0 24 24" className="size-[1.15rem]" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M7 3.5h7l3.5 3.5V20.5H7z" strokeLinejoin="round" /><path d="M14 3.5V7h3.5M9.5 11h5M9.5 14h5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="size-[1.15rem]" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M5 8.5A2.5 2.5 0 0 1 7.5 6h9A2.5 2.5 0 0 1 19 8.5v7a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 15.5z" strokeLinejoin="round" /><path d="M8 6V4.5h8V6M9 11h6" strokeLinecap="round" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3Z" strokeLinejoin="round" />
      <path d="m14.5 6.5 3 3" strokeLinecap="round" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M12 4.5 13.5 9l4.5 1.5L13.5 12 12 16.5 10.5 12 6 10.5 10.5 9 12 4.5Z" strokeLinejoin="round" />
      <path d="M18 16.5 18.7 18l1.5.7-1.5.7-.7 1.5-.7-1.5-1.5-.7 1.5-.7.7-1.5Z" strokeLinejoin="round" />
    </svg>
  );
}

const outlineChip =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-dashed border-border px-4 text-sm text-navy-soft transition hover:border-brass hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass";

function AnswerActions({
  replies,
  simplifiable,
  onSelect,
  onCompose,
  onSimplify,
}: {
  replies: string[];
  simplifiable: boolean;
  onSelect: (reply: string) => void;
  onCompose: () => void;
  onSimplify: () => void;
}) {
  if (replies.length === 0 && !simplifiable) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-2" aria-label="Respuestas rápidas">
      {replies.map((reply) => (
        <button
          type="button"
          key={reply}
          className="min-h-11 rounded-full border border-brass/40 bg-brass-soft/50 px-4 text-sm text-ink transition hover:border-brass hover:bg-brass-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
          onClick={() => onSelect(reply)}
        >
          {reply}
        </button>
      ))}
      {/* None of the options fit: hand the person straight to the composer. */}
      {replies.length > 0 ? (
        <button type="button" className={outlineChip} onClick={onCompose}>
          <PencilIcon />
          Otra respuesta
        </button>
      ) : null}
      {/* Long answers get a second pass in plainer words over the same sources. */}
      {simplifiable ? (
        <button type="button" className={outlineChip} onClick={onSimplify}>
          <SparkIcon />
          Explicarlo más simple
        </button>
      ) : null}
    </div>
  );
}

function SourcesFooter({
  citations,
  onCitation,
}: {
  citations: ChatCitation[];
  onCitation: (citationId: string) => void;
}) {
  if (citations.length === 0) return null;

  return (
    <details className="group mt-5 border-t border-border-soft pt-4">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-lg text-xs font-semibold text-muted transition hover:text-navy-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass">
        <span aria-hidden="true" className="transition-transform group-open:rotate-90">›</span>
        Fuentes: {citations.length} {citations.length === 1 ? "norma oficial" : "normas oficiales"}
      </summary>
      <ul className="mt-3 space-y-1.5">
        {citations.map((citation) => (
          <li key={citation.id}>
            <button
              type="button"
              className="min-h-9 text-left text-sm text-navy-soft underline decoration-border underline-offset-4 transition hover:text-ink hover:decoration-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
              onClick={() => onCitation(citation.id)}
            >
              {citation.normTitle}
              {citation.articleLabel ? <span className="text-muted"> · {citation.articleLabel}</span> : null}
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}

function AssistantAnswer({
  message,
  onCitation,
  onQuickReply,
  onCompose,
  onSimplify,
}: {
  message: ChatMessage;
  onCitation: (citationId: string) => void;
  onQuickReply: (reply: string) => void;
  onCompose: () => void;
  onSimplify: () => void;
}) {
  const answer = message.answer;
  if (!answer) return null;
  const citations = message.citations ?? [];

  return (
    <article className="min-w-0 flex-1 rounded-2xl border border-border-soft bg-paper p-5 shadow-[0_8px_30px_rgba(22,37,62,0.04)] sm:p-6">
      {message.reasoning ? <ReasoningTrail reasoning={message.reasoning} live={false} /> : null}

      <div className="space-y-4 text-base leading-7 text-ink">
        {answer.reply.map((block, index) => (
          <p
            key={`${message.id}-${index}`}
            className="reveal-block"
            style={{ animationDelay: `${Math.min(index, 5) * 110}ms` }}
          >
            <EmphasizedText text={block.text} />
          </p>
        ))}
      </div>

      {answer.followUpQuestion ? (
        <p
          className="reveal-block mt-5 border-l-2 border-brass pl-4 text-base font-semibold leading-7 text-ink"
          style={{ animationDelay: `${Math.min(answer.reply.length, 5) * 110}ms` }}
        >
          {answer.followUpQuestion}
        </p>
      ) : null}

      <AnswerActions
        replies={answer.quickReplies}
        simplifiable={canSimplify(answer)}
        onSelect={onQuickReply}
        onCompose={onCompose}
        onSimplify={onSimplify}
      />

      <SourcesFooter citations={citations} onCitation={onCitation} />
    </article>
  );
}

export function ChatShell() {
  const [initialConversationId] = useState(() => createId());
  const [state, dispatch] = useReducer(chatReducer, initialChatState);
  const [conversations, setConversations] = useState<ChatConversation[]>(() => [
    createConversation(initialConversationId, "Conversación actual"),
  ]);
  const [activeConversationId, setActiveConversationId] = useState(initialConversationId);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const lastTurnRef = useRef<{ content: string; style: "normal" | "simple" } | null>(null);
  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId);
  const sessionId = activeConversation?.sessionId ?? "";

  const citations = useMemo(
    () => state.messages.flatMap((message) => message.citations ?? []),
    [state.messages],
  );
  const isBusy = state.status === "classifying" || state.status === "searching" || state.status === "verifying" || state.status === "generating";
  const statusText = statusLabel(state.status);
  const isEmptyState = state.messages.length === 0;
  const quickReplies = useMemo(() => latestQuickReplies(state.messages), [state.messages]);
  const pendingQuestion = useMemo(() => hasPendingQuestion(state.messages), [state.messages]);
  const hasLiveReasoning = state.liveReasoning.steps.length > 0 || state.liveReasoning.understanding !== null;

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (!state.sourcesOpen) return;
    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") dispatch({ type: "close_sources" });
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [state.sourcesOpen]);

  function selectTopic(topic: string) {
    setSelectedTopic(topic);
    setDraft(`Quiero entender mi situación sobre ${topic.toLowerCase()}.`);
    setIsSidebarOpen(false);
  }

  function startNewConversation() {
    abortRef.current?.abort();
    abortRef.current = null;
    const newConversation = createConversation(createId(), `Conversación ${conversations.length + 1}`);
    setConversations((current) => current.map((conversation) => (
      conversation.id === activeConversationId
        ? { ...conversation, state, selectedTopic }
        : conversation
    )).concat(newConversation));
    setActiveConversationId(newConversation.id);
    dispatch({ type: "new_conversation" });
    setSelectedTopic(null);
    setDraft("");
    setIsSidebarOpen(false);
  }

  function selectConversation(conversationId: string) {
    if (conversationId === activeConversationId) return;
    const conversation = conversations.find((item) => item.id === conversationId);
    if (!conversation) return;

    abortRef.current?.abort();
    abortRef.current = null;
    setConversations((current) => current.map((item) => (
      item.id === activeConversationId
        ? {
            ...item,
            state: { ...state, status: "idle", errorMessage: null, liveReasoning: { understanding: null, steps: [] } },
            selectedTopic,
          }
        : item
    )));
    setActiveConversationId(conversationId);
    dispatch({ type: "restore_conversation", state: conversation.state });
    setSelectedTopic(conversation.selectedTopic);
    setDraft("");
    setIsSidebarOpen(false);
  }

  async function sendQuestion(question: string, style: "normal" | "simple" = "normal") {
    const content = question.trim();
    if (!content || isBusy) return;
    lastTurnRef.current = { content, style };
    const userMessage: ChatMessage = { id: createId(), role: "user", content };
    const requestMessages = [...state.messages, userMessage].map(({ role, content: messageContent }) => ({ role, content: messageContent }));
    setDraft("");
    setConversations((current) => current.map((conversation) => (
      conversation.id === activeConversationId && conversation.title.startsWith("Conversación")
        ? { ...conversation, title: conversationTitle(content) }
        : conversation
    )));
    dispatch({ type: "user_message", message: userMessage });

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        await runTurn(requestMessages, style, controller);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (controller.signal.aborted) return;

        const offline = typeof navigator !== "undefined" && !navigator.onLine;
        if (error instanceof RateLimitedError) {
          dispatch({
            type: "error",
            status: "rate_limited",
            message: rateLimitMessage(error.retryAfterSeconds),
          });
          return;
        }
        // Retrying without a network, or after the last attempt, only wastes the
        // person's time — say so instead.
        if (offline) {
          dispatch({ type: "error", status: "offline", message: "No hay conexión. Revisa tu red e inténtalo nuevamente." });
          return;
        }
        if (attempt === MAX_ATTEMPTS) {
          dispatch({
            type: "error",
            status: "error",
            message: `No pude consultar las fuentes después de ${MAX_ATTEMPTS} intentos. Espera un momento y vuelve a intentarlo, o empieza una conversación nueva.`,
          });
          return;
        }

        dispatch({ type: "retrying", attempt: attempt + 1 });
        await delay(RETRY_DELAYS_MS[attempt - 1] ?? 2_000, controller.signal);
        if (controller.signal.aborted) return;
      }
    }
  }

  async function runTurn(
    requestMessages: { role: ChatMessage["role"]; content: string }[],
    style: "normal" | "simple",
    controller: AbortController,
  ) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        messages: requestMessages,
        caseProfile: state.caseProfile ?? undefined,
        style,
        locale: "es-PE",
      }),
      signal: controller.signal,
    });
    if (response.status === 429) {
      const header = Number(response.headers.get("Retry-After"));
      throw new RateLimitedError(Number.isFinite(header) && header > 0 ? Math.ceil(header) : null);
    }
    if (!response.ok) throw new Error("provider_unavailable");

    const streamErrors: { code: string; retryAfterSeconds?: number }[] = [];
    const result = await readChatStream(response, (event) => {
      if (controller.signal.aborted) return;
      if (event.type === "stage") {
        dispatch({ type: "stage", id: event.id, label: event.label, state: event.state, detail: event.detail });
      } else if (event.type === "understanding") {
        dispatch({ type: "understanding", text: event.text });
      } else {
        streamErrors.push(event);
      }
    });
    if (controller.signal.aborted) return;

    // The route answers 200 and reports failures inside the stream, so an
    // upstream rate limit only shows up here — retrying it would spend tokens
    // against the very window that is already exhausted.
    const streamError = streamErrors[0];
    if (streamError?.code === "RATE_LIMITED") {
      throw new RateLimitedError(streamError.retryAfterSeconds ?? null);
    }
    if (streamError || !result) throw new Error(streamError?.code ?? "invalid_stream");

    dispatch({
      type: "assistant_result",
      caseProfile: result.caseProfile,
      message: {
        id: result.answerId,
        role: "assistant",
        content: result.answer.reply.map((block) => block.text).join("\n\n"),
        answer: result.answer,
        citations: result.citations,
        reasoning: result.reasoning
          ? {
              understanding: result.reasoning.understanding,
              steps: result.reasoning.steps.map((step, index) => ({
                id: `${result.answerId}-${index}`,
                label: step.label,
                detail: step.detail,
                done: true,
              })),
            }
          : undefined,
      },
    });
  }

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendQuestion(draft);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendQuestion(draft);
    }
  }

  function focusComposer() {
    const composer = composerRef.current;
    if (!composer) return;
    composer.scrollIntoView({ block: "nearest", behavior: "smooth" });
    composer.focus();
  }

  function openCitation(citationId: string) {
    dispatch({ type: "open_sources", citationId });
  }

  // The opening invitation only makes sense on the first message; after that the
  // person is continuing a conversation, not starting a query.
  const composerPlaceholder = isEmptyState
    ? "Escribe tu consulta laboral..."
    : pendingQuestion
      ? "Responde o detalla tu situación..."
      : "Cuéntame más de tu situación...";

  const composerForm = (
    <form className="w-full" onSubmit={submitQuestion}>
      <label htmlFor="question" className="sr-only">Escribe tu consulta laboral</label>
      <div className={cn(
        "flex min-h-16 items-center gap-3 rounded-[1.35rem] border border-border-soft bg-paper p-2 shadow-[0_10px_28px_rgba(18,36,65,0.07)]",
        isEmptyState && "sm:min-h-[4.65rem]",
      )}>
        <textarea
          id="question"
          ref={composerRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onInput={(event) => setDraft(event.currentTarget.value)}
          onKeyDown={handleComposerKeyDown}
          rows={1}
          disabled={isBusy}
          className="min-h-11 flex-1 resize-none border-0 bg-transparent px-3 py-2 text-left text-base leading-6 text-ink placeholder:text-left placeholder:text-muted focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60"
          placeholder={composerPlaceholder}
        />
        <button
          type="submit"
          disabled={draft.trim().length === 0 || isBusy}
          aria-label="Enviar consulta"
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-full text-paper transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2",
            draft.trim().length > 0 && !isBusy ? "bg-navy hover:bg-navy/90" : "cursor-not-allowed bg-border text-muted",
          )}
        >
          <SendIcon />
        </button>
      </div>
    </form>
  );

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-paper text-ink">
      <Sidebar
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        conversations={conversations}
        activeConversationId={activeConversationId}
        selectedTopic={selectedTopic}
        onClose={() => setIsSidebarOpen(false)}
        onToggleCollapse={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
        onNewConversation={startNewConversation}
        onSelectConversation={selectConversation}
        onSelectTopic={selectTopic}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1">
          <main className={cn("relative flex min-w-0 flex-1 flex-col overflow-hidden", isEmptyState ? "bg-background" : "bg-paper")}>
            <button
              type="button"
              className="absolute left-3 top-3 z-20 inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-paper text-navy-soft shadow-sm ring-1 ring-border hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass lg:hidden"
              aria-controls="main-sidebar"
              aria-expanded={isSidebarOpen}
              aria-label="Abrir menú"
              onClick={() => setIsSidebarOpen(true)}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m15 5-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {citations.length > 0 ? <button type="button" className="absolute right-3 top-3 z-20 inline-flex min-h-11 items-center gap-2 rounded-xl bg-paper px-3 text-sm font-semibold text-navy-soft shadow-sm ring-1 ring-border hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass xl:hidden" onClick={() => dispatch({ type: "open_sources" })}>Fuentes <span className="rounded-full bg-brass-soft px-2 py-0.5 text-xs text-ink">{citations.length}</span></button> : null}
            <div className={cn("chat-scrollbar min-h-0 flex-1", isEmptyState ? "overflow-hidden pb-8" : "overflow-y-auto pb-52")}>
              <div className={cn("mx-auto flex w-full max-w-[53rem] flex-1 flex-col px-4 sm:px-8", isEmptyState ? "empty-chat-panel min-h-full" : "py-5 sm:py-8")}>
                {isEmptyState ? (
                  <div className="pointer-events-none sticky top-0 z-30 flex h-0 justify-center">
                    <div className="pointer-events-auto inline-flex max-w-[calc(100vw-2rem)] translate-y-4 items-center gap-2 rounded-full border border-verified/20 bg-paper/90 px-7 py-3.5 text-center text-xs text-verified shadow-[0_2px_12px_rgba(46,111,94,0.04)] backdrop-blur sm:px-9 sm:py-4 sm:text-sm">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-verified/10"><ShieldCheckIcon /></span>
                      Las respuestas se revisan contra fuentes oficiales
                    </div>
                  </div>
                ) : null}
                {isEmptyState ? (
                  <section className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-12 text-center sm:px-8 sm:py-16" aria-label="Nueva conversación">
                    <Image
                      src="/images/logo.png"
                      alt="Logo de Defensor"
                      width={80}
                      height={80}
                      className="size-20 rounded-[1.55rem] object-cover shadow-[0_10px_22px_rgba(18,36,65,0.12)]"
                    />
                    <h1 aria-label="Cuéntame tu caso" className="mt-4 max-w-xl font-serif text-[2.65rem] font-semibold leading-none tracking-[-0.04em] text-navy sm:text-[3.55rem]"><TypingText phrases={openingPhrases} /></h1>
                    <p className="mt-6 max-w-[29rem] text-base leading-7 text-navy-soft sm:text-lg">Estoy aquí para orientarte sobre tus derechos laborales<br className="hidden sm:block" /> con información clara, prudente y verificable.</p>
                    <div className="mt-8 flex w-full max-w-[46rem] flex-col gap-10">
                      <div>
                        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-muted">Puedes empezar con algunos ejemplos</p>
                        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible">
                          {suggestedPrompts.slice(0, 3).map((prompt) => (
                            <button type="button" key={prompt.label} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-border-soft bg-paper px-4 text-left text-xs text-navy-soft shadow-sm transition hover:border-brass hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass sm:px-3 sm:text-sm" onClick={() => setDraft(prompt.label)}>
                              <span className="text-brass"><SuggestionIcon name={prompt.icon} /></span>{prompt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        {composerForm}
                        <p className="mt-3 text-center text-xs leading-5 text-muted">No compartas datos ni documentos confidenciales. Defensor puede cometer errores.</p>
                      </div>
                    </div>
                  </section>
                ) : (
                  <section className="space-y-5" aria-label="Conversación">
                    {state.messages.map((message) => message.role === "user" ? (
                      <div key={message.id} className="flex justify-end"><div className="max-w-[36rem] rounded-2xl rounded-br-md bg-brass-soft px-5 py-4 text-sm leading-6 text-ink sm:text-base">{message.content}</div></div>
                    ) : (
                      <div key={message.id} className="flex items-start gap-3"><Image src="/images/logo.png" alt="" width={36} height={36} className="mt-1 size-9 shrink-0 rounded-full object-cover" aria-hidden="true" /><AssistantAnswer message={message} onCitation={openCitation} onQuickReply={(reply) => { void sendQuestion(reply); }} onCompose={focusComposer} onSimplify={() => { void sendQuestion(SIMPLIFY_PROMPT, "simple"); }} /></div>
                    ))}
                  </section>
                )}

                {isBusy && state.attempt > 1 ? (
                  <p className="mt-5 ml-0 text-sm text-muted sm:ml-12" role="status" aria-live="polite">
                    La conexión falló. Reintentando ({state.attempt} de {MAX_ATTEMPTS})…
                  </p>
                ) : null}
                {isBusy && hasLiveReasoning ? (
                  <div className="mt-5 ml-0 sm:ml-12">
                    <ReasoningTrail reasoning={state.liveReasoning} live />
                  </div>
                ) : null}
                {isBusy && !hasLiveReasoning && statusText ? (
                  <div className="mt-6 ml-0 flex items-center gap-3 text-sm text-navy-soft sm:ml-12" role="status" aria-live="polite">
                    <span className="sr-only">{statusText}</span>
                    <span aria-hidden="true" className="inline-flex items-center gap-0.5 text-brass">
                      <span className="animate-bounce [animation-delay:-0.3s]">•</span>
                      <span className="animate-bounce [animation-delay:-0.15s]">•</span>
                      <span className="animate-bounce">•</span>
                    </span>
                    <span aria-hidden="true">{statusText}</span>
                  </div>
                ) : null}
                {state.status === "rate_limited" || state.status === "offline" || state.status === "error" ? (
                  <div className="mt-6 ml-0 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm leading-6 text-danger sm:ml-12" role="alert">
                    <p>{state.errorMessage}</p>
                    <div className="mt-2 flex flex-wrap gap-4">
                      {lastTurnRef.current ? <button type="button" className="font-semibold underline underline-offset-4" onClick={() => { const last = lastTurnRef.current; if (last) void sendQuestion(last.content, last.style); }}>Intentar nuevamente</button> : null}
                      <button type="button" className="font-semibold underline underline-offset-4" onClick={startNewConversation}>Empezar una conversación nueva</button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {!isEmptyState ? <div className="absolute bottom-0 left-0 right-0 z-10 mx-auto max-w-[53rem] border-t border-border bg-paper/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:px-8 xl:border-t-0 xl:bg-paper xl:pb-3 xl:pt-6">
              {quickReplies.length === 0 && !isBusy ? (
                <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Preguntas sugeridas">
                  {suggestedPrompts.slice(0, 3).map((prompt) => <button type="button" key={prompt.label} className="min-h-11 shrink-0 rounded-lg border border-border bg-paper px-4 text-left text-sm text-navy-soft transition hover:border-brass hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass" onClick={() => setDraft(prompt.label)}>{prompt.label}</button>)}
                </div>
              ) : null}
              <div className="mt-4">{composerForm}</div>
              <p className="mt-3 text-center text-xs leading-5 text-muted">No compartas datos ni documentos confidenciales. Defensor puede cometer errores.</p>
            </div> : null}
          </main>
          <SourcesPanel citations={citations} selectedCitationId={state.selectedCitationId} showEyebrow={false} onSelectCitation={(citationId) => dispatch({ type: "open_sources", citationId })} />
        </div>
        <footer className={cn("flex min-h-8 items-center justify-center px-4 text-[0.65rem] text-muted", isEmptyState ? "bg-background" : "bg-paper")}>
          <span>Developed by </span>
          <a
            href="https://github.com/estebandev213"
            target="_blank"
            rel="noreferrer"
            className="ml-1 font-medium text-navy-soft underline decoration-border underline-offset-2 transition hover:text-brass hover:decoration-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
          >
            estebanvc
          </a>
        </footer>
      </div>
      {/* Mounted only while open: with mobileOpen=false this renders the desktop
          aside again and duplicates the panel next to itself. */}
      {state.sourcesOpen ? (
        <SourcesPanel citations={citations} selectedCitationId={state.selectedCitationId} mobileOpen onClose={() => dispatch({ type: "close_sources" })} onSelectCitation={(citationId) => dispatch({ type: "open_sources", citationId })} />
      ) : null}
    </div>
  );
}
