import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CircleHelp,
  Clock3,
  FileCheck,
  FileText,
  Gift,
  Link2,
  LockKeyhole,
  PenLine,
  Scale,
  Search,
  Send,
  ShieldCheck,
  TriangleAlert,
  UserRoundX,
} from "lucide-react";
import { JsonLd, PublicFooter, PublicHeader } from "@/components/public-shell";
import { siteConfig, topicPages } from "@/lib/site";

const faqItems = [
  ["¿Defensor reemplaza a un abogado?", "No. Es una herramienta de orientación general y no representa al usuario ni garantiza un resultado."],
  ["¿De dónde salen las respuestas?", "La arquitectura está preparada para recuperar fuentes oficiales, mostrar las citas utilizadas y abstenerse cuando la evidencia no alcanza."],
  ["¿Se guarda mi conversación?", "La V1 mantiene la conversación solo durante la sesión del navegador. No ofrece historial persistente."],
] as const;

type ProcessIconName = "describe" | "verify" | "guide" | "care";
type TopicIconName = "dismiss" | "cts" | "gift" | "calendar" | "clock";

const topicIconBySlug = {
  despido: "dismiss",
  cts: "cts",
  gratificaciones: "gift",
  vacaciones: "calendar",
  "horas-extras": "clock",
} as const satisfies Record<(typeof topicPages)[number]["slug"], TopicIconName>;

function ProcessIcon({ name }: { name: ProcessIconName }) {
  if (name === "describe") {
    return <PenLine className="size-12" strokeWidth={1.7} aria-hidden="true" />;
  }

  if (name === "verify") {
    return <Search className="size-12" strokeWidth={1.7} aria-hidden="true" />;
  }

  if (name === "guide") {
    return <Scale className="size-12" strokeWidth={1.7} aria-hidden="true" />;
  }

  return <FileCheck className="size-12" strokeWidth={1.7} aria-hidden="true" />;
}

function TopicIcon({ name }: { name: TopicIconName }) {
  if (name === "dismiss") {
    return <UserRoundX className="size-14" strokeWidth={1.7} aria-hidden="true" />;
  }

  if (name === "cts") {
    return <BriefcaseBusiness className="size-14" strokeWidth={1.7} aria-hidden="true" />;
  }

  if (name === "gift") {
    return <Gift className="size-14" strokeWidth={1.7} aria-hidden="true" />;
  }

  if (name === "calendar") {
    return <CalendarDays className="size-14" strokeWidth={1.7} aria-hidden="true" />;
  }

  return <Clock3 className="size-14" strokeWidth={1.7} aria-hidden="true" />;
}

type PrudenceIconName = "question" | "shield" | "warning";

function PrudenceIcon({ name }: { name: PrudenceIconName }) {
  if (name === "question") {
    return <CircleHelp className="size-11" strokeWidth={1.7} aria-hidden="true" />;
  }

  if (name === "shield") {
    return <ShieldCheck className="size-11" strokeWidth={1.7} aria-hidden="true" />;
  }

  return <TriangleAlert className="size-11" strokeWidth={1.7} aria-hidden="true" />;
}

type TrustIconName = "shield" | "document" | "calendar" | "link" | "lock";

