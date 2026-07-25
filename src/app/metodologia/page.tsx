import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, PublicFooter, PublicHeader } from "@/components/public-shell";

export const metadata: Metadata = {
  title: "Metodología",
  description: "Conoce la arquitectura de recuperación, evidencia, abstención y citas de Defensor.",
  alternates: { canonical: "/metodologia" },
};

const principles = [
  ["Fuentes primero", "La V1 está diseñada para trabajar con fuentes oficiales verificables. El catálogo se mantiene vacío hasta que cada fuente pueda ser revisada e ingresada de forma reproducible."],
  ["Recuperación híbrida", "La búsqueda combina coincidencia textual y semántica, aplica filtros de régimen y vigencia, y reduce duplicados antes de preparar una respuesta."],
  ["Evidencia antes de generación", "Un gate determinístico puede responder, pedir una aclaración o abstenerse. El modelo no debe completar por su cuenta lo que la evidencia no respalda."],
  ["Citas verificables", "Cada cita debe pertenecer al conjunto recuperado, tener metadata de fuente y conservar un enlace oficial. Las citas huérfanas o inventadas se rechazan."],
] as const;

export default function MethodologyPage() {
  return <main className="min-h-screen bg-background"><PublicHeader /><section className="mx-auto max-w-7xl px-5 pb-16 pt-14 sm:px-8 sm:pt-20 lg:px-10"><PageIntro eyebrow="Transparencia" title="La respuesta también explica sus límites." description="La metodología de Defensor separa clasificación, retrieval, evidencia y presentación para que la interfaz no oculte la incertidumbre." /><div className="mt-16 grid gap-5 lg:grid-cols-2">{principles.map(([title, description], index) => <article key={title} className="rounded-2xl border border-border bg-paper p-6 sm:p-8"><span className="grid size-9 place-items-center rounded-lg bg-brass-soft font-mono text-sm text-brass">0{index + 1}</span><h2 className="mt-7 font-serif text-2xl text-ink">{title}</h2><p className="mt-3 text-sm leading-7 text-navy-soft">{description}</p></article>)}</div></section><section className="border-y border-border bg-surface"><div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10"><h2 className="font-serif text-3xl text-ink">Lo que no hace Defensor</h2><div className="mt-7 grid gap-3 text-sm text-navy-soft sm:grid-cols-3"><div className="rounded-xl border border-border bg-paper p-5">No reemplaza a un abogado.</div><div className="rounded-xl border border-border bg-paper p-5">No navega internet abierto para completar una respuesta.</div><div className="rounded-xl border border-border bg-paper p-5">No presenta una fuente no verificada como si fuera ley.</div></div><Link href="/fuentes" className="mt-8 inline-flex min-h-11 items-center font-semibold text-brass underline underline-offset-4">Ver estado del catálogo de fuentes →</Link></div></section><PublicFooter /></main>;
}
