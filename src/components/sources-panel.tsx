interface SourcesPanelProps {
  mobile?: boolean;
}

export function SourcesPanel({ mobile = false }: SourcesPanelProps) {
  return (
    <aside
      aria-labelledby={mobile ? "mobile-sources-title" : "sources-title"}
      className={mobile ? "rounded-2xl border border-border bg-paper" : "hidden border-l border-border bg-paper xl:block xl:w-[24rem]"}
    >
      <div className={mobile ? "p-4" : "sticky top-0 p-6"}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted">Respaldo legal</p>
            <h2 id={mobile ? "mobile-sources-title" : "sources-title"} className="mt-1 font-serif text-xl font-semibold text-ink">Fuentes citadas</h2>
          </div>
          <span className="rounded-full bg-background px-2.5 py-1 text-xs font-semibold text-navy-soft">0</span>
        </div>
        <div className="mt-6 rounded-xl border border-dashed border-border bg-surface p-5">
          <div className="flex items-start gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-brass-soft text-brass" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M5 4.5h10a2 2 0 0 1 2 2V20l-4-2-4 2-4-2V6.5a2 2 0 0 1 2-2Z" />
                <path d="M8 9h6m-6 3h6" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">Aquí aparecerá la evidencia</h3>
              <p className="mt-2 text-sm leading-6 text-navy-soft">Las normas y artículos verificables se mostrarán cuando el corpus oficial esté conectado.</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
