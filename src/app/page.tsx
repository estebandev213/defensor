import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";

const topics = ["Despido", "CTS y gratificaciones", "Vacaciones", "Horas extras", "Contratos"];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
        <BrandMark />
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 text-sm text-navy-soft sm:flex">
            <span className="size-2 rounded-full bg-verified" aria-hidden="true" />
            Fuentes oficiales como respaldo
          </span>
          <ThemeToggle />
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-14 px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-10 lg:pb-28 lg:pt-24">
        <div>
          <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-brass">Defensor · Perú</p>
          <h1 className="mt-5 max-w-3xl font-serif text-5xl font-medium leading-[0.98] tracking-[-0.04em] text-ink sm:text-7xl">
            Entiende tus derechos laborales.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-navy-soft sm:text-xl">
            Describe tu situación y recibe una orientación clara, respaldada por normas oficiales del Perú.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/chat" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-navy px-6 text-sm font-semibold text-paper shadow-sm transition hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              Consultar mi caso
              <span aria-hidden="true">→</span>
            </Link>
            <a href="#como-funciona" className="inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-sm font-semibold text-navy-soft transition hover:bg-paper hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass">Conoce cómo funciona</a>
          </div>
          <p className="mt-5 text-xs text-muted">Anónimo por diseño · Sin historial persistente en esta versión</p>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="absolute -right-8 -top-8 size-36 rounded-full bg-brass-soft blur-3xl" aria-hidden="true" />
          <div className="relative rounded-[2rem] border border-border bg-paper p-4 shadow-paper sm:p-6">
            <div className="flex items-center justify-between border-b border-border-soft pb-4">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-navy text-paper" aria-hidden="true">D</span>
                <div>
                  <p className="text-sm font-semibold text-ink">Tu consulta</p>
                  <p className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-muted">Sesión anónima</p>
                </div>
              </div>
              <span className="rounded-full bg-brass-soft px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-brass">Borrador</span>
            </div>
            <div className="space-y-5 py-7">
              <div className="ml-auto max-w-[82%] rounded-2xl rounded-br-md bg-background px-4 py-3 text-sm leading-6 text-navy-soft">
                ¿Qué debería revisar si termina mi relación laboral?
              </div>
              <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-border-soft bg-surface px-4 py-4">
                <p className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-brass">Orientación clara</p>
                <p className="mt-2 text-sm leading-6 text-navy-soft">Primero hay que revisar los hechos y el régimen laboral. Las fuentes citadas aparecerán junto a la respuesta.</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-verified"><span className="size-1.5 rounded-full bg-current" aria-hidden="true" />Citas verificables</div>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted">
              <span className="flex-1">Describe tu situación...</span>
              <span className="grid size-8 place-items-center rounded-lg bg-border-soft text-muted" aria-hidden="true">↑</span>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="border-y border-border bg-paper">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.7fr_1.3fr] lg:px-10 lg:py-20">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-brass">Cómo funciona</p>
            <h2 className="mt-3 max-w-sm font-serif text-3xl font-medium leading-tight text-ink sm:text-4xl">Una respuesta clara empieza por la evidencia.</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              ["01", "Describe", "Cuéntanos tu situación en lenguaje cotidiano."],
              ["02", "Verificamos", "Buscamos respaldo dentro de fuentes oficiales."],
              ["03", "Orientamos", "Separamos la norma de lo que depende de tus hechos."],
            ].map(([number, title, description]) => (
              <div key={number} className="border-t border-border pt-4">
                <p className="font-mono text-xs text-brass">{number}</p>
                <h3 className="mt-5 text-base font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-navy-soft">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-brass">Cobertura inicial</p>
            <h2 className="mt-3 font-serif text-3xl font-medium text-ink sm:text-4xl">Temas para empezar</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-navy-soft">La cobertura crecerá solo cuando exista corpus y evaluación suficiente para responder con prudencia.</p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          {topics.map((topic) => <span key={topic} className="rounded-full border border-border bg-paper px-4 py-2.5 text-sm text-navy-soft">{topic}</span>)}
        </div>
      </section>

      <footer className="border-t border-border bg-navy px-5 py-10 text-paper sm:px-8 lg:px-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-serif text-2xl">Defensor</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-paper/70">Orientación laboral informativa para entender mejor tus próximos pasos. No sustituye la asesoría profesional.</p>
          </div>
          <Link href="/chat" className="inline-flex min-h-11 items-center text-sm font-semibold text-paper underline decoration-brass underline-offset-4 hover:text-brass">Abrir el espacio de consulta →</Link>
        </div>
      </footer>
    </main>
  );
}
