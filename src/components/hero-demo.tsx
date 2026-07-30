"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { EmphasizedText } from "@/components/emphasized-text";
import { cn } from "@/lib/cn";

const QUESTION = "¿Pueden despedirme sin causa después de que me reincorporé por licencia médica?";
const MAX_QUESTION_LENGTH = 5000;

const UNDERSTANDING =
  "Entiendo que quieres saber si tu reincorporación tras una licencia médica te protege frente a un despido sin causa justificada.";

const CORPUS_SIZE = 1842;

const CITATIONS = [
  {
    index: 1,
    normTitle: "Ley de Productividad y Competitividad Laboral",
    articleLabel: "Art. 25",
    excerpt: "Define las causas justas relacionadas con la capacidad y la conducta del trabajador.",
  },
  {
    index: 2,
    normTitle: "Reglamento de la Ley de Fomento del Empleo",
    articleLabel: "Art. 17",
    excerpt: "Precisa el procedimiento y los plazos para acreditar la causa de un despido.",
  },
  {
    index: 3,
    normTitle: "Constitución Política del Perú",
    articleLabel: "Art. 15",
    excerpt: "Reconoce el derecho del trabajador a la protección adecuada contra el despido arbitrario.",
  },
] as const;

const REASONING_STEPS = [
  { label: "Analizando tu consulta" },
  { label: "Buscando en el corpus legal" },
  { label: "Verificando vigencia y relevancia" },
  { label: "Redactando la orientación" },
] as const;

const ANSWER_PARAGRAPHS = [
  {
    text: "En general, la reincorporación luego de una licencia médica **no constituye por sí sola una causa válida de despido**.",
    citationIndexes: [1, 2],
  },
  {
    text: "La respuesta depende de los hechos y de la evidencia disponible, como la fecha del cese y el motivo indicado por tu empleador.",
    citationIndexes: [3],
  },
] as const;

// Typed characters per millisecond while the fake composer "writes" the question.
const MS_PER_CHAR = 34;
const TICK_MS = 50;

// How long each reasoning step stays active before the next one starts. The
// retrieval step (index 1) gets the longest budget: it's the one rendering
// the corpus scan + citation hits, which is the whole point of this demo.
const STEP_DURATIONS = [650, 2000, 750, 700];
const RETRIEVAL_SCAN_MS = 750;
const RETRIEVAL_HIT_GAP_MS = 320;

const T_TYPE_END = QUESTION.length * MS_PER_CHAR;
const T_SENT = T_TYPE_END + 550;
const T_REASONING_START = T_SENT + 400;
const T_UNDERSTANDING = T_REASONING_START + 150;

const T_STEP: number[] = [T_UNDERSTANDING + 450];
for (const duration of STEP_DURATIONS) {
  T_STEP.push((T_STEP[T_STEP.length - 1] ?? 0) + duration);
}
const T_RETRIEVAL_START = T_STEP[1] ?? 0;

const T_COLLAPSE = (T_STEP[4] ?? 0) + 450;
const T_PARA1 = T_COLLAPSE + 350;
const T_PARA2 = T_PARA1 + 480;
const T_SOURCES = T_PARA2 + 450;
const T_END = T_SOURCES + 600;

