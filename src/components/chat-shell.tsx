"use client";

import { useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { Sidebar } from "@/components/sidebar";
import { SourcesPanel } from "@/components/sources-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/cn";

const suggestedPrompts = [
  "¿Qué debo revisar si me despidieron?",
  "¿Cómo funciona la CTS?",
  "¿Cuántos días de vacaciones me corresponden?",
];

export function ChatShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  function selectTopic(topic: string) {
    setSelectedTopic(topic);
    setDraft(`Quiero entender mis derechos sobre ${topic.toLowerCase()}.`);
    setNotice(null);
  }

  function startNewConversation() {
    setSelectedTopic(null);
    setDraft("");
    setNotice(null);
  }

  function prepareQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("El chat se conectará a fuentes oficiales en una siguiente fase.");
  }

  return (
    <div className="flex min-h-screen bg-background text-ink">
      <Sidebar
        isOpen={isSidebarOpen}
        selectedTopic={selectedTopic}
        onClose={() => setIsSidebarOpen(false)}
        onNewConversation={startNewConversation}
        onSelectTopic={selectTopic}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-[4.5rem] items-center justify-between border-b border-border bg-paper/80 px-4 backdrop-blur sm:px-8">
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
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            </button>
            <div className="lg:hidden"><BrandMark compact /></div>
            <div className="hidden items-center gap-2 text-sm text-navy-soft sm:flex">
              <span className="size-2 rounded-full bg-verified" aria-hidden="true" />
              Respaldado por fuentes oficiales cuando estén disponibles
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-border-soft px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-muted md:inline-flex">Foundation</span>
            <div className="lg:hidden"><ThemeToggle /></div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <main className="flex min-w-0 flex-1 flex-col">
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-8 sm:py-12">
              <div className="mb-10">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-brass">Consulta anónima</p>
                <h1 className="mt-3 max-w-2xl font-serif text-4xl font-medium leading-[1.08] tracking-tight text-ink sm:text-5xl">
                  Entiende tu situación laboral con claridad.
                </h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-navy-soft sm:text-lg">
                  Este espacio está preparado para responder con respaldo legal verificable. La conexión a las fuentes se habilitará en la siguiente fase.
                </p>
              </div>

              <section aria-labelledby="empty-chat-title" className="rounded-2xl border border-border bg-paper p-5 shadow-paper sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-navy text-paper" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H12l-4.2 3.2v-3.2H7.5A2.5 2.5 0 0 1 5 12.5v-6Z" />
                      <path d="M9 9.5h6M9 12h3" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <h2 id="empty-chat-title" className="text-base font-semibold text-ink">Tu conversación comienza aquí</h2>
                    <p className="mt-1 text-sm leading-6 text-navy-soft">Elige un tema o escribe una situación para preparar tu consulta.</p>
                  </div>
                </div>

                <div className="mt-7 flex gap-2 overflow-x-auto pb-1" aria-label="Preguntas sugeridas">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      type="button"
                      key={prompt}
                      className="min-h-11 shrink-0 rounded-full border border-border px-4 text-left text-sm text-navy-soft transition hover:border-brass hover:bg-brass-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                      onClick={() => {
                        setDraft(prompt);
                        setNotice(null);
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                <form className="mt-7" onSubmit={prepareQuestion}>
                  <label htmlFor="question" className="sr-only">Describe tu situación laboral</label>
                  <textarea
                    id="question"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    rows={4}
                    className="block w-full resize-none rounded-xl border-border bg-surface px-4 py-3 text-base text-ink placeholder:text-muted focus:border-brass focus:ring-brass"
                    placeholder="Ejemplo: llevo dos años trabajando y quiero saber qué revisar si termina mi relación laboral..."
                  />
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-5 text-muted">No compartas datos personales ni documentos confidenciales.</p>
                    <button
                      type="submit"
                      disabled={draft.trim().length === 0}
                      className={cn(
                        "min-h-11 rounded-xl px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
                        draft.trim().length > 0 ? "bg-navy text-paper hover:bg-navy/90" : "cursor-not-allowed bg-border-soft text-muted",
                      )}
                    >
                      Preparar consulta
                    </button>
                  </div>
                </form>
                {notice ? <p role="status" className="mt-4 rounded-lg bg-brass-soft px-3 py-2 text-sm text-ink">{notice}</p> : null}
              </section>

              <p className="mt-auto pt-8 text-center text-xs leading-5 text-muted">
                Defensor ofrece orientación informativa y no reemplaza la asesoría de un profesional. Verifica siempre los detalles de tu caso.
              </p>
            </div>
          </main>
          <SourcesPanel />
        </div>
      </div>
    </div>
  );
}
