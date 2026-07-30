"use client";

import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import type { ChatConversation } from "@/features/chat/types";
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
  isCollapsed: boolean;
  conversations: ChatConversation[];
  activeConversationId: string;
  selectedTopic: string | null;
  onClose: () => void;
  onToggleCollapse: () => void;
  onNewConversation: () => void;
  onSelectConversation: (conversationId: string) => void;
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

function SidebarToggleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M9 5v14M13 9h4M13 12h4M13 15h3" strokeLinecap="round" />
    </svg>
  );
}

export function Sidebar({
  isOpen,
  isCollapsed,
  conversations,
  activeConversationId,
  selectedTopic,
  onClose,
  onToggleCollapse,
  onNewConversation,
  onSelectConversation,
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
      {/* Lives outside the aside: while collapsed the aside is clipped to zero
          width, so a control inside it would be unreachable. */}
      <button
        type="button"
        className={cn(
          "fixed left-3 top-3 z-50 hidden min-h-11 min-w-11 items-center justify-center rounded-xl bg-paper text-navy-soft shadow-sm ring-1 ring-border hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass",
          isCollapsed && "lg:inline-flex",
        )}
        aria-controls="main-sidebar"
        aria-expanded={false}
        aria-label="Mostrar barra lateral"
        onClick={onToggleCollapse}
      >
        <SidebarToggleIcon />
      </button>
      <aside
        id="main-sidebar"
        aria-label="Navegación principal"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[min(86vw,19rem)] -translate-x-full flex-col border-r border-border bg-paper px-6 py-6 transition-[width,transform,padding] lg:sticky lg:top-0 lg:z-auto lg:flex lg:h-[100dvh] lg:max-h-[100dvh] lg:min-w-0 lg:flex-none lg:translate-x-0 lg:overflow-y-auto",
          isOpen && "translate-x-0",
          // Mutually exclusive: `cn` only concatenates, so a `lg:w-0` layered on
          // top of `lg:w-[18.75rem]` would be resolved by stylesheet order
          // rather than by the order written here — and the arbitrary value wins.
          isCollapsed
            ? "lg:w-0 lg:overflow-hidden lg:border-r-0 lg:px-0"
            : "lg:w-[18.75rem]",
        )}
      >
        <div className={cn("flex items-start justify-between gap-2", isCollapsed && "lg:hidden")}>
          <BrandMark />
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="hidden min-h-11 min-w-11 items-center justify-center rounded-xl text-navy-soft hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass lg:inline-flex"
              aria-controls="main-sidebar"
              aria-expanded
              aria-label="Ocultar barra lateral"
              onClick={onToggleCollapse}
            >
              <SidebarToggleIcon />
            </button>
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
        </div>

        <div className={cn("flex min-h-0 flex-1 flex-col", isCollapsed && "lg:hidden")}>
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
        </button>

        <nav className="mt-7" aria-label="Conversaciones de esta sesión">
          <p className="px-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted">Conversaciones de esta sesión</p>
          <div className="mt-3 space-y-1">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;
              return (
                <button
                  type="button"
                  key={conversation.id}
                  className={cn(
                    "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-navy-soft transition hover:bg-background hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass",
                    isActive && "bg-brass-soft font-semibold text-brass",
                  )}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={`Abrir conversación: ${conversation.title}`}
                  onClick={() => {
                    onSelectConversation(conversation.id);
                    onClose();
                  }}
                >
                  <ConversationIcon />
                  <span className="min-w-0 flex-1 truncate">{conversation.title}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="mt-auto flex flex-col gap-6 pt-8">
          <div className="order-2 rounded-xl border border-border-soft bg-surface p-4">
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

          <div className="order-1">
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

          <div className="order-3 space-y-2">
            <Link
              href="/como-funciona"
              className="flex min-h-11 w-full items-center justify-center rounded-xl border border-border bg-paper px-3 text-center text-sm font-semibold text-navy-soft transition hover:bg-background hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
            >
              ¿Cómo funciona?
            </Link>
            <ThemeToggle showLabel className="w-full" />
          </div>
        </div>
        </div>
      </aside>
    </>
  );
}
