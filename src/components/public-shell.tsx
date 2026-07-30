import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { topicPages } from "@/lib/site";

export function PublicHeader() {
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 lg:px-10 lg:py-7">
      <Link href="/" aria-label="Defensor, inicio"><BrandMark /></Link>
      <nav className="hidden items-center gap-8 text-[0.93rem] font-semibold text-navy-soft xl:flex" aria-label="Navegación pública">
        <Link href="/#como-funciona" className="transition hover:text-ink">Cómo funciona</Link>
        <Link href="/#metodologia" className="transition hover:text-ink">Metodología</Link>
        <Link href="/fuentes" className="transition hover:text-ink">Fuentes</Link>
        <Link href="/#preguntas" className="transition hover:text-ink">Preguntas frecuentes</Link>
      </nav>
      <div className="flex items-center gap-3">
        <Link href="/chat" className="hidden min-h-11 items-center rounded-xl bg-navy px-5 text-sm font-semibold text-paper shadow-sm transition hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:inline-flex">Consultar mi caso</Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
export function PublicFooter() {
  return (
    <footer className="border-t border-paper/10 bg-navy text-paper">
      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-8 border-b border-paper/15 py-12 sm:py-14 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-brass">
              Tu situación merece claridad
            </p>
            <h2 className="mt-5 max-w-3xl font-serif text-3xl font-medium leading-tight tracking-[-0.035em] sm:text-4xl lg:text-5xl">
              Empieza por contarnos qué pasó.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-paper/75 sm:text-base sm:leading-7">
              Te ayudamos a ordenar los hechos y a identificar qué puede
              respaldarse con fuentes laborales oficiales del Perú.
            </p>
          </div>
          <Link
            href="/chat"
            className="group inline-flex min-h-12 w-fit items-center justify-center gap-3 rounded-xl bg-paper px-6 text-sm font-semibold text-ink shadow-sm ring-1 ring-brass/30 transition hover:-translate-y-0.5 hover:ring-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-4 focus-visible:ring-offset-navy"
          >
            Consultar mi caso
            <ArrowUpRight
              className="size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>

        <div className="grid gap-12 py-12 md:grid-cols-2 lg:grid-cols-[1.35fr_0.7fr_0.8fr_0.7fr] lg:gap-10 lg:py-14">
          <div className="max-w-md">
            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
              aria-label="Defensor, inicio"
            >
              <Image
                src="/images/logo.png"
                alt=""
                width={44}
                height={44}
                className="size-11 rounded-xl object-cover"
                aria-hidden="true"
              />
              <span>
                <span className="block font-serif text-2xl font-medium leading-none tracking-[-0.04em]">
                  Defensor
                </span>
                <span className="mt-1 block text-[0.66rem] tracking-[0.03em] text-paper/70">
                  Asistente laboral del Perú
                </span>
              </span>
            </Link>
            <p className="mt-6 text-sm leading-6 text-paper/75">
              Orientación laboral clara para comprender tus opciones y preparar
              mejores preguntas. No sustituye la asesoría de un profesional.
            </p>
          </div>

          <nav aria-labelledby="footer-explora">
            <h3 id="footer-explora" className="font-mono text-[0.63rem] font-semibold uppercase tracking-[0.2em] text-brass">
              Explora
            </h3>
            <ul className="mt-3 space-y-0.5 text-sm text-paper/75">
              <li><FooterLink href="/#como-funciona">Cómo funciona</FooterLink></li>
              <li><FooterLink href="/#metodologia">Metodología</FooterLink></li>
              <li><FooterLink href="/fuentes">Fuentes</FooterLink></li>
              <li><FooterLink href="/#temas-principales">Temas laborales</FooterLink></li>
            </ul>
          </nav>

          <nav aria-labelledby="footer-temas">
            <h3 id="footer-temas" className="font-mono text-[0.63rem] font-semibold uppercase tracking-[0.2em] text-brass">
              Temas frecuentes
            </h3>
            <ul className="mt-3 space-y-0.5 text-sm text-paper/75">
              {topicPages.map((topic) => (
                <li key={topic.slug}>
                  <FooterLink href={`/derechos-laborales/${topic.slug}`}>
                    {topic.title}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-legal">
            <h3 id="footer-legal" className="font-mono text-[0.63rem] font-semibold uppercase tracking-[0.2em] text-brass">
              Legal
            </h3>
            <ul className="mt-3 space-y-0.5 text-sm text-paper/75">
              <li><FooterLink href="/privacidad">Privacidad</FooterLink></li>
              <li><FooterLink href="/terminos">Términos y alcance</FooterLink></li>
            </ul>
          </nav>
        </div>

        <div className="flex flex-col gap-3 border-t border-paper/15 py-6 text-xs leading-5 text-paper/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Defensor. Proyecto en versión beta.</p>
          <p>Orientación informativa · No es un servicio oficial</p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center transition hover:translate-x-0.5 hover:text-paper focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
    >
      {children}
    </Link>
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
