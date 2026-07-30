"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronDown, FileText, Gavel, ScrollText, Search, SquareArrowOutUpRight, X } from "lucide-react";
import type { PublicLegalSource, SourceStatusTone } from "@/lib/legal-sources-catalog";

const TYPE_ICON: Record<string, typeof BookOpen> = {
  Ley: BookOpen,
  "Decreto Legislativo": Gavel,
  "Decreto Supremo": FileText,
  "Guía oficial": ScrollText,
};

const STATUS_STYLES: Record<SourceStatusTone, string> = {
  positive: "border-verified/20 bg-verified/10 text-verified",
  modified: "border-border bg-surface text-navy-soft",
  caution: "border-danger/30 bg-danger/5 text-danger",
  info: "border-border bg-background text-navy-soft",
};

const ALL_FILTER = "Todas";
const PAGE_SIZE = 8;

interface SourcesExplorerProps {
  sources: PublicLegalSource[];
  filterOptions: { types: string[]; entities: string[]; topics: string[] };
}

export function SourcesExplorer({ sources, filterOptions }: SourcesExplorerProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState(ALL_FILTER);
  const [entityFilter, setEntityFilter] = useState(ALL_FILTER);
  const [topicFilter, setTopicFilter] = useState(ALL_FILTER);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const hasActiveFilters = query.trim() !== "" || typeFilter !== ALL_FILTER || entityFilter !== ALL_FILTER || topicFilter !== ALL_FILTER;

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return sources.filter((source) => {
      if (typeFilter !== ALL_FILTER && source.typeLabel !== typeFilter) return false;
      if (entityFilter !== ALL_FILTER && source.entity !== entityFilter) return false;
      if (topicFilter !== ALL_FILTER && !source.topics.includes(topicFilter)) return false;
      if (normalizedQuery === "") return true;
      return (
        source.title.toLowerCase().includes(normalizedQuery) ||
        source.normLabel.toLowerCase().includes(normalizedQuery) ||
        source.entity.toLowerCase().includes(normalizedQuery) ||
        source.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery)) ||
        source.topics.some((topic) =>
          topic.toLowerCase().includes(normalizedQuery),
        )
      );
    });
  }, [sources, query, typeFilter, entityFilter, topicFilter]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, typeFilter, entityFilter, topicFilter]);

  const visibleSources = filtered.slice(0, visibleCount);
  const remainingCount = filtered.length - visibleSources.length;

  function clearFilters() {
    setQuery("");
    setTypeFilter(ALL_FILTER);
    setEntityFilter(ALL_FILTER);
    setTopicFilter(ALL_FILTER);
  }

  return (
    <div className="mt-8">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(28rem,1.4fr)_minmax(10rem,0.7fr)_minmax(13rem,1fr)_minmax(10rem,0.7fr)_auto] xl:items-center">
        <label className="relative min-w-0 md:col-span-2 xl:col-span-1">
          <span className="sr-only">Buscar fuente por nombre o tema</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-navy-soft" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar fuente por nombre o norma…"
            className="min-h-12 w-full rounded-xl border border-border bg-paper pl-11 pr-4 text-sm text-ink placeholder:text-navy-soft/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"
          />
        </label>
        <FilterSelect label="Tipo de fuente" value={typeFilter} onChange={setTypeFilter} options={filterOptions.types} />
        <FilterSelect label="Entidad" value={entityFilter} onChange={setEntityFilter} options={filterOptions.entities} />
        <FilterSelect label="Tema" value={topicFilter} onChange={setTopicFilter} options={filterOptions.topics} />
        <button
          type="button"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-paper px-4 text-sm font-semibold text-navy-soft transition hover:border-brass hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:text-navy-soft md:col-span-2 xl:col-span-1"
        >
          <X className="size-4" aria-hidden="true" />
          Limpiar filtros
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-paper">
        {filtered.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm leading-6 text-navy-soft">No se encontraron fuentes que coincidan con tu búsqueda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {visibleSources.map((source) => (
              <SourceRow
                key={source.id}
                source={source}
                expanded={expandedId === source.id}
                onToggle={() => setExpandedId((current) => (current === source.id ? null : source.id))}
              />
            ))}
          </ul>
        )}
      </div>

      {remainingCount > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-paper px-6 text-sm font-semibold text-navy transition hover:border-brass hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
          >
            Mostrar más ({remainingCount})
          </button>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="relative min-w-0">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full appearance-none rounded-xl border border-border bg-paper py-2 pl-4 pr-9 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"
      >
        <option value={ALL_FILTER}>{label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-navy-soft" aria-hidden="true" />
    </label>
  );
}

function SourceRow({ source, expanded, onToggle }: { source: PublicLegalSource; expanded: boolean; onToggle: () => void }) {
  const Icon = TYPE_ICON[source.typeLabel] ?? FileText;

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full flex-col gap-4 px-5 py-5 text-left transition hover:bg-surface sm:flex-row sm:items-center sm:gap-6 sm:px-7"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brass-soft text-brass">
          <Icon className="size-5" strokeWidth={1.7} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-lg font-semibold leading-snug text-ink">{source.title}</h3>
          <p className="mt-1 text-sm text-navy-soft">{source.normLabel}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {source.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-background px-3 py-1 text-xs font-medium text-navy-soft">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-6 sm:gap-8">
          <div className="hidden text-sm text-navy-soft sm:block sm:max-w-[11rem]">
            <p className="text-xs font-mono uppercase tracking-[0.1em] text-navy-soft/70">Entidad</p>
            <p className="mt-1 leading-5 text-ink">{source.entity}</p>
          </div>
          <div className="hidden text-sm text-navy-soft sm:block">
            <p className="text-xs font-mono uppercase tracking-[0.1em] text-navy-soft/70">Fecha de referencia</p>
            <p className="mt-1 leading-5 text-ink">{source.referenceDateLabel ?? "Sin fecha"}</p>
          </div>
          <ChevronDown className={`size-5 shrink-0 text-brass transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border bg-surface px-5 py-5 sm:px-7">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLES[source.statusTone]}`}>
              {source.statusLabel}
            </span>
            {source.topics.map((topic) => (
              <span key={topic} className="rounded-full border border-border bg-paper px-3 py-1 text-xs text-navy-soft">
                {topic}
              </span>
            ))}
          </div>
          <p className="mt-3 text-sm text-navy-soft sm:hidden">
            {source.entity} · Fecha de referencia{" "}
            {source.referenceDateLabel ?? "sin fecha registrada"}
          </p>
          {source.verificationNote && (
            <p className="mt-4 text-sm leading-6 text-navy-soft">{source.verificationNote}</p>
          )}
          {source.officialUrl ? (
            <a
              href={source.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-brass px-4 text-sm font-semibold text-brass transition hover:bg-brass hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
            >
              Ver fuente oficial
              <SquareArrowOutUpRight className="size-4" aria-hidden="true" />
            </a>
          ) : (
            <p className="mt-4 text-sm font-semibold text-danger">
              Enlace oficial pendiente de verificación.
            </p>
          )}
        </div>
      )}
    </li>
  );
}
