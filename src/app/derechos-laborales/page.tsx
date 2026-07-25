import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, PublicFooter, PublicHeader } from "@/components/public-shell";
import { topicPages } from "@/lib/site";

export const metadata: Metadata = {
  title: "Derechos laborales",
  description: "Temas laborales que puedes ordenar antes de consultar a Defensor.",
  alternates: { canonical: "/derechos-laborales" },
};

export default function LaborRightsPage() {
  return <main className="min-h-screen bg-background"><PublicHeader /><section className="mx-auto max-w-7xl px-5 pb-16 pt-14 sm:px-8 sm:pt-20 lg:px-10"><PageIntro eyebrow="Temas laborales" title="Empieza por ordenar los hechos." description="Estas páginas no sustituyen una revisión profesional. Sirven para identificar qué información puede ser útil antes de formular una consulta." /><div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{topicPages.map((topic) => <Link key={topic.slug} href={`/derechos-laborales/${topic.slug}`} className="rounded-2xl border border-border bg-paper p-6 transition hover:-translate-y-0.5 hover:border-brass"><h2 className="font-serif text-2xl text-ink">{topic.title}</h2><p className="mt-3 text-sm leading-6 text-navy-soft">{topic.description}</p><span className="mt-6 block text-sm font-semibold text-brass">Revisar tema →</span></Link>)}</div></section><PublicFooter /></main>;
}
