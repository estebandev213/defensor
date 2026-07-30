import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  FileCheck,
  FileText,
  Gift,
  Link2,
  LockKeyhole,
  PenLine,
  Scale,
  Search,
  ShieldCheck,
  UserRoundX,
} from "lucide-react";
import { HeroDemo } from "@/components/hero-demo";
import { JsonLd, PublicFooter, PublicHeader } from "@/components/public-shell";
import { createFaqStructuredData, landingFaqItems } from "@/features/landing/faq";
import { siteConfig, topicPages } from "@/lib/site";

type ProcessIconName = "describe" | "verify" | "guide" | "care";
type TopicIconName = "dismiss" | "cts" | "gift" | "calendar" | "clock";

const topicIconBySlug = {
  despido: "dismiss",
  cts: "cts",
  gratificaciones: "gift",
  vacaciones: "calendar",
  "horas-extras": "clock",
} as const satisfies Record<(typeof topicPages)[number]["slug"], TopicIconName>;

const topicQueryBySlug = {
  despido: "Me despidieron sin darme una razón clara, ¿qué puedo hacer?",
  cts: "¿Me corresponde CTS si renuncié a mi trabajo?",
  gratificaciones: "No me pagaron la gratificación de julio, ¿es obligatorio pagarla?",
  vacaciones: "Terminé mi contrato y no me pagaron las vacaciones truncas, ¿qué me corresponde?",
  "horas-extras": "Trabajo más horas de las pactadas en mi contrato, ¿me deben pagar horas extra?",
} as const satisfies Record<(typeof topicPages)[number]["slug"], string>;

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

type MethodologyIconName = "sources" | "retrieval" | "evidence" | "citations";

const methodologyBlocks = [
  {
    number: "01",
    title: "Fuentes primero",
    description: "La V1 trabaja con fuentes oficiales verificables. Cada norma del catálogo público muestra su estado de vigencia real, incluso cuando aún está por confirmarse.",
    icon: "sources",
  },
  {
    number: "02",
    title: "Recuperación híbrida",
    description: "Combinamos coincidencia textual y semántica, aplicamos filtros de régimen y vigencia, y reducimos duplicados antes de preparar una respuesta.",
    icon: "retrieval",
  },
  {
    number: "03",
    title: "Evidencia antes de generación",
    description: "Un control determinístico puede responder, pedir una aclaración o abstenerse. El modelo no completa por su cuenta lo que la evidencia no respalda.",
    icon: "evidence",
  },
  {
    number: "04",
    title: "Citas verificables",
    description: "Cada cita debe pertenecer al conjunto recuperado, conservar metadata de fuente y enlazar a su referencia oficial. Las citas huérfanas se rechazan.",
    icon: "citations",
  },
] as const;

