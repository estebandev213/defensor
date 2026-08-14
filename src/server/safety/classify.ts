import {
  QueryClassificationSchema,
  type QueryClassification,
} from "@/server/ai/schemas";

export const supportedCategories = [
  "despido",
  "cts",
  "gratificaciones",
  "vacaciones",
  "horas_extras",
  "contratos",
  "liquidacion",
] as const;

const outOfScopePatterns = [
  /\bpenal|delito|denuncia criminal|fiscalia\b/,
  /\btributar|impuesto|sunat\b/,
  /\bdivorcio|custodia|alimentos\b/,
  /\bdiagnostico|medic|enfermedad|sintoma\b/,
  /\baccidente grave|peligro inmediato|violencia fisica|amenaza inmediata\b/,
];

const emergencyPatterns = [
  /\baccidente grave|peligro inmediato|violencia fisica|amenaza inmediata\b/,
];

const calculationPattern =
  /\bcalcul(?:a|ar)\b|\b(?:monto|suma|porcentaje)\b|\bcuant(?:o|a|os|as)\s+(?:dinero|pagar|debo|pago|monto)\b/;
const documentPattern = /\bdemanda|carta notarial|escrito|documento legal\b/;
const generalConversationPattern = /^(hola|buenas|gracias|ok|adios)[!. ]*$/;

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function hasAny(value: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(value));
}

function classifyCategory(query: string): string {
  const categories: readonly [string, RegExp][] = [
    ["despido", /\bdespid|desped|cese|botaron|desvincul/],
    ["cts", /\bcts\b|compensacion por tiempo de servicios/],
    ["gratificaciones", /\bgratific/],
    ["vacaciones", /\bvaca/],
    ["horas_extras", /\bhoras? extra|sobretiempo/],
    ["contratos", /\bcontrato|periodo de prueba|modalidad contractual/],
    ["liquidacion", /\bliquidacion|beneficios sociales/],
  ];

  return categories.find(([, pattern]) => pattern.test(query))?.[0] ?? "general";
}

const canonicalSearchByCategory: Readonly<Record<string, string>> = {
  despido: "despido cese relación laboral régimen privado Perú",
  cts: "compensación por tiempo de servicios CTS régimen privado Perú",
  gratificaciones: "gratificaciones legales régimen privado Perú",
  vacaciones: "vacaciones laborales régimen privado Perú",
  horas_extras: "jornada de trabajo sobretiempo horas extras régimen privado Perú",
  contratos: "contrato de trabajo régimen privado Perú",
  liquidacion: "liquidación beneficios sociales cese régimen privado Perú",
};

function searchQueriesFor(category: string, query: string): string[] {
  const canonical = canonicalSearchByCategory[category];
  const regimeAwareCanonical = canonical && /\bremype|mype|microempresa|pequena empresa\b/.test(query)
    ? canonical.replace("régimen privado", "régimen MYPE")
    : canonical;

  return [...new Set([
    regimeAwareCanonical,
    query || "consulta laboral peruana",
  ].filter((value): value is string => Boolean(value)))].slice(0, 4);
}

const benefitEntitlementPattern =
  /\b(?:corresponde|corresponden|derecho|derechos|cuanto|cuanta|monto|pagar|pago|calcular|calculo|liquidacion|beneficios?)\b/;

const dismissalAssessmentPattern =
  /\b(?:legal|justificado|injustificado|arbitrario|nulo|indemnizacion|reponer|reposicion|reincorporar|reincorporacion)\b/;

const datePattern =
  /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b|\b20\d{2}\b/;

function hasRegimeMarker(query: string): boolean {
  return [
    /\bregimen\b/,
    /\bprivado general\b/,
    /\bremype|mype|microempresa|pequena empresa\b/,
    /\bcas|agrario|trabajador del hogar|construccion civil\b/,
  ].some((pattern) => pattern.test(query));
}

function shouldClarifyRegime(category: string, query: string): boolean {
  return ["cts", "gratificaciones", "liquidacion"].includes(category) && benefitEntitlementPattern.test(query);
}

function missingFactsFor(category: string, query: string) {
  if (category === "despido" && dismissalAssessmentPattern.test(query) && !datePattern.test(query)) {
    return [
      {
        key: "termination_date",
        question: "¿En qué fecha terminó tu relación laboral?",
        reason: "La fecha puede cambiar el análisis del despido y los plazos aplicables.",
      },
    ];
  }

  if (shouldClarifyRegime(category, query) && !hasRegimeMarker(query)) {
    return [
      {
        key: "legal_regime",
        question:
          "¿Tu empleador estaba bajo el régimen laboral privado general o inscrito en REMYPE?",
        reason:
          "El régimen aplicable puede cambiar los beneficios y requisitos de tu caso.",
      },
    ];
  }

  return [];
}

export function classifyQuery(input: string): QueryClassification {
  const query = normalize(input);
  const category = classifyCategory(query);
  const isEmergency = hasAny(query, emergencyPatterns);
  const isOutOfScope = hasAny(query, outOfScopePatterns);
  const isCalculation = calculationPattern.test(query);
  const isDocumentRequest = documentPattern.test(query);
  const isGeneralConversation = generalConversationPattern.test(query);

  let intent: QueryClassification["intent"] = "legal_question";
  if (isEmergency) intent = "emergency";
  else if (isOutOfScope) intent = "out_of_scope";
  else if (isCalculation) intent = "calculation_request";
  else if (isDocumentRequest) intent = "document_request";
  else if (isGeneralConversation) intent = "general_conversation";

  const supportedCategory = supportedCategories.includes(
    category as (typeof supportedCategories)[number],
  );
  const coverageStatus =
    intent !== "legal_question"
      ? "unsupported"
      : category === "general"
        ? "unsupported"
        : category === "liquidacion"
          ? "beta"
          : supportedCategory
            ? "supported"
            : "unsupported";

  const possibleRegimes = /\bremype|mype|microempresa|pequena empresa\b/.test(query)
    ? ["mype"]
    : ["privado_general"];

  const classification = {
    intent,
    category,
    possibleRegimes,
    coverageStatus,
    missingFacts:
      intent === "legal_question" && coverageStatus !== "unsupported"
        ? missingFactsFor(category, query)
        : [],
    // Short follow-ups such as "esta semana" carry case context but make poor
    // lexical/semantic searches. Put a deterministic, topic-specific query
    // first so the fallback planner remains useful when the LLM is unavailable.
    searchQueries: searchQueriesFor(category, query),
    riskLevel:
      intent === "emergency" || intent === "out_of_scope"
        ? "high"
        : intent === "calculation_request" || category === "despido"
          ? "medium"
          : "low",
  } satisfies QueryClassification;

  return QueryClassificationSchema.parse(classification);
}
