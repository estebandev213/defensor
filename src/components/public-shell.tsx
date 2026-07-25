import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";

export function PublicHeader() {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
      <Link href="/" aria-label="Defensor, inicio"><BrandMark /></Link>
      <nav className="hidden items-center gap-6 text-sm font-semibold text-navy-soft lg:flex" aria-label="Navegación pública">
        <Link href="/como-funciona" className="transition hover:text-ink">Cómo funciona</Link>
        <Link href="/metodologia" className="transition hover:text-ink">Metodología</Link>
        <Link href="/fuentes" className="transition hover:text-ink">Fuentes</Link>
      </nav>
      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-2 text-sm text-navy-soft sm:flex"><span className="size-2 rounded-full bg-verified" aria-hidden="true" />Fuentes oficiales como respaldo</span>
        <ThemeToggle />
      </div>
    </header>
  );
}
export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-navy px-5 py-10 text-paper sm:px-8 lg:px-10">
      <div className="mx-auto grid w-full max-w-7xl gap-8 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <Link href="/" className="font-serif text-2xl">Defensor</Link>
          <p className="mt-2 max-w-md text-sm leading-6 text-paper/70">Orientación laboral informativa para entender mejor tus próximos pasos. No sustituye la asesoría profesional.</p>
        </div>
        <nav className="grid gap-2 text-sm text-paper/80 sm:justify-items-end" aria-label="Información legal">
          <Link href="/privacidad" className="hover:text-brass">Privacidad</Link>
          <Link href="/terminos" className="hover:text-brass">Términos y alcance</Link>
          <Link href="/chat" className="font-semibold text-paper hover:text-brass">Abrir consulta →</Link>
        </nav>
      </div>
    </footer>
  );
}

export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="max-w-3xl">
      <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-brass">{eyebrow}</p>
      <h1 className="mt-5 font-serif text-5xl font-medium leading-[1.02] tracking-[-0.04em] text-ink sm:text-7xl">{title}</h1>
      <p className="mt-7 max-w-2xl text-lg leading-8 text-navy-soft sm:text-xl">{description}</p>
    </div>
  );
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