function TrustIcon({ name }: { name: TrustIconName }) {
  if (name === "shield") {
    return <ShieldCheck className="size-7" strokeWidth={1.7} aria-hidden="true" />;
  }

  if (name === "document") {
    return <FileText className="size-7" strokeWidth={1.7} aria-hidden="true" />;
  }

  if (name === "calendar") {
    return <CalendarDays className="size-7" strokeWidth={1.7} aria-hidden="true" />;
  }

  if (name === "link") {
    return <Link2 className="size-7" strokeWidth={1.7} aria-hidden="true" />;
  }

  return <LockKeyhole className="size-7" strokeWidth={1.7} aria-hidden="true" />;
}

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

      <section className="relative mx-auto grid w-full max-w-[1440px] gap-12 px-5 pb-20 pt-16 sm:px-8 sm:pt-20 lg:grid-cols-[0.96fr_1.04fr] lg:items-center lg:gap-14 lg:px-10 lg:pb-28 lg:pt-24">
        <div className="relative z-[1] lg:pl-10">
          <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.23em] text-brass">Orientación laboral con respaldo oficial</p>
          <h1 className="mt-6 max-w-2xl font-serif text-[3.2rem] font-medium leading-[0.95] tracking-[-0.055em] text-ink sm:text-6xl lg:text-[4.7rem]">Entiende tus<br />derechos laborales<br />con <span className="text-brass">claridad.</span></h1>
          <p className="mt-8 max-w-xl text-base leading-7 text-navy-soft sm:text-lg sm:leading-8">Describe tu situación y recibe una orientación clara, basada en normas oficiales del Perú y fuentes verificables.</p>
          <div className="mt-8 max-w-xl">
            <p className="text-sm font-medium text-navy-soft">Respaldado por normas oficiales de:</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 font-serif text-lg font-semibold tracking-[-0.02em] text-ink sm:gap-x-7 sm:text-xl">
              <span>MTPE</span><span className="h-6 w-px bg-border" aria-hidden="true" /><span>El Peruano</span><span className="h-6 w-px bg-border" aria-hidden="true" /><span>Congreso</span><span className="h-6 w-px bg-border" aria-hidden="true" /><span>SUNAFIL</span>
            </div>
          </div>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/chat" className="inline-flex min-h-[3.8rem] items-center justify-center gap-4 rounded-xl bg-navy px-7 text-base font-semibold text-paper shadow-sm transition hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-background">Consultar mi caso <ArrowRight className="size-5 text-brass" aria-hidden="true" /></Link>
            <a href="#como-funciona" className="inline-flex min-h-[3.8rem] items-center justify-center gap-2 px-4 text-base font-semibold text-navy transition hover:text-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass">Conoce cómo funciona <ArrowRight className="size-4 text-brass" aria-hidden="true" /></a>
          </div>
        </div>

        <div className="relative z-[1] mx-auto w-full max-w-[680px] lg:max-w-none">
          <div className="absolute -right-8 -top-10 size-48 rounded-full bg-brass-soft/80 blur-3xl" aria-hidden="true" />
          <div className="relative rounded-[2rem] border border-border bg-paper/95 p-5 shadow-paper backdrop-blur sm:p-8">
            <div className="space-y-6 py-6 sm:py-7">
              <div className="ml-auto max-w-[90%] rounded-2xl bg-background px-5 py-4 text-[0.96rem] leading-7 text-navy sm:max-w-[84%]">¿Pueden despedirme sin causa después de que me reincorporé por licencia médica?</div>
              <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
                <div className="flex gap-4 sm:gap-5"><span className="grid size-12 shrink-0 place-items-center rounded-full border border-brass/30 bg-paper text-brass" aria-hidden="true"><Scale className="size-7" strokeWidth={1.4} /></span><p className="text-[0.98rem] leading-7 text-navy">En general, la reincorporación luego de una licencia médica no constituye por sí sola una causa válida de despido. La respuesta depende de los hechos y de la evidencia disponible.</p></div>
                <p className="mt-6 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.17em] text-brass">Fuentes que respaldan esta orientación</p>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><span className="rounded-xl border border-border bg-paper px-3 py-3 text-center text-xs leading-5 text-navy-soft">Norma oficial<br /><span className="font-semibold text-ink">Art. 25</span></span><span className="rounded-xl border border-border bg-paper px-3 py-3 text-center text-xs leading-5 text-navy-soft">Fuente vigente<br /><span className="font-semibold text-ink">Art. 17</span></span><span className="rounded-xl border border-border bg-paper px-3 py-3 text-center text-xs leading-5 text-navy-soft">Publicación<br /><span className="font-semibold text-ink">Art. 15</span></span><span className="rounded-xl border border-border bg-paper px-3 py-3 text-center text-xs font-semibold leading-5 text-navy-soft">+2 más</span></div>
                <div className="mt-5 flex items-center gap-2 border-t border-border-soft pt-5 text-sm text-verified"><span className="size-2 rounded-full bg-current" aria-hidden="true" />Evidencia suficiente. Orientación basada en fuentes oficiales.</div>
              </div>
            </div>
            <div className="flex min-h-16 items-center gap-3 rounded-2xl border border-border bg-surface px-5 text-sm text-muted"><span className="flex-1">Describe tu situación laboral...</span><span className="grid size-11 place-items-center rounded-full bg-brass text-paper shadow-sm" aria-hidden="true"><Send className="size-5" strokeWidth={1.8} /></span></div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="border-y border-border bg-paper">
        <div className="mx-auto grid w-full max-w-[1440px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.78fr_1.42fr] lg:gap-14 lg:px-10 lg:py-28">
          <div className="flex flex-col justify-between lg:min-h-[31rem]">
            <div>
              <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.23em] text-brass">Cómo funciona</p>
              <h2 className="mt-8 max-w-md font-serif text-[3.2rem] font-medium leading-[0.98] tracking-[-0.05em] text-ink sm:text-6xl">Una respuesta clara empieza por la <span className="text-brass">evidencia.</span></h2>
              <p className="mt-8 max-w-md text-base leading-7 text-navy-soft sm:text-lg sm:leading-8">Nuestro proceso combina tecnología y rigor jurídico para darte orientación clara y fundamentada.</p>
              <div className="mt-6 grid max-w-lg gap-3 sm:grid-cols-3">
                {[
                  ["document", "Información oficial"],
                  ["calendar", "Actualizada"],
                  ["shield", "Con respaldo legal"],
                ].map(([icon, label]) => (
                  <div key={label} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 py-3 text-center text-xs font-medium text-navy-soft">
                    <span className="grid size-9 place-items-center rounded-full bg-brass-soft text-navy"><TrustIcon name={icon as TrustIconName} /></span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <div className="relative mb-7 hidden items-center justify-between px-[7%] sm:flex">
              <div className="absolute left-[11%] right-[11%] top-1/2 border-t-2 border-dotted border-brass-soft" aria-hidden="true" />
              {["01", "02", "03", "04"].map((number) => <span key={number} className="relative z-[1] grid size-16 place-items-center rounded-full border border-border bg-paper font-serif text-2xl text-brass shadow-[0_4px_12px_rgba(169,132,63,0.08)]">{number}</span>)}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["describe", "Describe", "Cuéntanos tu situación en lenguaje cotidiano."],
                ["verify", "Verificamos", "Buscamos respaldo en fuentes oficiales."],
                ["guide", "Orientamos", "Separamos la norma de lo que depende de tus hechos."],
                ["care", "Con prudencia", "Si falta información, te lo decimos claro."],
              ].map(([icon, title, description], index) => (
                <article key={title} className="group relative flex min-h-[21rem] flex-col rounded-2xl border border-border bg-paper p-6 shadow-[0_8px_24px_rgba(22,37,62,0.025)] transition hover:-translate-y-1 hover:border-brass sm:p-7">
                  <span className="grid size-[6.3rem] place-items-center self-center rounded-full bg-background text-navy transition group-hover:bg-brass-soft"><ProcessIcon name={icon as ProcessIconName} /></span>
                  <div className="mt-8"><h3 className="font-serif text-[1.35rem] font-semibold tracking-[-0.03em] text-ink">{title}</h3><p className="mt-3 text-[0.96rem] leading-7 text-navy-soft">{description}</p></div>
                  <ArrowRight className="mt-auto size-7 self-end text-brass transition group-hover:translate-x-1" aria-hidden="true" />
                  <span className="sr-only">Paso {index + 1}</span>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="temas" className="relative overflow-hidden border-y border-border bg-paper">
        <div className="pointer-events-none absolute right-[-4rem] top-16 hidden opacity-50 xl:block" aria-hidden="true">
          <svg viewBox="0 0 520 290" className="h-[290px] w-[520px] text-brass-soft" fill="none">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((offset) => <path key={offset} d={`M0 ${28 + offset * 27}c72-50 102 57 173 0s105-57 174 0 105 57 173 0`} stroke="currentColor" strokeWidth="1" />)}
          </svg>
        </div>
        <div className="relative mx-auto w-full max-w-[1440px] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-start">
            <div>
              <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.23em] text-brass">Temas principales</p>
              <h2 className="mt-7 max-w-xl font-serif text-[3.2rem] font-medium leading-[0.98] tracking-[-0.05em] text-ink sm:text-6xl">Empieza por<br />lo que <span className="text-brass">necesitas.</span></h2>
              <p className="mt-8 max-w-md text-base leading-7 text-navy-soft sm:text-lg sm:leading-8">Selecciona un tema y recibe orientación basada en normas oficiales del Perú.</p>
            </div>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {topicPages.map((topic) => <Link key={topic.slug} href={`/derechos-laborales/${topic.slug}`} className="group flex min-h-[25.5rem] flex-col rounded-2xl border border-border bg-paper p-7 shadow-[0_8px_24px_rgba(22,37,62,0.025)] transition hover:-translate-y-1 hover:border-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass sm:p-8"><span className="relative mx-auto grid size-[7.5rem] place-items-center rounded-full bg-background text-navy transition group-hover:bg-brass-soft"><span className="absolute -top-1 size-2 rounded-full bg-brass" aria-hidden="true" /><TopicIcon name={topicIconBySlug[topic.slug]} /></span><span className="mt-8 font-serif text-[1.45rem] font-semibold tracking-[-0.03em] text-ink">{topic.title}</span><span className="mt-3 text-[0.96rem] leading-7 text-navy-soft">{topic.description}</span><span className="mt-auto w-full border-t border-brass-soft pt-5 text-right"><ArrowRight className="ml-auto size-7 text-brass transition group-hover:translate-x-1" aria-hidden="true" /></span></Link>)}
          </div>

        </div>
      </section>

      <section id="metodologia" className="border-y border-border bg-surface">
        <div className="mx-auto grid w-full max-w-[1440px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-16 lg:px-10 lg:py-28">
          <div>
            <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.23em] text-brass">Metodología</p>
            <h2 className="mt-7 max-w-xl font-serif text-[3.2rem] font-medium leading-[0.98] tracking-[-0.05em] text-ink sm:text-6xl">Así respaldamos cada respuesta.</h2>
            <p className="mt-8 max-w-lg text-base leading-7 text-navy-soft sm:text-lg sm:leading-8">Analizamos tu situación con rigor jurídico: revisamos los hechos, verificamos el régimen laboral aplicable y consultamos fuentes oficiales del Perú. Si la evidencia no basta, te lo decimos con claridad.</p>
            <div className="mt-9 max-w-lg divide-y divide-border">
              {["Revisamos hechos, régimen y evidencia", "Mostramos fuentes oficiales", "Si falta un dato, preguntamos", "Si no hay evidencia suficiente, nos detenemos"].map((item) => <div key={item} className="flex items-center gap-4 py-3.5 text-sm font-semibold text-navy"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-brass-soft text-brass" aria-hidden="true"><Check className="size-4" strokeWidth={2} /></span>{item}</div>)}
            </div>
          </div>

          <div>
            <p className="mb-5 text-base font-semibold text-navy">Ejemplo de respuesta con citas</p>
            <div className="rounded-[1.75rem] border border-border bg-paper p-5 shadow-[0_16px_35px_rgba(22,37,62,0.06)] sm:p-7">
              <div className="flex items-center justify-between border-b border-border-soft pb-5">
                <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-lg bg-navy font-serif text-lg text-paper" aria-hidden="true">D</span><div><p className="text-sm font-semibold text-ink">Defensor</p><p className="font-mono text-[0.55rem] uppercase tracking-[0.15em] text-muted">Sesión anónima</p></div></div>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#e6f1e9] px-3 py-1.5 font-mono text-[0.55rem] font-semibold uppercase tracking-[0.13em] text-verified"><span aria-hidden="true">✓</span>Respuesta verificada</span>
              </div>
              <div className="space-y-5 py-6 text-sm leading-6 text-navy sm:text-base sm:leading-7"><p className="font-semibold text-ink">Con los hechos descritos, tu vínculo corresponde a un contrato de trabajo sujeto al régimen laboral de la actividad privada.</p><p>Esto implica derechos como descanso semanal, vacaciones pagadas y compensación por tiempo de servicios, conforme a la normativa vigente.</p></div>
              <p className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-brass">Fuentes consultadas</p>
              <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border">
                {[["Fuente oficial del corpus", "Texto exacto verificado", "Artículo relevante"], ["Norma laboral vigente", "Metadata revisada", "Artículo aplicable"], ["Referencia oficial", "Enlace original disponible", "Texto consultado"]].map(([title, subtitle, article]) => <div key={title} className="flex items-center gap-3 px-4 py-3.5"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-background text-brass" aria-hidden="true"><FileText className="size-4" strokeWidth={1.5} /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-ink">{title}</span><span className="block truncate text-[0.65rem] text-muted">{subtitle}</span></span><span className="hidden rounded-full bg-brass-soft px-2 py-1 font-mono text-[0.55rem] text-brass sm:inline-flex">{article}</span><ArrowUpRight className="size-4 text-navy-soft" aria-hidden="true" /></div>)}
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#eaf3ec] px-4 py-3 text-xs text-verified"><span className="grid size-4 place-items-center rounded-full bg-verified text-[0.6rem] text-paper" aria-hidden="true">i</span>Las referencias se presentan con su fuente y contexto verificable.</div>
            </div>
          </div>
        </div>
      </section>

      <section id="prudencia" className="relative overflow-hidden border-y border-border bg-paper">
        <div className="pointer-events-none absolute -bottom-4 left-4 hidden text-brass opacity-[0.12] lg:block" aria-hidden="true">
          <svg viewBox="0 0 270 360" className="h-[360px] w-[270px]" fill="none">
            <path d="M132 10v250M82 38h100M132 38 70 153M132 38l62 115M37 153c0 20 15 36 33 36s33-16 33-36H37Zm128 0c0 20 15 36 33 36s33-16 33-36h-66Z" stroke="currentColor" strokeWidth="1.8" />
            <path d="M132 260c-39 15-60 27-60 50 0 34 43 43 60 43s60-9 60-43c0-23-21-35-60-50ZM72 310c-23 7-42 19-42 34 0 24 35 29 102 29s102-5 102-29c0-15-19-27-42-34M70 344l-30 15M194 344l30 15M30 359h204" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="132" cy="20" r="16" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </div>
        <div className="relative mx-auto grid w-full max-w-[1440px] gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[0.74fr_1.26fr] lg:items-center lg:gap-16 lg:px-10 lg:py-28">
          <div className="relative z-[1] lg:pb-24">
            <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.23em] text-brass">Si no sabemos</p>
            <h2 className="mt-8 max-w-lg font-serif text-[3.35rem] font-medium leading-[0.96] tracking-[-0.055em] text-ink sm:text-6xl">Preferimos ser <span className="whitespace-nowrap">prudentes<span className="text-brass">.</span></span></h2>
            <p className="mt-8 max-w-md text-base leading-7 text-navy-soft sm:text-lg sm:leading-8">No inventamos respuestas. Si faltan hechos o evidencia suficiente, te lo decimos con claridad y te guiamos sobre el siguiente paso.</p>
          </div>

          <div className="relative pl-0 sm:pl-20">
            <div className="absolute bottom-24 left-7 top-12 hidden w-px bg-border sm:block" aria-hidden="true" />
            <div className="space-y-6">
              {[
                ["01", "question", "Falta un dato", "Te pedimos solo la información necesaria para interpretar correctamente tu caso."],
                ["02", "shield", "No hay evidencia suficiente", "Si no encontramos respaldo bastante, no rellenamos el vacío con una conclusión inventada."],
                ["03", "warning", "Está fuera de alcance", "Si el tema no pertenece a esta versión o necesita asesoría especializada, te lo decimos de forma directa."],
              ].map(([number, icon, title, description]) => <article key={number} className="relative min-h-[10.5rem] rounded-2xl border border-border bg-paper p-6 shadow-[0_8px_24px_rgba(22,37,62,0.025)] sm:p-8"><span className="absolute -left-[4.55rem] top-1/2 hidden size-[8.2rem] -translate-y-1/2 place-items-center rounded-full border border-border bg-paper p-3 shadow-[0_5px_15px_rgba(22,37,62,0.04)] sm:grid"><span className="grid size-full place-items-center rounded-full bg-background text-navy"><PrudenceIcon name={icon as PrudenceIconName} /></span></span><div className="flex items-start justify-between gap-5"><div><p className="font-serif text-xl font-semibold text-brass">{number}</p><h3 className="mt-3 font-serif text-[1.65rem] font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-2xl">{title}</h3><p className="mt-3 max-w-2xl text-sm leading-7 text-navy-soft sm:text-base">{description}</p></div><ArrowRight className="mt-10 size-7 text-brass" aria-hidden="true" /></div></article>)}
            </div>
            <div className="mt-8 flex items-center gap-4 rounded-2xl border border-border bg-surface px-6 py-5 text-sm leading-6 text-navy-soft sm:px-7"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-brass-soft text-brass" aria-hidden="true"><ShieldCheck className="size-5" strokeWidth={1.7} /></span><span>Orientación responsable, incluso cuando la respuesta correcta es <strong className="font-semibold text-ink">detenerse.</strong></span></div>
          </div>
        </div>
      </section>

      <section id="fuentes-confianza" className="border-y border-border bg-paper">
        <div className="mx-auto w-full max-w-[1440px] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="grid gap-14 lg:grid-cols-[1.42fr_0.78fr] lg:items-start lg:gap-16">
            <div>
              <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.23em] text-brass">Fuentes oficiales y confianza</p>
              <h2 className="mt-7 max-w-3xl font-serif text-[3.2rem] font-medium leading-[0.98] tracking-[-0.05em] text-ink sm:text-6xl">Lo que decimos, viene de <span className="text-brass">fuentes oficiales.</span></h2>
              <p className="mt-8 max-w-2xl text-base leading-7 text-navy-soft sm:text-lg sm:leading-8">Consultamos normas, reglamentos y documentos emitidos por entidades del Estado peruano.</p>
              <p className="mt-9 font-mono text-[0.63rem] font-semibold uppercase tracking-[0.18em] text-navy-soft">Entidades de referencia</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[['PERÚ · MTPE', 'Ministerio de Trabajo y Promoción del Empleo'], ['SUNAFIL', 'Superintendencia Nacional de Fiscalización Laboral'], ['CONGRESO', 'Congreso de la República'], ['El Peruano', 'Diario Oficial']].map(([name, description]) => <div key={name} className="flex min-h-[7.6rem] flex-col justify-between rounded-2xl border border-border bg-paper p-5 shadow-[0_6px_18px_rgba(22,37,62,0.035)]"><span className="font-serif text-xl font-semibold tracking-[-0.03em] text-ink">{name}</span><span className="text-xs leading-5 text-navy-soft">{description}</span></div>)}
              </div>

              <div className="mt-5 rounded-2xl border border-border bg-surface p-5 sm:p-7">
                <p className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-brass">Ejemplo de cita verificable</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-[9rem_1fr] sm:items-start"><div className="hidden flex-col items-center gap-3 sm:flex"><span className="grid size-11 place-items-center rounded-xl bg-paper text-brass shadow-sm"><TrustIcon name="document" /></span><span className="h-20 w-px bg-border" aria-hidden="true" /><span className="grid size-11 place-items-center rounded-xl bg-paper font-serif text-lg text-navy">§</span><span className="h-20 w-px bg-border" aria-hidden="true" /><span className="grid size-11 place-items-center rounded-xl bg-paper font-semibold text-navy">66</span></div><div className="space-y-5"><div className="grid gap-2 sm:grid-cols-[7rem_1fr]"><span className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-navy-soft">Norma</span><span className="text-sm font-semibold text-ink">Norma oficial incorporada al corpus</span></div><div className="grid gap-2 sm:grid-cols-[7rem_1fr]"><span className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-navy-soft">Artículo</span><span className="text-sm text-navy">Artículo identificado en la fuente original</span></div><div className="grid gap-2 sm:grid-cols-[7rem_1fr]"><span className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-navy-soft">Extracto</span><span className="rounded-xl bg-paper px-4 py-3 text-sm leading-6 text-navy-soft">Mostramos el fragmento exacto que respalda la orientación para que puedas revisarlo en contexto.</span></div><div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"><span className="text-sm text-navy-soft"><strong className="mr-2 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-navy-soft">Fuente oficial</strong>Entidad publicadora verificada</span><Link href="/fuentes" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-brass px-4 text-xs font-semibold text-brass transition hover:bg-brass hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass">Ver catálogo público <ArrowUpRight className="size-4" aria-hidden="true" /></Link></div></div></div>
              </div>
            </div>

            <aside className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
              <div className="divide-y divide-border">
                {[["shield", "Fuentes verificables", "Solo utilizamos documentos oficiales publicados por entidades del Estado."], ["document", "Artículos exactos", "Citamos el artículo y la norma específica que respalda cada respuesta."], ["calendar", "Normativa vigente", "El contenido debe actualizarse y conservar el estado de cada fuente."], ["link", "Enlaces oficiales", "Accede directamente a la fuente original cuando esté disponible."]].map(([icon, title, description]) => <div key={title} className="flex gap-5 py-6 first:pt-0 last:pb-6"><span className="grid size-14 shrink-0 place-items-center rounded-full bg-brass-soft text-navy"><TrustIcon name={icon as TrustIconName} /></span><div><h3 className="font-serif text-xl font-semibold text-ink">{title}</h3><p className="mt-2 text-sm leading-6 text-navy-soft">{description}</p></div></div>)}
              </div>
              <div className="mt-2 flex items-center gap-4 rounded-2xl bg-paper px-5 py-5"><span className="text-3xl text-brass" aria-hidden="true">✧</span><div><p className="font-serif text-lg font-semibold text-ink">Transparencia total.</p><p className="mt-1 text-sm text-navy-soft">Así generamos confianza.</p></div></div>
            </aside>
          </div>

          <div className="mt-12 grid gap-6 rounded-3xl bg-[#f3f3f8] px-6 py-7 text-navy sm:grid-cols-2 sm:px-10 lg:mt-14"><div className="flex items-center gap-5"><span className="grid size-14 shrink-0 place-items-center rounded-full bg-navy text-paper"><TrustIcon name="shield" /></span><div><h3 className="font-serif text-lg font-semibold text-ink">Tu información está segura</h3><p className="mt-1 text-sm leading-6 text-navy-soft">La V1 no guarda el contenido completo de tus consultas por defecto.</p></div></div><div className="flex items-center gap-5 border-t border-border pt-6 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0"><span className="grid size-14 shrink-0 place-items-center rounded-full bg-[#e6e8f1] text-navy"><TrustIcon name="lock" /></span><div><h3 className="font-serif text-lg font-semibold text-ink">Privacidad por diseño</h3><p className="mt-1 text-sm leading-6 text-navy-soft">La sesión es anónima y temporal; no ofrecemos historial persistente.</p></div></div></div>
        </div>
      </section>

      <section id="preguntas" className="mx-auto w-full max-w-4xl px-5 py-16 sm:px-8 lg:py-20"><p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-brass">Preguntas frecuentes</p><h2 className="mt-3 font-serif text-3xl font-medium text-ink sm:text-4xl">Antes de consultar</h2><div className="mt-8 divide-y divide-border border-y border-border">{faqItems.map(([question, answer]) => <details key={question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink"><span>{question}</span><span className="text-xl text-brass transition group-open:rotate-45" aria-hidden="true">+</span></summary><p className="mt-3 max-w-2xl text-sm leading-6 text-navy-soft">{answer}</p></details>)}</div></section>

      <PublicFooter />
    </main>
  );
}
