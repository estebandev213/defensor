"use client";

import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/cn";

const popularTopics = [
  "Despido arbitrario",
  "CTS y gratificaciones",
  "Vacaciones",
  "Horas extras",
  "Contrato de trabajo",
] as const;

interface SidebarProps {
  isOpen: boolean;
  selectedTopic: string | null;
  onClose: () => void;
  onNewConversation: () => void;
  onSelectTopic: (topic: string) => void;
}

function ConversationIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[1.15rem]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H12l-4.2 3.2v-3.2H7.5A2.5 2.5 0 0 1 5 12.5v-6Z" />
      <path d="M9 9.5h6M9 12h3" strokeLinecap="round" />
    </svg>
  );
}

export function Sidebar({
  isOpen,
  selectedTopic,
  onClose,
  onNewConversation,
  onSelectTopic,
}: SidebarProps) {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-30 bg-navy/35 transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden="true"
        onClick={onClose}
      />
      <aside
        id="main-sidebar"
        aria-label="Navegación principal"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[min(86vw,19rem)] -translate-x-full flex-col border-r border-border bg-paper px-6 py-6 transition-transform lg:sticky lg:top-0 lg:z-auto lg:flex lg:h-[100dvh] lg:max-h-[100dvh] lg:w-[18.75rem] lg:translate-x-0 lg:overflow-y-auto",
          isOpen && "translate-x-0",
        )}
      >
        <div className="flex items-start justify-between">
          <BrandMark />
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-navy-soft hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass lg:hidden"
            aria-label="Cerrar menú"
            onClick={onClose}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          className="mt-8 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brass px-4 text-sm font-semibold text-paper shadow-sm transition hover:bg-brass/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          onClick={() => {
            onNewConversation();
            onClose();
          }}
        >
          <ConversationIcon />
          Nueva conversación
          <span className="ml-auto hidden text-xs text-paper/75 sm:inline">⌘ K</span>
        </button>

        <nav className="mt-7" aria-label="Conversación">
          <button
            type="button"
            className="flex min-h-11 w-full items-center gap-3 rounded-xl bg-brass-soft px-3 text-left text-sm font-semibold text-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
            aria-current="page"
          >
            <ConversationIcon />
            Conversación actual
          </button>
        </nav>

        <div className="mt-8 border-t border-border-soft pt-6">
          <p className="px-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted">Temas populares</p>
          <nav className="mt-3 space-y-1" aria-label="Temas populares">
            {popularTopics.map((topic) => (
              <button
                type="button"
                key={topic}
                className={cn(
                  "flex min-h-10 w-full items-center justify-between rounded-lg px-3 text-left text-sm text-navy-soft transition hover:bg-background hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass",
                  selectedTopic === topic && "bg-brass-soft font-semibold text-ink",
                )}
                onClick={() => {
                  onSelectTopic(topic);
                  onClose();
                }}
                aria-pressed={selectedTopic === topic}
              >
                {topic}
                <span aria-hidden="true" className="text-muted">›</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto space-y-6 pt-8">
          <div className="rounded-xl border border-border-soft bg-surface p-4">
            <div className="flex items-start gap-3">
              <svg viewBox="0 0 24 24" className="mt-0.5 size-5 shrink-0 text-navy" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M12 3.5 20 6.7v5.8c0 4.9-3.2 8.7-8 10.6-4.8-1.9-8-5.7-8-10.6V6.7l8-3.2Z" />
                <path d="m8.8 12.2 2.1 2.1 4.4-4.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-navy">Información importante</p>
                <p className="mt-2 text-xs leading-5 text-navy-soft">Esta herramienta brinda orientación general y no reemplaza la asesoría de un abogado.</p>
                <button type="button" className="mt-3 text-xs font-semibold text-navy underline decoration-brass underline-offset-4">Leer más →</button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-full border border-border bg-paper p-1.5 pl-3">
            <div className="flex items-center gap-2 text-sm text-navy-soft">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M20.1 15.2A8.5 8.5 0 0 1 8.8 3.9 8.5 8.5 0 1 0 20.1 15.2Z" />
              </svg>
              Claro
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>
    </>
  );
}
