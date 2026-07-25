import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageIntro, PublicFooter, PublicHeader } from "@/components/public-shell";
import { getTopicPage, topicPages } from "@/lib/site";

export function generateStaticParams() {
  return topicPages.map((topic) => ({ topic: topic.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> {
  const { topic: slug } = await params;
  const topic = getTopicPage(slug);
  if (!topic) return { title: "Tema no encontrado", robots: { index: false, follow: false } };
  return { title: topic.title, description: topic.description, alternates: { canonical: `/derechos-laborales/${topic.slug}` } };
}

export default async function LaborTopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic: slug } = await params;
  const topic = getTopicPage(slug);
  if (!topic) notFound();

  return <main className="min-h-screen bg-background"><PublicHeader /><section className="mx-auto max-w-7xl px-5 pb-16 pt-14 sm:px-8 sm:pt-20 lg:px-10"><PageIntro eyebrow="Orientación general" title={topic.title} description={topic.description} /><div className="mt-16 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]"><article className="rounded-2xl border border-border bg-paper p-6 sm:p-8"><h2 className="font-serif text-2xl text-ink">Qué conviene reunir</h2><ul className="mt-6 space-y-4 text-sm leading-6 text-navy-soft">{topic.facts.map((fact) => <li key={fact} className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-brass" aria-hidden="true" /><span>{fact}</span></li>)}</ul></article><aside className="rounded-2xl border border-border bg-surface p-6 sm:p-8"><p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-brass">Importante</p><h2 className="mt-4 font-serif text-2xl text-ink">El régimen puede cambiar la lectura.</h2><p className="mt-3 text-sm leading-6 text-navy-soft">Una consulta clara necesita fechas, documentos y contexto. Defensor preguntará por el dato principal cuando no esté disponible.</p><Link href="/chat" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-navy px-5 text-sm font-semibold text-paper hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass">Consultar este tema</Link></aside></div></section><section className="border-y border-border bg-paper"><div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10"><p className="text-sm leading-7 text-navy-soft">Esta página ofrece información de preparación, no una conclusión sobre tu caso. No compartas DNI, dirección, teléfonos, nombres completos ni documentos confidenciales.</p></div></section><PublicFooter /></main>;
}