function StepIcon({ done }: { done: boolean }) {
  if (done) {
    return (
      <svg viewBox="0 0 24 24" className="size-4 text-verified" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
        <path d="m5 12.5 4.2 4.2L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <span aria-hidden="true" className="reasoning-active grid size-4 place-items-center">
      <span className="size-2 rounded-full bg-brass" />
    </span>
  );
}

export function HeroDemo() {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const interval = globalThis.setInterval(() => {
      setElapsed((current) => {
        if (current >= T_END) {
          globalThis.clearInterval(interval);
          return current;
        }
        return current + TICK_MS;
      });
    }, TICK_MS);
    return () => globalThis.clearInterval(interval);
  }, []);

  const typedLength = Math.min(QUESTION.length, Math.floor(elapsed / MS_PER_CHAR));
  const isTyping = elapsed < T_SENT;
  const isComposerFull = typedLength >= QUESTION.length;
  const showUserBubble = elapsed >= T_SENT;
  const showAssistant = elapsed >= T_REASONING_START;
  const reasoningLive = elapsed < T_COLLAPSE;
  const showUnderstanding = elapsed >= T_UNDERSTANDING;
  const paragraphsShown = elapsed >= T_PARA2 ? 2 : elapsed >= T_PARA1 ? 1 : 0;
  const showSources = elapsed >= T_SOURCES;
  const animationDone = elapsed >= T_END;

  const retrievalElapsed = elapsed - T_RETRIEVAL_START;
  const scanProgress = Math.max(0, Math.min(1, retrievalElapsed / RETRIEVAL_SCAN_MS));
  const scannedCount = Math.floor(scanProgress * CORPUS_SIZE);
  const hitsShown = retrievalElapsed < RETRIEVAL_SCAN_MS
    ? 0
    : Math.min(CITATIONS.length, Math.floor((retrievalElapsed - RETRIEVAL_SCAN_MS) / RETRIEVAL_HIT_GAP_MS) + 1);

  function submitQuery() {
    const trimmed = query.trim();
    if (!animationDone || trimmed.length === 0) return;
    router.push(`/chat?q=${encodeURIComponent(trimmed)}`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitQuery();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitQuery();
    }
  }

  return (
    <div className="relative rounded-[2rem] border border-border bg-paper/95 p-5 shadow-paper backdrop-blur sm:p-8">
      <div className="min-h-[27rem] space-y-5 py-2 sm:min-h-[29rem]">
        {showUserBubble ? (
          <div className="reveal-block flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brass-soft px-5 py-4 text-sm leading-6 text-ink sm:max-w-[80%] sm:text-base">
              {QUESTION}
            </div>
          </div>
        ) : null}

        {showAssistant ? (
          <div className="flex items-start gap-3">
            <Image
              src="/images/logo.png"
              alt=""
              width={36}
              height={36}
              className="mt-1 size-9 shrink-0 rounded-full object-cover"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1 rounded-2xl border border-border-soft bg-paper p-5 shadow-[0_8px_30px_rgba(22,37,62,0.04)] sm:p-6">
              {reasoningLive ? (
                <div className="rounded-2xl border border-border-soft bg-surface px-4 py-3.5 text-sm" role="status" aria-live="polite">
                  {showUnderstanding ? (
                    <p className="reveal-block mb-3 border-b border-border-soft pb-3 leading-6 text-ink">{UNDERSTANDING}</p>
                  ) : null}
                  <ol className="space-y-2">
                    {REASONING_STEPS.map((step, index) => {
                      const visible = elapsed >= (T_STEP[index] ?? Number.POSITIVE_INFINITY);
                      if (!visible) return null;
                      const done = elapsed >= (T_STEP[index + 1] ?? Number.POSITIVE_INFINITY);
                      const isRetrievalStep = index === 1;
                      return (
                        <li key={step.label} className="reveal-block flex flex-col gap-1.5">
                          <div className="flex items-start gap-2.5">
                            <span className="mt-0.5 shrink-0"><StepIcon done={done} /></span>
                            <span className={cn("min-w-0 leading-6", done ? "text-navy-soft" : "text-ink")}>
                              {step.label}
                              {isRetrievalStep && done ? (
                                <span className="text-muted"> · {CITATIONS.length} normas encontradas</span>
                              ) : null}
                            </span>
                          </div>
                          {isRetrievalStep && !done ? (
                            <div className="ml-[1.65rem] space-y-2">
                              <p className="font-mono text-[0.68rem] text-muted">
                                {scannedCount.toLocaleString("es-PE")} / {CORPUS_SIZE.toLocaleString("es-PE")} normas analizadas…
                              </p>
                              <div className="space-y-2">
                                {CITATIONS.slice(0, hitsShown).map((citation) => (
                                  <div key={citation.normTitle} className="reveal-block flex items-start gap-2 text-xs">
                                    <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded bg-brass text-[0.6rem] font-semibold text-paper">
                                      {citation.index}
                                    </span>
                                    <span className="min-w-0">
                                      <span className="block text-navy-soft">
                                        {citation.normTitle} <span className="text-muted">· {citation.articleLabel}</span>
                                      </span>
                                      <span className="block text-muted">{citation.excerpt}</span>
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ) : null}

              <div className={cn("space-y-4 text-base leading-7 text-ink", reasoningLive ? "sr-only" : "mt-4")} aria-hidden={reasoningLive}>
                {ANSWER_PARAGRAPHS.slice(0, paragraphsShown).map((paragraph, index) => (
                  <p key={paragraph.text} className="reveal-block" style={{ animationDelay: `${index * 90}ms` }}>
                    <EmphasizedText text={paragraph.text} />
                    {paragraph.citationIndexes.map((citationIndex) => (
                      <sup key={citationIndex} className="ml-0.5 font-sans text-[0.7em] font-semibold text-brass">[{citationIndex}]</sup>
                    ))}
                  </p>
                ))}
              </div>

              {showSources ? (
                <div className="reveal-block mt-5 border-t border-border-soft pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Fuentes verificadas</p>
                  <ul className="mt-2 space-y-1.5">
                    {CITATIONS.map((citation, index) => (
                      <li key={citation.normTitle} className="reveal-block flex items-center gap-2 text-sm" style={{ animationDelay: `${index * 90}ms` }}>
                        <span className="grid size-5 shrink-0 place-items-center rounded bg-brass text-[0.65rem] font-semibold text-paper">
                          {citation.index}
                        </span>
                        <span className="min-w-0 text-navy-soft">
                          {citation.normTitle} <span className="text-muted">· {citation.articleLabel}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex min-h-16 items-center gap-3 rounded-[1.35rem] border border-border-soft bg-paper p-2 shadow-[0_10px_28px_rgba(18,36,65,0.07)]"
      >
        {animationDone ? (
          <textarea
            rows={1}
            maxLength={MAX_QUESTION_LENGTH}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Haz tu consulta aquí..."
            aria-label="Haz tu consulta aquí"
            className="min-h-11 flex-1 resize-none border-0 bg-transparent px-3 py-2 text-left text-base leading-6 text-ink placeholder:text-left placeholder:text-muted focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none"
          />
        ) : (
          <div className="min-h-11 flex-1 px-3 py-2 text-left text-base leading-6 text-ink">
            {isTyping ? (
              <>
                {QUESTION.slice(0, typedLength)}
                <span className="typing-caret ml-[0.06em] inline-block h-[0.9em] w-[0.07em] translate-y-[0.15em] bg-brass" aria-hidden="true" />
              </>
            ) : (
              <span className="text-muted">Describe tu situación laboral...</span>
            )}
          </div>
        )}

        {animationDone ? (
          <button
            type="submit"
            disabled={query.trim().length === 0}
            aria-label="Enviar consulta"
            className={cn(
              "grid size-12 shrink-0 place-items-center rounded-full text-paper transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2",
              query.trim().length > 0 ? "bg-navy hover:bg-navy/90" : "cursor-not-allowed bg-border text-muted",
            )}
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="m21 3-7.5 18-3.2-7.3L3 10.5 21 3Z" strokeLinejoin="round" />
              <path d="m10.3 13.7 4.6-4.6" strokeLinecap="round" />
            </svg>
          </button>
        ) : (
          <span
            aria-hidden="true"
            className={cn(
              "grid size-12 shrink-0 place-items-center rounded-full text-paper transition",
              isTyping && isComposerFull ? "bg-navy" : "cursor-not-allowed bg-border text-muted",
            )}
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="m21 3-7.5 18-3.2-7.3L3 10.5 21 3Z" strokeLinejoin="round" />
              <path d="m10.3 13.7 4.6-4.6" strokeLinecap="round" />
            </svg>
          </span>
        )}
      </form>
    </div>
  );
}
