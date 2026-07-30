import Image from "next/image";

interface BrandMarkProps {
  compact?: boolean;
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-2.5" aria-label="Defensor">
      <Image
        src="/images/logo.png"
        alt=""
        width={40}
        height={40}
        className="size-10 shrink-0 rounded-xl object-cover"
        aria-hidden="true"
      />
      <span className={compact ? "sr-only" : "block"}>
        <span className="block font-serif text-[1.7rem] font-medium leading-none tracking-[-0.04em] text-ink">Defensor</span>
        <span className="mt-1 block text-[0.67rem] tracking-[0.02em] text-navy-soft">Asistente laboral del Perú</span>
      </span>
    </div>
  );
}
