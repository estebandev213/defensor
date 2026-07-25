import Link from "next/link";
import { JsonLd, PublicFooter, PublicHeader } from "@/components/public-shell";
import { siteConfig, topicPages } from "@/lib/site";

const faqItems = [
  ["¿Defensor reemplaza a un abogado?", "No. Es una herramienta de orientación general y no representa al usuario ni garantiza un resultado."],
  ["¿De dónde salen las respuestas?", "La arquitectura está preparada para recuperar fuentes oficiales, mostrar las citas utilizadas y abstenerse cuando la evidencia no alcanza."],
  ["¿Se guarda mi conversación?", "La V1 mantiene la conversación solo durante la sesión del navegador. No ofrece historial persistente."],
] as const;

export default function HomePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: "es-PE",
  };
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };

  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <JsonLd data={structuredData} />
      <JsonLd data={faqStructuredData} />
      <PublicHeader />

      <section className="mx-auto grid w-full max-w-7xl gap-14 px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-10 lg:pb-28 lg:pt-24">
        <div>
          <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-brass">Defensor · Perú</p>
          <h1 className="mt-5 max-w-3xl font-serif text-5xl font-medium leading-[0.98] tracking-[-0.04em] text-ink sm:text-7xl">Entiende tus derechos laborales.</h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-navy-soft sm:text-xl">Describe tu situación y recibe una orientación clara, respaldada por normas oficiales del Perú.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/chat" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-navy px-6 text-sm font-semibold text-paper shadow-sm transition hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-background">Consultar mi caso <span aria-hidden="true">→</span></Link>
            <a href="#como-funciona" className="inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-sm font-semibold text-navy-soft transition hover:bg-paper hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass">Conoce cómo funciona</a>
          </div>
          <p className="mt-5 text-xs text-muted">Anónimo por diseño · Sin historial persistente en esta versión</p>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="absolute -right-8 -top-8 size-36 rounded-full bg-brass-soft blur-3xl" aria-hidden="true" />
          <div className="relative rounded-[2rem] border border-border bg-paper p-4 shadow-paper sm:p-6">
            <div className="flex items-center justify-between border-b border-border-soft pb-4">
              <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-navy text-paper" aria-hidden="true">D</span><div><p className="text-sm font-semibold text-ink">Tu consulta</p><p className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-muted">Sesión anónima</p></div></div>
              <span className="rounded-full bg-brass-soft px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-brass">En revisión</span>
            </div>
            <div className="space-y-5 py-7">
              <div className="ml-auto max-w-[82%] rounded-2xl rounded-br-md bg-background px-4 py-3 text-sm leading-6 text-navy-soft">¿Qué información debería reunir para revisar mi situación?</div>
              <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-border-soft bg-surface px-4 py-4"><p className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-brass">Antes de responder</p><p className="mt-2 text-sm leading-6 text-navy-soft">Primero se revisan los hechos, el régimen laboral y la evidencia disponible.</p><div className="mt-4 flex items-center gap-2 text-xs text-verified"><span className="size-1.5 rounded-full bg-current" aria-hidden="true" />Sin evidencia suficiente, preguntamos o nos abstenemos.</div></div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted"><span className="flex-1">Describe tu situación...</span><span className="grid size-8 place-items-center rounded-lg bg-border-soft text-muted" aria-hidden="true">↑</span></div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="border-y border-border bg-paper">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.7fr_1.3fr] lg:px-10 lg:py-20">
          <div><p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-brass">Cómo funciona</p><h2 className="mt-3 max-w-sm font-serif text-3xl font-medium leading-tight text-ink sm:text-4xl">Una respuesta clara empieza por la evidencia.</h2></div>
          <div className="grid gap-8 sm:grid-cols-3">{[["01", "Describe", "Cuéntanos tu situación en lenguaje cotidiano."], ["02", "Verificamos", "Buscamos respaldo dentro de fuentes oficiales."], ["03", "Orientamos", "Separamos la norma de lo que depende de tus hechos."]].map(([number, title, description]) => <div key={number} className="border-t border-border pt-4"><p className="font-mono text-xs text-brass">{number}</p><h3 className="mt-5 text-base font-semibold text-ink">{title}</h3><p className="mt-2 text-sm leading-6 text-navy-soft">{description}</p></div>)}</div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-brass">Cobertura inicial</p><h2 className="mt-3 font-serif text-3xl font-medium text-ink sm:text-4xl">Temas para empezar</h2></div><p className="max-w-sm text-sm leading-6 text-navy-soft">La cobertura crece solo cuando existe corpus y evaluación suficiente para responder con prudencia.</p></div><div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{topicPages.map((topic) => <Link key={topic.slug} href={`/derechos-laborales/${topic.slug}`} className="rounded-2xl border border-border bg-paper p-5 transition hover:-translate-y-0.5 hover:border-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"><span className="font-serif text-xl text-ink">{topic.title}</span><span className="mt-2 block text-sm leading-6 text-navy-soft">{topic.description}</span></Link>)}</div></section>

      <section className="border-y border-border bg-surface"><div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-10 lg:py-20"><div><p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-brass">Si no sabemos</p><h2 className="mt-3 max-w-md font-serif text-3xl font-medium leading-tight text-ink sm:text-4xl">Una respuesta prudente también sabe detenerse.</h2></div><div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-border bg-paper p-5"><p className="font-semibold text-ink">Falta un dato</p><p className="mt-2 text-sm leading-6 text-navy-soft">Te pedimos solo la información que puede cambiar la interpretación.</p></div><div className="rounded-2xl border border-border bg-paper p-5"><p className="font-semibold text-ink">No hay evidencia</p><p className="mt-2 text-sm leading-6 text-navy-soft">No rellenamos el vacío con una conclusión inventada.</p></div><div className="rounded-2xl border border-border bg-paper p-5"><p className="font-semibold text-ink">Está fuera de alcance</p><p className="mt-2 text-sm leading-6 text-navy-soft">Te lo decimos de forma directa y sugerimos revisar una fuente humana.</p></div></div></div></section>

      <section className="mx-auto w-full max-w-4xl px-5 py-16 sm:px-8 lg:py-20"><p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-brass">Preguntas frecuentes</p><h2 className="mt-3 font-serif text-3xl font-medium text-ink sm:text-4xl">Antes de consultar</h2><div className="mt-8 divide-y divide-border border-y border-border">{faqItems.map(([question, answer]) => <details key={question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink"><span>{question}</span><span className="text-xl text-brass transition group-open:rotate-45" aria-hidden="true">+</span></summary><p className="mt-3 max-w-2xl text-sm leading-6 text-navy-soft">{answer}</p></details>)}</div></section>

      <PublicFooter />
    </main>
  );
}
