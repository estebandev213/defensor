"use client";

import { useEffect, useMemo, useReducer, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { BrandMark } from "@/components/brand-mark";
import { Sidebar } from "@/components/sidebar";
import { SourcesPanel } from "@/components/sources-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { chatReducer, initialChatState, statusLabel } from "@/features/chat/state";
import { readChatStream } from "@/features/chat/transport";
import type { ChatCitation, ChatMessage } from "@/features/chat/types";
import { cn } from "@/lib/cn";

const suggestedPrompts = [
  "Me despidieron",
  "No me pagaron horas extra",
  "¿Me corresponde CTS?",
  "Vacaciones truncas",
];

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function ScalesIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M12 3v18M5 6h14M12 6 7 14M12 6l5 8" strokeLinecap="round" />
      <path d="M3.5 14c0 1.9 1.6 3.5 3.5 3.5s3.5-1.6 3.5-3.5h-7ZM13.5 14c0 1.9 1.6 3.5 3.5 3.5s3.5-1.6 3.5-3.5h-7Z" />
      <path d="M9 21h6" strokeLinecap="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="m21 3-7.5 18-3.2-7.3L3 10.5 21 3Z" strokeLinejoin="round" />
      <path d="m10.3 13.7 4.6-4.6" strokeLinecap="round" />
    </svg>
  );
}

function CitationButton({ citation, onClick }: { citation: ChatCitation; onClick: () => void }) {
  return (
    <button
      type="button"
      className="ml-1 inline-flex min-h-7 min-w-7 items-center justify-center rounded-full border border-brass/50 bg-brass-soft px-2 text-xs font-semibold text-ink align-middle hover:border-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
      aria-label={`Abrir fuente ${citation.index}`}
      onClick={onClick}
    >
      [{citation.index}]
    </button>
  );
}

