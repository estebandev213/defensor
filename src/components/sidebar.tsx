"use client";

import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/cn";

const popularTopics = [
  "Despido",
  "CTS y gratificaciones",
  "Vacaciones",
  "Horas extras",
  "Contratos",
] as const;

interface SidebarProps {
  isOpen: boolean;
  selectedTopic: string | null;
  onClose: () => void;
  onNewConversation: () => void;
  onSelectTopic: (topic: string) => void;
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
          "fixed inset-y-0 left-0 z-40 flex w-[min(86vw,19rem)] -translate-x-full flex-col border-r border-border bg-surface px-5 py-6 transition-transform lg:static lg:z-auto lg:flex lg:w-[18rem] lg:translate-x-0 lg:px-6",
          isOpen && "translate-x-0",
        )}
      >
        <div className="flex items-center justify-between">
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
          className="mt-10 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 text-sm font-semibold text-paper shadow-sm transition hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          onClick={() => {
            onNewConversation();
            onClose();
          }}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Nueva conversación
        </button>

        <div className="mt-10">
          <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted">Temas populares</p>
          <nav className="mt-3 space-y-1" aria-label="Temas populares">
            {popularTopics.map((topic) => (
              <button
                type="button"
                key={topic}
                className={cn(
                  "flex min-h-11 w-full items-center justify-between rounded-lg px-3 text-left text-sm text-navy-soft transition hover:bg-background hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass",
                  selectedTopic === topic && "bg-brass-soft font-semibold text-ink",
                )}
                onClick={() => {
                  onSelectTopic(topic);
                  onClose();
                }}
                aria-pressed={selectedTopic === topic}
              >
                {topic}
                <span aria-hidden="true" className="text-muted">→</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto space-y-5 pt-8">
          <div className="rounded-xl border border-border-soft bg-paper p-4">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-muted">Antes de consultar</p>
            <p className="mt-2 text-xs leading-5 text-navy-soft">
              No compartas DNI, dirección, teléfonos, nombres completos ni documentos confidenciales.
            </p>
          </div>
          <div className="flex items-center justify-between border-t border-border-soft pt-5">
            <div>
              <p className="text-sm font-medium text-ink">Apariencia</p>
              <p className="text-xs text-muted">Claro u oscuro</p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>
    </>
  );
}
