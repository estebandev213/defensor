export function SourcesPanel() {
  return (
    <aside aria-labelledby="sources-title" className="hidden border-l border-border bg-surface xl:block xl:w-[19rem]">
      <div className="sticky top-0 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-muted">Evidencia</p>
            <h2 id="sources-title" className="mt-1 font-serif text-xl font-semibold text-ink">Fuentes citadas</h2>
          </div>
          <span className="rounded-full border border-border px-2 py-1 font-mono text-[0.6rem] text-muted">0</span>
        </div>
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-paper p-5">
          <div className="grid size-10 place-items-center rounded-xl bg-brass-soft text-brass" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M5 4.5h10a2 2 0 0 1 2 2V20l-4-2-4 2-4-2V6.5a2 2 0 0 1 2-2Z" />
              <path d="M8 9h6m-6 3h6" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="mt-4 text-sm font-semibold text-ink">El respaldo aparecerá aquí</h3>
          <p className="mt-2 text-sm leading-6 text-navy-soft">
            Cuando conectemos las fuentes oficiales, cada respuesta mostrará sus normas y artículos verificables.
          </p>
        </div>
      </div>
    </aside>
  );
}
