import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, PublicFooter, PublicHeader } from "@/components/public-shell";

export const metadata: Metadata = {
  title: "Fuentes oficiales",
  description: "Consulta cómo Defensor conserva y presenta el respaldo de sus fuentes oficiales.",
  alternates: { canonical: "/fuentes" },
};

export default function SourcesPage() {
  return <main className="min-h-screen bg-background"><PublicHeader /><section className="mx-auto max-w-7xl px-5 pb-16 pt-14 sm:px-8 sm:pt-20 lg:px-10"><PageIntro eyebrow="Catálogo público" title="Las fuentes deben poder revisarse." description="Esta página mostrará las normas oficiales incorporadas al corpus cuando hayan pasado la revisión de metadata, vigencia, texto exacto y estructura legal." /><div className="mt-16 rounded-3xl border border-border bg-paper p-6 sm:p-10"><div className="flex flex-col gap-6 sm:flex-row sm:items-start"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brass-soft text-xl text-brass">⌘</span><div><h2 className="font-serif text-2xl text-ink">Catálogo en preparación</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-navy-soft">El repositorio de desarrollo todavía no contiene fuentes legales pobladas. Mantenerlo vacío evita mostrar títulos, artículos o enlaces que no hayan sido verificados.</p><p className="mt-4 text-sm leading-7 text-navy-soft">Cuando exista una fuente disponible, aquí se mostrará su publicador oficial, norma, artículo, estado, extracto y enlace original.</p></div></div></div></section><section className="border-y border-border bg-paper"><div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10"><h2 className="font-serif text-3xl text-ink">Mientras tanto</h2><div className="mt-7 grid gap-4 sm:grid-cols-2"><Link href="/metodologia" className="rounded-2xl border border-border bg-surface p-6 hover:border-brass"><h3 className="font-semibold text-ink">Conoce la metodología</h3><p className="mt-2 text-sm leading-6 text-navy-soft">Cómo se planean retrieval, evidencia y validación de citas.</p></Link><Link href="/chat" className="rounded-2xl border border-border bg-surface p-6 hover:border-brass"><h3 className="font-semibold text-ink">Abrir el chat</h3><p className="mt-2 text-sm leading-6 text-navy-soft">Puedes describir tu caso; el sistema no responderá sin respaldo suficiente.</p></Link></div></div></section><PublicFooter /></main>;
}
