import {
  QueryClassificationSchema,
  type QueryClassification,
} from "@/server/ai/schemas";

const supportedCategories = [
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

const calculationPattern = /\bcalcula|calcular|cuanto|monto|suma|porcentaje\b/;
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

function missingFactsFor(category: string, query: string) {
  const regimeMarkers = [
    /\bregimen\b/,
    /\bprivado general\b/,
    /\bremype|mype|microempresa|pequena empresa\b/,
    /\bcas|agrario|trabajador del hogar|construccion civil\b/,
  ];

  if (
    supportedCategories.includes(category as (typeof supportedCategories)[number]) &&
    !hasAny(query, regimeMarkers)
  ) {
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
    searchQueries: [query || "consulta laboral peruana"].slice(0, 4),
    riskLevel:
      intent === "emergency" || intent === "out_of_scope"
        ? "high"
        : intent === "calculation_request" || category === "despido"
          ? "medium"
          : "low",
  } satisfies QueryClassification;

  return QueryClassificationSchema.parse(classification);
}
