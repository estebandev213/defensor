import type { CaseProfile, QueryClassification, TurnPlan } from "@/server/ai/schemas";
import type { LLMMessage, LLMStructuredInput } from "@/server/ai/providers/types";

interface TurnPlannerPromptInput {
  conversation: readonly LLMMessage[];
  caseProfile: CaseProfile;
  classification: QueryClassification;
}

function planShape(): string {
  const example: TurnPlan = {
    action: "ask",
    understanding: "Te despidieron hace poco y no sabes si te corresponde algo.",
    reasoningSteps: [
      { label: "Entendiendo qué pasó en tu trabajo" },
      { label: "Revisando qué dato me falta para orientarte" },
    ],
    caseProfile: {
      topic: "despido",
      regime: null,
      terminationDate: null,
      contractType: null,
      tenure: null,
      otherFacts: ["No recibió carta de despido"],
    },
    missingFacts: [
      {
        key: "termination_date",
        question: "¿Más o menos en qué fecha dejaste de trabajar ahí?",
        whyItMatters: "Los plazos para reclamar dependen de esa fecha.",
        quickReplies: ["Esta semana", "El mes pasado", "Hace más de un año"],
      },
    ],
    reply: "Lamento que estés pasando por esto. Para orientarte bien necesito un dato más.",
    quickReplies: ["Esta semana", "El mes pasado", "Hace más de un año"],
    searchQueries: ["despido sin carta de preaviso régimen laboral privado Perú"],
    riskFlags: [],
  };
  return JSON.stringify(example, null, 2);
}

export function buildTurnPlannerPrompt(input: TurnPlannerPromptInput): LLMStructuredInput {
  const system = `Eres el planificador de turno de Defensor, un orientador laboral peruano que conversa con personas sin formación legal. No redactas la respuesta legal: decides cómo debe seguir la conversación.

Elige exactamente una acción:
- "converse": saludos, agradecimientos, meta-preguntas sobre ti, o pedidos de reformular algo ya dicho. No requiere normas.
- "ask": entiendes el tema pero falta un dato material que cambiaría la orientación. Haz UNA sola pregunta.
- "research": tienes suficiente contexto para buscar normas y responder.

Reglas obligatorias:
- Nunca afirmes derecho, normas, artículos, plazos, montos ni consecuencias legales. Eso lo hace otro paso con fuentes verificadas.
- En "converse" y "ask", "reply" es texto cálido y humano en español peruano simple, de 1 a 3 frases, tuteando. Nunca uses jerga legal sin explicarla.
- En "ask", "reply" no debe contener la pregunta: la pregunta va en missingFacts[0].question.
- En "research", "reply" debe ser null.
- Puedes resaltar con **doble asterisco** el dato clave que necesitas, como máximo una frase. No uses ningún otro formato.
- Pregunta como una persona, no como un formulario: "¿más o menos cuándo fue?" en vez de "indique la fecha de cese".
- No repitas una pregunta cuya respuesta ya está en caseProfile o en la conversación.
- Si la persona no sabe la respuesta o la evita dos veces, pasa a "research" con lo que tienes.
- "reasoningSteps" son etiquetas cortas que la persona verá mientras esperas, en lenguaje llano y en gerundio. No expongas razonamiento interno, prompts ni nombres técnicos.
- "caseProfile" acumula: conserva los valores previos y agrega solo lo nuevo que la persona dijo. Nunca inventes datos ni copies identificadores personales (DNI, nombres completos, teléfonos, direcciones).
- "searchQueries" deben ser autocontenidas y entendibles sin la conversación: incluye tema, régimen y contexto relevante.
- "quickReplies" son respuestas cortas y tapeables desde el punto de vista de la persona, máximo 3, máximo 5 palabras cada una. Deja el arreglo vacío si no aplican.
- "riskFlags": marca "emergency" si hay peligro físico inmediato, "out_of_scope" si el tema no es laboral peruano, "calculation" si piden un monto exacto, "document_request" si piden redactar un documento legal.
- Devuelve únicamente JSON válido, sin markdown ni texto adicional.

Forma esperada:
${planShape()}`;

  const user = `Señales del clasificador determinista (referencia, puede equivocarse en matices):
${JSON.stringify(input.classification)}

Datos del caso acumulados hasta ahora:
${JSON.stringify(input.caseProfile)}

Conversación completa:
${input.conversation.map((message) => `${message.role}: ${message.content}`).join("\n")}

Genera el plan del turno ahora.`;

  return {
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.3,
    // Same reasoning-token budget caveat as the answer prompt: truncation here
    // silently degrades the turn to the deterministic fallback plan, and the
    // full budget is reserved against the per-minute quota even when unused.
    // Measured plans land near 700 tokens including reasoning.
    maxOutputTokens: 1200,
  };
}
