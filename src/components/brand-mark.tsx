interface BrandMarkProps {
  compact?: boolean;
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-2.5" aria-label="Defensor">
      <span className="grid size-10 shrink-0 place-items-center text-brass" aria-hidden="true">
        <svg viewBox="0 0 32 32" className="size-9" fill="none">
          <path d="M16 4v24M7 7h18M16 7 9.5 17M16 7l6.5 10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
          <path d="M4.5 17c0 2.3 1.9 4.2 4.2 4.2s4.2-1.9 4.2-4.2H4.5ZM19.1 17c0 2.3 1.9 4.2 4.2 4.2s4.2-1.9 4.2-4.2h-8.4Z" fill="currentColor" />
          <path d="M12.8 26h6.4M14.2 28h3.6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        </svg>
      </span>
      <span className={compact ? "sr-only" : "block"}>
        <span className="block font-serif text-[1.7rem] font-medium leading-none tracking-[-0.04em] text-ink">Defensor</span>
        <span className="mt-1 block text-[0.67rem] tracking-[0.02em] text-navy-soft">Asistente laboral del Perú</span>
      </span>
    </div>
  );
}
