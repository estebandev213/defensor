"use client";

import type { ChatCitation } from "@/features/chat/types";
import { cn } from "@/lib/cn";

interface SourcesPanelProps {
  citations: ChatCitation[];
  selectedCitationId: string | null;
  mobileOpen?: boolean;
  showEyebrow?: boolean;
  onSelectCitation: (citationId: string) => void;
  onClose?: () => void;
}

function CitationCard({
  citation,
  selected,
  onSelect,
}: {
  citation: ChatCitation;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <article className={cn("rounded-xl border bg-paper transition", selected ? "border-brass shadow-sm" : "border-border-soft")}>
      <button
        type="button"
        className="flex min-h-16 w-full items-start gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-inset"
        aria-expanded={selected}
        onClick={onSelect}
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brass text-sm font-semibold text-paper">{citation.index}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink">{citation.normTitle}</span>
          <span className="mt-1 block text-xs text-navy-soft">
            {citation.normNumber ? `${citation.normNumber} · ` : ""}{citation.articleLabel ?? citation.citationLabel}
          </span>
        </span>
        <span aria-hidden="true" className={cn("text-lg text-navy-soft transition-transform", selected && "rotate-180")}>⌄</span>
      </button>

      {selected ? (
        <div className="border-t border-border-soft px-4 pb-4 pt-3">
          <p className="text-sm leading-6 text-navy-soft">{citation.excerpt}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-brass-soft px-2.5 py-1 font-semibold text-ink">{citation.status}</span>
            <span className="text-muted">{citation.officialPublisher}</span>
          </div>
          <a
            className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-brass underline decoration-brass/40 underline-offset-4 hover:text-ink"
            href={citation.officialUrl}
            target="_blank"
            rel="noreferrer"
          >
            Abrir fuente oficial <span aria-hidden="true" className="ml-1">↗</span>
          </a>
        </div>
      ) : null}
    </article>
  );
}

export function SourcesPanel({
  citations,
  selectedCitationId,
  mobileOpen = false,
  showEyebrow = true,
  onSelectCitation,
  onClose,
}: SourcesPanelProps) {
  if (citations.length === 0) return null;

  const content = (
    <div className="flex h-full min-h-0 flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          {showEyebrow ? <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted">Respaldo legal</p> : null}
          <h2 className="mt-1 font-serif text-xl font-semibold text-ink">Fuentes citadas</h2>
          <p className="mt-1 text-sm text-navy-soft">{citations.length} {citations.length === 1 ? "fuente usada" : "fuentes usadas"}</p>
        </div>
        {mobileOpen ? (
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-navy-soft hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
            aria-label="Cerrar fuentes citadas"
            onClick={onClose}
          >
            <span aria-hidden="true" className="text-2xl leading-none">×</span>
          </button>
        ) : null}
      </div>

      <div className="mt-5 min-h-0 space-y-3 overflow-y-auto">
        {citations.map((citation) => (
          <CitationCard
            key={citation.id}
            citation={citation}
            selected={selectedCitationId === citation.id}
            onSelect={() => onSelectCitation(citation.id)}
          />
        ))}
      </div>
    </div>
  );

  if (mobileOpen) {
    return (
      <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label="Fuentes citadas">
        <button type="button" className="absolute inset-0 bg-navy/40" aria-label="Cerrar fuentes citadas" onClick={onClose} />
        <aside className="absolute inset-x-0 bottom-0 max-h-[86dvh] rounded-t-3xl border-t border-border bg-paper shadow-2xl">
          {content}
        </aside>
      </div>
    );
  }

  return <aside className="hidden min-h-0 w-[24rem] shrink-0 border-l border-border bg-paper xl:block">{content}</aside>;
}
