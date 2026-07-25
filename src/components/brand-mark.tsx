interface BrandMarkProps {
  compact?: boolean;
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-3" aria-label="Defensor">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-navy text-paper shadow-sm" aria-hidden="true">
        <svg viewBox="0 0 32 32" className="size-6" fill="none">
          <path d="M16 3.75 26 7.7v7.24c0 6.1-4.02 10.9-10 13.31-5.98-2.4-10-7.2-10-13.31V7.7l10-3.95Z" stroke="currentColor" strokeWidth="1.7" />
          <path d="m11.1 16.1 3.1 3.1 6.8-7" stroke="var(--brass)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      </span>
      <span className={compact ? "sr-only" : "block"}>
        <span className="block font-serif text-xl font-semibold leading-none tracking-tight text-ink">Defensor</span>
        <span className="mt-1 block font-mono text-[0.58rem] uppercase tracking-[0.18em] text-muted">Orientación laboral</span>
      </span>
    </div>
  );
}