function MethodologyIcon({ name }: { name: MethodologyIconName }) {
  if (name === "sources") {
    return <FileCheck className="size-7" strokeWidth={1.7} aria-hidden="true" />;
  }

  if (name === "retrieval") {
    return <Search className="size-7" strokeWidth={1.7} aria-hidden="true" />;
  }

  if (name === "evidence") {
    return <ShieldCheck className="size-7" strokeWidth={1.7} aria-hidden="true" />;
  }

  return <Link2 className="size-7" strokeWidth={1.7} aria-hidden="true" />;
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
  const faqStructuredData = createFaqStructuredData();

  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <JsonLd data={structuredData} />
      <JsonLd data={faqStructuredData} />
      <PublicHeader />

      <section className="relative mx-auto grid w-full max-w-[1720px] gap-12 px-5 pb-20 pt-16 sm:px-8 sm:pt-20 lg:grid-cols-[0.76fr_1.24fr] lg:items-center lg:gap-20 lg:px-10 lg:pb-28 lg:pt-24">
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

        <div className="relative z-[1] mx-auto w-full max-w-[680px] lg:max-w-[920px] lg:justify-self-end">
          <div className="absolute -right-8 -top-10 size-48 rounded-full bg-brass-soft/80 blur-3xl" aria-hidden="true" />
          <HeroDemo />
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

      <section id="temas-principales" className="relative scroll-mt-6 overflow-hidden border-y border-border bg-paper">
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
            {topicPages.map((topic) => <Link key={topic.slug} href={`/chat?q=${encodeURIComponent(topicQueryBySlug[topic.slug])}`} className="group flex min-h-[25.5rem] flex-col rounded-2xl border border-border bg-paper p-7 shadow-[0_8px_24px_rgba(22,37,62,0.025)] transition hover:-translate-y-1 hover:border-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass sm:p-8"><span className="relative mx-auto grid size-[7.5rem] place-items-center rounded-full bg-background text-navy transition group-hover:bg-brass-soft"><span className="absolute -top-1 size-2 rounded-full bg-brass" aria-hidden="true" /><TopicIcon name={topicIconBySlug[topic.slug]} /></span><span className="mt-8 font-serif text-[1.45rem] font-semibold tracking-[-0.03em] text-ink">{topic.title}</span><span className="mt-3 text-[0.96rem] leading-7 text-navy-soft">{topic.description}</span><span className="mt-auto w-full text-right"><ArrowRight className="ml-auto size-7 text-brass transition group-hover:translate-x-1" aria-hidden="true" /></span></Link>)}
          </div>

        </div>
      </section>

      <section id="metodologia" className="scroll-mt-6 border-y border-border bg-surface">
        <div className="mx-auto grid w-full max-w-[1440px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-16 lg:px-10 lg:py-28">
          <div>
            <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.23em] text-brass">Metodología</p>
            <h2 className="mt-7 max-w-xl font-serif text-[3.2rem] font-medium leading-[0.98] tracking-[-0.05em] text-ink sm:text-6xl">Así respaldamos cada respuesta.</h2>
            <p className="mt-8 max-w-lg text-base leading-7 text-navy-soft sm:text-lg sm:leading-8">Analizamos tu situación con rigor jurídico: revisamos los hechos, verificamos el régimen laboral aplicable y consultamos fuentes oficiales del Perú. Si la evidencia no basta, te lo decimos con claridad.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {methodologyBlocks.map((block) => (
              <article key={block.number} className="group relative min-h-[18.5rem] overflow-hidden rounded-3xl border border-border bg-paper p-6 shadow-[0_12px_30px_rgba(22,37,62,0.04)] transition duration-300 hover:-translate-y-1 hover:border-brass hover:shadow-[0_18px_38px_rgba(22,37,62,0.09)] sm:p-7">
                <span className="pointer-events-none absolute -right-12 -top-12 size-36 rounded-full border border-brass/10 transition duration-300 group-hover:scale-110 group-hover:border-brass/25" aria-hidden="true" />
                <div className="relative">
                  <span className="grid size-11 place-items-center rounded-xl bg-brass-soft font-mono text-sm text-brass">{block.number}</span>
                  <span className="absolute right-[-0.5rem] top-[-0.5rem] grid size-14 place-items-center text-navy transition duration-300 group-hover:scale-105 group-hover:text-brass"><MethodologyIcon name={block.icon} /></span>
                </div>
                <div className="relative mt-10">
                  <h3 className="max-w-[15rem] font-serif text-[1.55rem] font-semibold leading-tight tracking-[-0.035em] text-ink">{block.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-navy-soft">{block.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>


      <section id="preguntas" aria-labelledby="faq-heading" className="border-y border-border bg-surface">
        <div className="mx-auto grid w-full max-w-[1440px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20 lg:px-10 lg:py-28">
          <div className="lg:sticky lg:top-10 lg:self-start">
            <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.23em] text-brass">Preguntas frecuentes</p>
            <h2 id="faq-heading" className="mt-7 max-w-md font-serif text-[3.2rem] font-medium leading-[0.98] tracking-[-0.05em] text-ink sm:text-6xl">
              Todo claro antes de <span className="text-brass">empezar.</span>
            </h2>
            <p className="mt-7 max-w-md text-base leading-7 text-navy-soft sm:text-lg sm:leading-8">
              Conoce el alcance, el uso de fuentes y cómo cuidamos tu información antes de describir tu caso.
            </p>

          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-border bg-paper shadow-[0_16px_40px_rgba(22,37,62,0.05)]">
            {landingFaqItems.map(({ id, question, answer }, index) => (
              <details key={id} name="landing-faq" open={index === 0} className="group border-b border-border last:border-b-0 open:bg-background/45">
                <summary className="flex min-h-[5.5rem] cursor-pointer list-none items-center gap-4 px-5 py-5 transition-colors hover:bg-background/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brass sm:gap-6 sm:px-7 [&::-webkit-details-marker]:hidden">
                  <span className="font-mono text-[0.65rem] font-semibold tracking-[0.16em] text-brass">{String(index + 1).padStart(2, "0")}</span>
                  <span className="flex-1 font-serif text-lg font-semibold leading-6 tracking-[-0.02em] text-ink sm:text-xl">{question}</span>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-surface text-xl font-light leading-none text-brass transition duration-200 group-open:rotate-45 group-open:border-brass group-open:bg-brass-soft" aria-hidden="true">+</span>
                </summary>
                <div className="px-5 pb-6 pl-[4.5rem] pr-16 sm:pb-7 sm:pl-[5.35rem] sm:pr-20">
                  <p className="max-w-2xl text-sm leading-7 text-navy-soft sm:text-base">{answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