function AssistantAnswer({
  message,
  onCitation,
  onFeedback,
}: {
  message: ChatMessage;
  onCitation: (citationId: string) => void;
  onFeedback: (rating: "helpful" | "not_helpful") => void;
}) {
  const answer = message.answer;
  if (!answer) return null;
  const citations = new Map((message.citations ?? []).map((citation) => [citation.id, citation]));

  return (
    <article className="min-w-0 flex-1 rounded-2xl border border-border-soft bg-paper p-5 shadow-[0_8px_30px_rgba(22,37,62,0.04)] sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Defensor</p>
          <h2 className="mt-1 font-serif text-2xl font-semibold text-ink">{answer.title}</h2>
        </div>
        <span className={cn(
          "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
          answer.answerType === "answer" ? "bg-verified/10 text-verified" : "bg-brass-soft text-ink",
        )}>
          {answer.answerType === "answer" ? "Con respaldo" : "Revisión necesaria"}
        </span>
      </div>

      <p className="mt-5 text-base leading-7 text-ink sm:text-lg">{answer.summary}</p>

      {answer.sections.map((section) => (
        <section key={section.heading} className="mt-6 border-t border-border-soft pt-5">
          <h3 className="font-semibold text-ink">{section.heading}</h3>
          <div className="mt-2 space-y-3 text-sm leading-6 text-navy-soft sm:text-base">
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
          {section.citationIds.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-1 text-sm text-navy-soft">
              <span>Fuentes:</span>
              {section.citationIds.map((citationId) => {
                const citation = citations.get(citationId);
                return citation ? <CitationButton key={citationId} citation={citation} onClick={() => onCitation(citationId)} /> : null;
              })}
            </div>
          ) : null}
        </section>
      ))}

      {answer.nextSteps.length > 0 ? (
        <section className="mt-6 border-t border-border-soft pt-5">
          <h3 className="font-semibold text-ink">Próximos pasos prudentes</h3>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-navy-soft sm:text-base">
            {answer.nextSteps.map((step) => <li key={step} className="flex gap-2"><span className="text-brass">✓</span><span>{step}</span></li>)}
          </ul>
        </section>
      ) : null}

      {answer.warnings.length > 0 ? (
        <div className="mt-5 rounded-xl bg-brass-soft/60 px-4 py-3 text-xs leading-5 text-navy-soft">
          {answer.warnings.map((warning) => <p key={warning}>{warning}</p>)}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border-soft pt-4">
        <span className="text-xs text-muted">¿Te resultó útil esta orientación?</span>
        <div className="flex gap-2">
          <button
            type="button"
            className={cn("min-h-10 rounded-lg border px-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass", message.feedback === "helpful" ? "border-verified bg-verified/10 text-verified" : "border-border text-navy-soft hover:border-brass")}
            aria-pressed={message.feedback === "helpful"}
            onClick={() => onFeedback("helpful")}
          >
            Sí, gracias
          </button>
          <button
            type="button"
            className={cn("min-h-10 rounded-lg border px-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass", message.feedback === "not_helpful" ? "border-danger bg-danger/10 text-danger" : "border-border text-navy-soft hover:border-brass")}
            aria-pressed={message.feedback === "not_helpful"}
            onClick={() => onFeedback("not_helpful")}
          >
            No mucho
          </button>
        </div>
      </div>
      {message.feedback ? <p className="mt-2 text-right text-xs text-verified" role="status">Feedback enviado. Gracias.</p> : null}
    </article>
  );
}

export function ChatShell() {
  const [state, dispatch] = useReducer(chatReducer, initialChatState);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sessionId] = useState(() => createId());
  const abortRef = useRef<AbortController | null>(null);
  const lastQuestionRef = useRef("");

  const citations = useMemo(
    () => state.messages.flatMap((message) => message.citations ?? []),
    [state.messages],
  );
  const isBusy = state.status === "classifying" || state.status === "searching" || state.status === "verifying" || state.status === "generating";
  const statusText = statusLabel(state.status);

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
    dispatch({ type: "new_conversation" });
    setSelectedTopic(null);
    setDraft("");
    setIsSidebarOpen(false);
  }

  async function sendQuestion(question: string) {
    const content = question.trim();
    if (!content || isBusy) return;
    lastQuestionRef.current = content;
    const userMessage: ChatMessage = { id: createId(), role: "user", content };
    const requestMessages = [...state.messages, userMessage].map(({ role, content: messageContent }) => ({ role, content: messageContent }));
    setDraft("");
    dispatch({ type: "user_message", message: userMessage });

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, messages: requestMessages, locale: "es-PE" }),
        signal: controller.signal,
      });
      dispatch({ type: "status", status: "searching" });
      if (response.status === 429) {
        dispatch({ type: "error", status: "rate_limited", message: "Has alcanzado el límite temporal. Intenta nuevamente en unos minutos." });
        return;
      }
      if (!response.ok) throw new Error("provider_unavailable");
      dispatch({ type: "status", status: "verifying" });
      const result = await readChatStream(response);
      if (!result) throw new Error("invalid_stream");
      dispatch({ type: "status", status: "generating" });
      dispatch({
        type: "assistant_result",
        message: {
          id: result.answerId,
          role: "assistant",
          content: result.answer.summary,
          answer: result.answer,
          citations: result.citations,
        },
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      dispatch({
        type: "error",
        status: typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error",
        message: typeof navigator !== "undefined" && !navigator.onLine
          ? "No hay conexión. Revisa tu red e inténtalo nuevamente."
          : "No pude consultar las fuentes en este momento. No quiero darte una respuesta sin respaldo. Intenta nuevamente.",
      });
    }
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

  function openCitation(citationId: string) {
    dispatch({ type: "open_sources", citationId });
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-paper text-ink">
      <Sidebar
        isOpen={isSidebarOpen}
        selectedTopic={selectedTopic}
        onClose={() => setIsSidebarOpen(false)}
        onNewConversation={startNewConversation}
        onSelectTopic={selectTopic}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex min-h-16 items-center justify-between border-b border-border bg-paper px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-navy-soft hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass lg:hidden"
              aria-controls="main-sidebar"
              aria-expanded={isSidebarOpen}
              aria-label="Abrir menú"
              onClick={() => setIsSidebarOpen(true)}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m15 5-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <div className="lg:hidden"><BrandMark /></div>
            <div className="hidden rounded-lg border border-border-soft bg-surface px-4 py-2 text-sm font-semibold text-navy sm:flex sm:items-center sm:gap-2">
              <svg viewBox="0 0 24 24" className="size-4 text-verified" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 3.5 20 6.7v5.8c0 4.9-3.2 8.7-8 10.6-4.8-1.9-8-5.7-8-10.6V6.7l8-3.2Z" /><path d="m8.7 12.2 2.1 2.1 4.5-4.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Respuestas con respaldo legal
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button type="button" className="hidden items-center gap-2 text-sm font-semibold text-navy-soft hover:text-ink sm:flex"><span className="grid size-5 place-items-center rounded-full border border-current text-xs">?</span>¿Cómo funciona?</button>
            {citations.length > 0 ? <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-navy-soft hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass xl:hidden" onClick={() => dispatch({ type: "open_sources" })}>Fuentes <span className="rounded-full bg-brass-soft px-2 py-0.5 text-xs text-ink">{citations.length}</span></button> : null}
            <div className="hidden size-9 place-items-center rounded-full bg-navy text-sm font-semibold text-paper sm:grid">DF</div>
            <div className="hidden lg:block"><ThemeToggle /></div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-paper">
            <div className="min-h-0 flex-1 overflow-y-auto pb-52">
              <div className="mx-auto flex w-full max-w-[53rem] flex-1 flex-col px-4 py-5 sm:px-8 sm:py-8">
                <div className="flex justify-center"><span className="rounded-full border border-border-soft bg-surface px-4 py-1.5 text-xs text-navy-soft">Hoy</span></div>

                {state.messages.length === 0 ? (
                  <section className="flex flex-1 flex-col items-center justify-center py-14 text-center" aria-label="Nueva conversación">
                    <div className="grid size-14 place-items-center rounded-2xl bg-navy text-brass shadow-sm"><ScalesIcon className="size-7" /></div>
                    <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-muted">Defensor · Asistente laboral del Perú</p>
                    <h1 className="mt-4 max-w-xl font-serif text-4xl font-semibold tracking-tight text-navy sm:text-5xl">Cuéntame tu caso</h1>
                    <p className="mt-4 max-w-lg text-base leading-7 text-navy-soft sm:text-lg">Estoy aquí para orientarte sobre tus derechos laborales con información clara, prudente y verificable.</p>
                    <div className="mt-8 flex items-center gap-2 text-sm text-verified"><span className="grid size-7 place-items-center rounded-full border border-verified/30 bg-verified/10">✓</span>Las respuestas se revisan contra fuentes oficiales</div>
                  </section>
                ) : (
                  <section className="mt-5 space-y-5" aria-label="Conversación">
                    {state.messages.map((message) => message.role === "user" ? (
                      <div key={message.id} className="flex justify-end"><div className="max-w-[36rem] rounded-2xl rounded-br-md bg-brass-soft px-5 py-4 text-sm leading-6 text-ink sm:text-base">{message.content}</div></div>
                    ) : (
                      <div key={message.id} className="flex items-start gap-3"><div className="mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-navy text-brass"><ScalesIcon className="size-5" /></div><AssistantAnswer message={message} onCitation={openCitation} onFeedback={(rating) => dispatch({ type: "feedback", messageId: message.id, rating })} /></div>
                    ))}
                  </section>
                )}

                {statusText ? <div className="mt-6 ml-0 flex items-center gap-3 text-sm text-navy-soft sm:ml-12" role="status" aria-live="polite"><span className="size-2 animate-pulse rounded-full bg-brass" />{statusText}…</div> : null}
                {state.status === "rate_limited" || state.status === "offline" || state.status === "error" ? (
                  <div className="mt-6 ml-0 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm leading-6 text-danger sm:ml-12" role="alert">
                    <p>{state.errorMessage}</p>
                    {lastQuestionRef.current ? <button type="button" className="mt-2 font-semibold underline underline-offset-4" onClick={() => void sendQuestion(lastQuestionRef.current)}>Intentar nuevamente</button> : null}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 z-10 mx-auto max-w-[53rem] border-t border-border bg-paper/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:px-8 xl:border-t-0 xl:bg-paper xl:pb-3 xl:pt-6">
              <p className="mb-2 text-sm font-semibold text-navy">¿Por dónde quieres empezar?</p>
              <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Preguntas sugeridas">
                {suggestedPrompts.slice(0, 3).map((prompt) => <button type="button" key={prompt} className="min-h-11 shrink-0 rounded-lg border border-border bg-paper px-4 text-left text-sm text-navy-soft transition hover:border-brass hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass" onClick={() => setDraft(prompt)}>{prompt}</button>)}
              </div>
              <form className="mt-4" onSubmit={submitQuestion}>
                <label htmlFor="question" className="sr-only">Escribe tu consulta laboral</label>
                <div className="flex items-end gap-3 rounded-2xl border border-border bg-paper p-2 pl-4 shadow-sm focus-within:border-brass">
                  <textarea id="question" value={draft} onChange={(event) => setDraft(event.target.value)} onInput={(event) => setDraft(event.currentTarget.value)} onKeyDown={handleComposerKeyDown} rows={1} disabled={isBusy} className="min-h-11 flex-1 resize-none border-0 bg-transparent px-0 py-3 text-base text-ink placeholder:text-muted focus:border-0 focus:ring-0 disabled:cursor-wait disabled:opacity-60" placeholder="Escribe tu consulta laboral..." />
                  <button type="submit" disabled={draft.trim().length === 0 || isBusy} aria-label="Enviar consulta" className={cn("grid size-12 shrink-0 place-items-center rounded-full text-paper transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2", draft.trim().length > 0 && !isBusy ? "bg-brass hover:bg-brass/90" : "cursor-not-allowed bg-border text-muted")}><SendIcon /></button>
                </div>
              </form>
              <p className="mt-3 text-center text-xs leading-5 text-muted">No compartas DNI, dirección, teléfonos, nombres completos ni documentos confidenciales.</p>
            </div>
          </main>
          <SourcesPanel citations={citations} selectedCitationId={state.selectedCitationId} onSelectCitation={(citationId) => dispatch({ type: "open_sources", citationId })} />
        </div>
        <footer className="hidden min-h-12 items-center justify-center gap-6 border-t border-border bg-surface px-6 text-xs text-navy-soft xl:flex"><span>Fuentes oficiales del Gobierno del Perú</span><span aria-hidden="true">•</span><span>Defensor puede cometer errores</span><span aria-hidden="true">•</span><span>Beta</span></footer>
      </div>
      <SourcesPanel citations={citations} selectedCitationId={state.selectedCitationId} mobileOpen={state.sourcesOpen} onClose={() => dispatch({ type: "close_sources" })} onSelectCitation={(citationId) => dispatch({ type: "open_sources", citationId })} />
    </div>
  );
}
