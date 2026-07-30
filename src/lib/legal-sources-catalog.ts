import rawCorpus from "../../data/legal/corpus-legal-defensor-v1.json";

interface RawLegalSource {
  title: string;
  norm_type: string;
  norm_number: string | null;
  official_publisher: string;
  official_url: string | null;
  source_domain: string | null;
  publication_date: string | null;
  effective_from: string | null;
  effective_to: string | null;
  status: string;
  legal_regime: string[];
  topics: string[];
  priority: "critical" | "high" | "medium" | "low";
  recommended_for_rag: boolean;
  verification_notes?: string;
}

export type SourceStatusTone = "positive" | "modified" | "caution" | "info";

export interface PublicLegalSource {
  id: string;
  title: string;
  normLabel: string;
  typeLabel: string;
  tags: string[];
  entity: string;
  entityFull: string;
  officialUrl: string | null;
  sourceDomain: string | null;
  referenceDateLabel: string | null;
  referenceDateIso: string | null;
  statusLabel: string;
  statusTone: SourceStatusTone;
  topics: string[];
  verificationNote?: string;
}

export interface SourcesCatalogStats {
  totalDocuments: number;
  lawsAndDecrees: number;
  regulationsAndResolutions: number;
}

const NORM_TYPE_LABELS: Record<string, string> = {
  ley: "Ley",
  decreto_legislativo: "Decreto Legislativo",
  decreto_supremo: "Decreto Supremo",
  guia_oficial_no_normativa: "Guía oficial",
};

const STATUS_LABELS: Record<string, { label: string; tone: SourceStatusTone }> = {
  vigente: { label: "Vigente", tone: "positive" },
  vigente_modificada: { label: "Vigente, con modificaciones", tone: "modified" },
  vigencia_desconocida: { label: "Vigencia por confirmar", tone: "caution" },
  vigencia_suspendida: { label: "Vigencia suspendida", tone: "caution" },
  guia_oficial_no_normativa: { label: "Guía institucional", tone: "info" },
};

const TOPIC_LABELS: Record<string, string> = {
  despido: "Despido",
  terminacion_laboral: "Término laboral",
  contratos: "Contratos",
  remuneracion: "Remuneración",
  periodo_de_prueba: "Periodo de prueba",
  cts: "CTS",
  liquidacion_beneficios_sociales: "Liquidación de beneficios",
  gratificaciones: "Gratificaciones",
  gratificacion_trunca: "Gratificación trunca",
  vacaciones: "Vacaciones",
  vacaciones_truncas: "Vacaciones truncas",
  descanso_semanal: "Descanso semanal",
  feriados: "Feriados",
  jornada_laboral: "Jornada laboral",
  horas_extras: "Horas extras",
  trabajo_nocturno: "Trabajo nocturno",
  remuneracion_minima_vital: "Remuneración mínima vital",
  uit: "UIT",
  mype: "MYPE",
  multas: "Multas",
  regimen_laboral_especial: "Régimen laboral especial",
  pensiones_sociales: "Pensiones sociales",
  fiscalizacion: "Fiscalización",
  denuncias: "Denuncias",
  infracciones_laborales: "Infracciones laborales",
  todos: "General",
  derivacion: "Derivación",
};

function topicLabel(topic: string): string {
  return TOPIC_LABELS[topic] ?? topic.replace(/_/g, " ");
}

function canonicalEntity(publisher: string): string {
  if (/sunafil/i.test(publisher)) return "SUNAFIL";
  if (/econom[ií]a y finanzas|\bmef\b/i.test(publisher)) return "Ministerio de Economía y Finanzas";
  if (/producci[oó]n/i.test(publisher)) return "Ministerio de la Producción";
  if (/congreso/i.test(publisher)) return "Congreso de la República";
  if (/\bmtpe\b|trabajo y promoci[oó]n/i.test(publisher)) return "Ministerio de Trabajo y Promoción del Empleo";
  return "Poder Ejecutivo";
}

function formatDate(iso: string | null): { label: string | null; iso: string | null } {
  if (!iso) return { label: null, iso: null };
  const parsed = new Date(`${iso}T00:00:00Z`);
  const label = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(parsed);
  return { label, iso };
}

function normalizeOfficialUrl(value: string | null): string | null {
  if (!value) return null;

  try {
    return new URL(value).protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

function slugify(value: string): string {
  return value
    .replace(/[áàäâ]/gi, "a")
    .replace(/[éèëê]/gi, "e")
    .replace(/[íìïî]/gi, "i")
    .replace(/[óòöô]/gi, "o")
    .replace(/[úùüû]/gi, "u")
    .replace(/ñ/gi, "n")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildTags(source: RawLegalSource, typeLabel: string): string[] {
  const tags = [typeLabel];
  if (/texto único ordenado/i.test(source.title)) tags.push("TUO");
  if (/reglamento/i.test(source.title)) tags.push("Reglamento");
  const [primaryTopic] = source.topics;
  if (primaryTopic) tags.push(topicLabel(primaryTopic));
  return tags;
}

function toPublicSource(source: RawLegalSource, index: number): PublicLegalSource {
  const typeLabel = NORM_TYPE_LABELS[source.norm_type] ?? source.norm_type;
  const normLabel = source.norm_number ? `${typeLabel} N.º ${source.norm_number}` : typeLabel;
  const officialUrl = normalizeOfficialUrl(source.official_url);
  const status = officialUrl
    ? (STATUS_LABELS[source.status] ?? {
        label: source.status,
        tone: "info" as const,
      })
    : { label: "Pendiente de verificación", tone: "caution" as const };
  const { label: referenceDateLabel, iso: referenceDateIso } = formatDate(
    source.effective_from ?? source.publication_date,
  );

  return {
    id: `${slugify(source.title)}-${source.norm_number ?? index}`,
    title: source.title,
    normLabel,
    typeLabel,
    tags: buildTags(source, typeLabel),
    entity: canonicalEntity(source.official_publisher),
    entityFull: source.official_publisher,
    officialUrl,
    sourceDomain: source.source_domain,
    referenceDateLabel,
    referenceDateIso,
    statusLabel: status.label,
    statusTone: status.tone,
    topics: source.topics.map(topicLabel),
    verificationNote: source.verification_notes,
  };
}

const sources = (rawCorpus.sources as RawLegalSource[]).map(toPublicSource);

export function getPublicLegalSources(): PublicLegalSource[] {
  return sources;
}

export function getSourcesCatalogStats(): SourcesCatalogStats {
  const raw = rawCorpus.sources as RawLegalSource[];
  return {
    totalDocuments: raw.length,
    lawsAndDecrees: raw.filter((s) => s.norm_type === "ley" || s.norm_type === "decreto_legislativo").length,
    regulationsAndResolutions: raw.filter((s) => s.norm_type === "decreto_supremo").length,
  };
}

export function getSourceFilterOptions() {
  const types = new Set<string>();
  const entities = new Set<string>();
  const topics = new Set<string>();
  for (const source of sources) {
    types.add(source.typeLabel);
    entities.add(source.entity);
    for (const topic of source.topics) topics.add(topic);
  }
  return {
    types: [...types].sort(),
    entities: [...entities].sort(),
    topics: [...topics].sort(),
  };
}

export const corpusRetrievedAt = rawCorpus.retrieved_at;
