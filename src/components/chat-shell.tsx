"use client";

import { useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { Sidebar } from "@/components/sidebar";
import { SourcesPanel } from "@/components/sources-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/cn";

const suggestedPrompts = [
  "Me despidieron",
  "No me pagaron horas extra",
  "¿Me corresponde CTS?",
  "Vacaciones truncas",
];

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

export function ChatShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  function selectTopic(topic: string) {
    setSelectedTopic(topic);
    setDraft(`Quiero entender mi situación sobre ${topic.toLowerCase()}.`);
    setNotice(null);
  }

  function startNewConversation() {
    setSelectedTopic(null);
    setDraft("");
    setNotice(null);
  }

  function prepareQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("Esta versión prepara tu consulta. La conexión con fuentes oficiales llegará en la siguiente fase.");
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
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="m15 5-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="lg:hidden"><BrandMark /></div>
            <div className="hidden rounded-lg border border-border-soft bg-surface px-4 py-2 text-sm font-semibold text-navy sm:flex sm:items-center sm:gap-2">
              <svg viewBox="0 0 24 24" className="size-4 text-verified" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M12 3.5 20 6.7v5.8c0 4.9-3.2 8.7-8 10.6-4.8-1.9-8-5.7-8-10.6V6.7l8-3.2Z" />
                <path d="m8.7 12.2 2.1 2.1 4.5-4.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Respuestas con respaldo legal
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button type="button" className="hidden items-center gap-2 text-sm font-semibold text-navy-soft hover:text-ink sm:flex">
              <span className="grid size-5 place-items-center rounded-full border border-current text-xs">?</span>
              ¿Cómo funciona?
            </button>
            <button type="button" aria-label="Más opciones" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-navy-soft hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass">
              <span aria-hidden="true" className="text-xl leading-none">⋮</span>
            </button>
            <div className="hidden size-9 place-items-center rounded-full bg-navy text-sm font-semibold text-paper sm:grid">DF</div>
            <div className="hidden lg:block"><ThemeToggle /></div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-paper">
            <div className="min-h-0 flex-1 overflow-y-auto pb-44">
            <div className="mx-auto flex w-full max-w-[53rem] flex-1 flex-col px-4 py-5 sm:px-8 sm:py-8">
              <div className="flex justify-center">
                <span className="rounded-full border border-border-soft bg-surface px-4 py-1.5 text-xs text-navy-soft">Hoy</span>
              </div>

              <section className="mt-5" aria-label="Vista previa de la conversación">
                <div className="flex justify-end">
                  <div className="max-w-[33rem] rounded-2xl rounded-br-md bg-brass-soft px-5 py-4 text-sm leading-6 text-ink shadow-sm sm:text-base">
                    Quiero entender qué información debo reunir para consultar mi situación laboral.
                    <div className="mt-2 flex items-center justify-end gap-2 text-xs text-navy-soft">
                      Vista de ejemplo <span aria-hidden="true">✓✓</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-start gap-3">
                  <div className="mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-navy text-brass">
                    <ScalesIcon className="size-5" />
                  </div>
                  <article className="min-w-0 flex-1 rounded-2xl border border-border-soft bg-paper p-5 shadow-[0_8px_30px_rgba(22,37,62,0.04)] sm:p-7">
                    <p className="text-base leading-7 text-ink sm:text-lg">Aquí podrás recibir una orientación clara, organizada y fácil de revisar.</p>

                    <div className="mt-6 border-t border-border-soft pt-5">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 text-brass"><svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h3" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                        <div>
                          <h2 className="font-semibold text-ink">En resumen</h2>
                          <p className="mt-1 text-sm leading-6 text-navy-soft">La respuesta separará lo que indica la norma, lo que depende de tus hechos y qué conviene verificar.</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-border-soft pt-5">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 text-brass"><svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="8" r="3.2" /><path d="M5.5 20c.5-3.4 2.7-5.3 6.5-5.3s6 1.9 6.5 5.3" strokeLinecap="round" /></svg></span>
                        <div>
                          <h2 className="font-semibold text-ink">Qué podrás revisar</h2>
                          <ul className="mt-1 space-y-1 text-sm leading-6 text-navy-soft">
                            <li>• Los datos que faltan para interpretar tu caso.</li>
                            <li>• Los próximos pasos prudentes.</li>
                            <li>• Las fuentes oficiales que respaldan la orientación.</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-border-soft pt-5">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 text-brass"><ScalesIcon /></span>
                        <div>
                          <h2 className="font-semibold text-ink">Base legal</h2>
                          <p className="mt-1 text-sm leading-6 text-navy-soft">Las citas verificables aparecerán aquí cuando exista evidencia recuperada del corpus oficial.</p>
                          <span className="mt-3 inline-flex rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted">Sin fuentes conectadas todavía</span>
                        </div>
                      </div>
                    </div>
                  </article>
                </div>

                <div className="mt-4 ml-12 flex items-center justify-between rounded-xl border border-border-soft bg-surface px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-7 place-items-center rounded-full bg-verified text-paper"><svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 12 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                    <div><p className="text-sm font-semibold text-verified">Fuentes verificables</p><p className="text-xs text-navy-soft">Se mostrarán junto a cada respuesta</p></div>
                  </div>
                  <span aria-hidden="true" className="text-lg text-verified">›</span>
                </div>
              </section>

              <div className="mt-5 xl:hidden">
                <SourcesPanel mobile />
              </div>

              <div className="mt-5 rounded-xl border border-border-soft bg-surface p-4 sm:ml-12">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <svg viewBox="0 0 24 24" className="size-5 text-navy" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M6 3.5h9l3 3V20H6z" /><path d="M15 3.5V7h3M9 11h6M9 14h6" strokeLinecap="round" /></svg>
                    <div><p className="font-semibold text-ink">Ver artículos citados</p><p className="text-sm text-navy-soft">Se mostrarán cuando haya fuentes</p></div>
                  </div>
                  <span className="text-xl text-navy-soft" aria-hidden="true">⌄</span>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 z-10 mx-auto max-w-[53rem] border-t border-border bg-paper/95 px-4 pb-3 pt-3 backdrop-blur sm:px-8 xl:border-t-0 xl:bg-paper xl:pb-0 xl:pt-6">
                <p className="mb-2 text-sm font-semibold text-navy">¿Te gustaría empezar por algo?</p>
                <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Preguntas sugeridas">
                  {suggestedPrompts.slice(0, 3).map((prompt) => (
                    <button
                      type="button"
                      key={prompt}
                      className="min-h-11 shrink-0 rounded-lg border border-border bg-paper px-4 text-left text-sm text-navy-soft transition hover:border-brass hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                      onClick={() => {
                        setDraft(prompt);
                        setNotice(null);
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                <form className="mt-4" onSubmit={prepareQuestion}>
                  <label htmlFor="question" className="sr-only">Escribe tu consulta laboral</label>
                  <div className="flex items-end gap-3 rounded-2xl border border-border bg-paper p-2 pl-4 shadow-sm focus-within:border-brass">
                    <textarea
                      id="question"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      rows={1}
                      className="min-h-11 flex-1 resize-none border-0 bg-transparent px-0 py-3 text-base text-ink placeholder:text-muted focus:border-0 focus:ring-0"
                      placeholder="Escribe tu consulta laboral..."
                    />
                    <button
                      type="submit"
                      disabled={draft.trim().length === 0}
                      aria-label="Enviar consulta"
                      className={cn(
                        "grid size-12 shrink-0 place-items-center rounded-full text-paper transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2",
                        draft.trim().length > 0 ? "bg-brass hover:bg-brass/90" : "cursor-not-allowed bg-border text-muted",
                      )}
                    >
                      <SendIcon />
                    </button>
                  </div>
                </form>
                {notice ? <p role="status" className="mt-3 rounded-lg bg-brass-soft px-3 py-2 text-sm text-ink">{notice}</p> : null}
                <p className="mt-3 text-center text-xs leading-5 text-muted">Defensor puede cometer errores. Verifica siempre la información con las fuentes citadas.</p>
              </div>
            </div>
            </div>
          </main>
          <SourcesPanel />
        </div>
        <footer className="hidden min-h-12 items-center justify-center gap-6 border-t border-border bg-surface px-6 text-xs text-navy-soft xl:flex">
          <span>Actualizado para la versión Foundation</span><span aria-hidden="true">•</span><span>Fuentes oficiales del Gobierno del Perú</span><span aria-hidden="true">•</span><span>Beta</span>
        </footer>
      </div>
    </div>
  );
}
