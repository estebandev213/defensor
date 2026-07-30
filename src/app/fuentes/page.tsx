import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, FileText, Scale, ShieldCheck } from "lucide-react";
import { PageIntro, PublicFooter, PublicHeader } from "@/components/public-shell";
import { SourcesExplorer } from "@/components/sources-explorer";
import { getPublicLegalSources, getSourceFilterOptions, getSourcesCatalogStats } from "@/lib/legal-sources-catalog";

export const metadata: Metadata = {
  title: "Fuentes oficiales",
  description:
    "Consulta el catálogo revisado de normas y publicaciones laborales oficiales del Perú.",
  alternates: { canonical: "/fuentes" },
};

const statCards = [
  { key: "totalDocuments", label: "Documentos oficiales", icon: BookOpen },
  {
    key: "lawsAndDecrees",
    label: "Leyes y decretos legislativos",
    icon: Scale,
  },
  {
    key: "regulationsAndResolutions",
    label: "Decretos supremos",
    icon: FileText,
  },
] as const;

export default function SourcesPage() {
  const sources = getPublicLegalSources();
  const stats = getSourcesCatalogStats();
  const filterOptions = getSourceFilterOptions();

  return (
    <main className="min-h-screen bg-background">
      <PublicHeader />
      <section className="mx-auto max-w-7xl px-5 pb-16 pt-14 sm:px-8 sm:pt-20 lg:px-10">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <PageIntro
            eyebrow="Nuestras fuentes"
            title="Fuentes en las que te respaldamos."
            description="El catálogo reúne normas y publicaciones oficiales del Perú. Cada entrada muestra el estado registrado, incluso cuando su vigencia requiere confirmación."
          />
          <dl className="grid w-full shrink-0 grid-cols-3 gap-4 rounded-3xl border border-border bg-paper p-6 sm:p-8 lg:w-auto lg:min-w-[26rem]">
            {statCards.map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex flex-col items-center gap-3 text-center">
                <span className="grid size-12 place-items-center rounded-2xl bg-brass-soft text-brass">
                  <Icon className="size-5" strokeWidth={1.7} aria-hidden="true" />
                </span>
                <dd className="font-serif text-3xl font-medium text-ink">{stats[key]}</dd>
                <dt className="text-xs leading-5 text-navy-soft">{label}</dt>
              </div>
            ))}
          </dl>
        </div>

        <SourcesExplorer sources={sources} filterOptions={filterOptions} />

        <div className="mt-8 flex flex-col gap-5 rounded-2xl border border-border bg-surface px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="flex items-start gap-3 text-sm leading-6 text-navy-soft">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brass" strokeWidth={1.7} aria-hidden="true" />
            <span>
              El catálogo enlaza publicaciones oficiales y muestra el estado
              registrado de cada fuente. Si detectas un error o información
              desactualizada, puedes reportarlo{" "}
              <Link
                href="/chat"
                className="font-semibold text-brass hover:underline"
              >
                aquí
              </Link>
              .
            </span>
          </p>
          <Link
            href="/#metodologia"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-paper px-5 text-sm font-semibold text-navy transition hover:border-brass hover:text-ink"
          >
            ¿Cómo usamos estas fuentes?
          </Link>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
