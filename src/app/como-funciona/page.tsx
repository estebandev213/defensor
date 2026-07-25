import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd, PageIntro, PublicFooter, PublicHeader } from "@/components/public-shell";

export const metadata: Metadata = {
  title: "Cómo funciona",
  description: "Conoce cómo Defensor organiza una consulta laboral y cuándo decide preguntar o abstenerse.",
  alternates: { canonical: "/como-funciona" },
};

const steps = [
  ["01", "Describe tu situación", "Escribe lo que ocurrió con tus propias palabras. No necesitas conocer términos legales para empezar."],
  ["02", "Identificamos lo que falta", "La consulta se clasifica por tema y cobertura. Si un dato puede cambiar la interpretación, lo preguntamos antes de concluir."],
  ["03", "Buscamos evidencia", "El sistema está diseñado para combinar búsqueda textual y semántica, filtrar vigencia y conservar la referencia del artículo."],
  ["04", "Mostramos el respaldo", "Una respuesta solo debe llegar con citas que puedan vincularse a la fuente recuperada. Si no se puede verificar, nos abstenemos."],
] as const;

export default function HowItWorksPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "¿Qué ocurre si falta información?", acceptedAnswer: { "@type": "Answer", text: "Defensor puede pedir un dato principal antes de preparar una orientación." } },
      { "@type": "Question", name: "¿Qué ocurre si no hay evidencia suficiente?", acceptedAnswer: { "@type": "Answer", text: "Defensor debe abstenerse y explicar brevemente qué no pudo verificar." } },
    ],
  };

  return <main className="min-h-screen bg-background"><JsonLd data={structuredData} /><PublicHeader /><section className="mx-auto max-w-7xl px-5 pb-16 pt-14 sm:px-8 sm:pt-20 lg:px-10"><PageIntro eyebrow="El proceso" title="Claridad antes que certeza aparente." description="Defensor está pensado para acompañar una consulta anónima, ordenar los hechos y mostrar qué parte de la orientación puede respaldarse." /><div className="mt-16 grid gap-5 sm:grid-cols-2">{steps.map(([number, title, description]) => <article key={number} className="rounded-2xl border border-border bg-paper p-6 sm:p-8"><p className="font-mono text-sm text-brass">{number}</p><h2 className="mt-8 font-serif text-2xl text-ink">{title}</h2><p className="mt-3 text-sm leading-6 text-navy-soft">{description}</p></article>)}</div></section><section className="border-y border-border bg-paper"><div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-10"><div><p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-brass">Tu privacidad</p><h2 className="mt-3 max-w-sm font-serif text-3xl text-ink">Una consulta sin perfil ni historial.</h2></div><div className="space-y-4 text-sm leading-7 text-navy-soft"><p>No necesitas crear una cuenta. La conversación de la V1 vive en la sesión actual y no se presenta como un expediente personal.</p><p>No compartas DNI, dirección, teléfonos, nombres completos ni documentos confidenciales.</p><Link href="/privacidad" className="inline-flex min-h-11 items-center font-semibold text-brass underline underline-offset-4">Leer la política de privacidad →</Link></div></div></section><div className="mx-auto flex max-w-7xl justify-center px-5 py-14 sm:px-8 lg:px-10"><Link href="/chat" className="inline-flex min-h-12 items-center rounded-xl bg-navy px-6 text-sm font-semibold text-paper hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass">Abrir una consulta</Link></div><PublicFooter /></main>;
}
