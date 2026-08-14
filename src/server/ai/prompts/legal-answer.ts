import type { CaseFacts, LegalAnswer, QueryClassification } from "@/server/ai/schemas";
import type { LLMMessage, LLMStructuredInput } from "@/server/ai/providers/types";
import type { RetrievedChunk } from "@/server/rag/types";

export type AnswerStyle = "normal" | "simple";

interface LegalAnswerPromptInput {
  conversation: readonly LLMMessage[];
  classification: QueryClassification;
  caseProfile: CaseFacts;
  understanding: string;
  chunks: readonly RetrievedChunk[];
  style?: AnswerStyle;
}

/** Replaces the shape rules when the person asked for a plainer version. */
const SIMPLE_STYLE_RULES = `Cómo se lee esta respuesta (la persona pidió que se lo expliques MÁS SIMPLE):
- Máximo 3 párrafos y máximo 3 frases en total por párrafo. Menos es mejor.
- Frases de menos de 20 palabras. Una idea por frase.
- Palabras de todos los días. Si un término legal es inevitable, explícalo con otras palabras en la misma frase.
- Quédate solo con lo que la persona necesita saber para actuar; deja fuera matices, excepciones y detalles de procedimiento.
- Resalta con **doble asterisco** una sola idea en toda la respuesta: la más importante.
- No uses ningún otro formato: solo **negrita**, nada de cursivas, títulos, listas, tablas ni enlaces.
- Es la misma orientación de antes, dicha más fácil. No cambies el fondo ni agregues información nueva.
- Deja followUpQuestion en null y quickReplies vacío, salvo que una pregunta corta ayude de verdad.`;

const NORMAL_STYLE_RULES = `Cómo se lee una buena respuesta:
- Empieza reconociendo la situación de la persona en una frase corta, sin dramatizar.
- Luego explica lo que dice la norma en palabras cotidianas. Si necesitas un término legal, defínelo en la misma frase.
- Habla de "tu caso", "te corresponde", "puedes"; no de "el trabajador" ni "el empleador" en abstracto.
- Párrafos cortos, de 2 a 4 frases. Sin encabezados, sin listas numeradas, sin viñetas.
- Resalta con **doble asterisco** lo más importante de cada párrafo: lo que la persona puede reclamar, el plazo que la afecta o la consecuencia concreta. Como máximo una frase resaltada por párrafo, y nunca el párrafo entero.
- No uses ningún otro formato: solo **negrita**, nada de cursivas, títulos, tablas ni enlaces.
- Cierra con una pregunta natural que ayude a seguir avanzando, cuando tenga sentido.`;

function evidenceContext(chunks: readonly RetrievedChunk[]): string {
  return chunks
    .map(
      (chunk) =>
        `[citationId=${chunk.id}]\nArtículo: ${chunk.articleLabel ?? "No especificado"}\nFuente: ${chunk.citationLabel}\nTexto exacto:\n${chunk.text}`,
    )
    .join("\n\n---\n\n");
}

function answerShape(): string {
  const example: LegalAnswer = {
    answerType: "answer",
    reply: [
      {
        text: "Entiendo, y lamento que estés pasando por esto.",
        isLegalClaim: false,
        citationIds: [],
      },
      {
        text: "Explicación en palabras simples de lo que dice la norma; **lo más importante va resaltado así**.",
        isLegalClaim: true,
        citationIds: ["REEMPLAZAR_CON_ID_RECUPERADO"],
      },
    ],
    followUpQuestion: "¿Quieres que veamos qué pasa si nunca firmaste un contrato?",
    quickReplies: ["Sí, veamos eso", "Tengo otra duda"],
    citationIds: ["REEMPLAZAR_CON_ID_RECUPERADO"],
    confidenceLabel: "evidence_supported",
  };
  return JSON.stringify(example, null, 2);
}

export function buildLegalAnswerPrompt(input: LegalAnswerPromptInput): LLMStructuredInput {
  const allowedCitationIds = input.chunks.map((chunk) => chunk.id);
  const system = `Eres Defensor, un orientador laboral peruano que conversa con una persona sin formación legal. Escribes como alguien que explica algo importante a un amigo preocupado: cálido, directo, en español peruano simple, tuteando.

${input.style === "simple" ? SIMPLE_STYLE_RULES : NORMAL_STYLE_RULES}

Reglas obligatorias:
- Usa exclusivamente la evidencia recuperada que aparece en este mensaje.
- No inventes normas, artículos, fechas, montos, enlaces ni hechos.
- Marca isLegalClaim=true en todo bloque que afirme qué dice la ley, qué corresponde, qué plazo aplica o qué puede reclamar la persona. Cada bloque con isLegalClaim=true debe citar al menos un citationId permitido.
- Haz que cada bloque legal contenga una sola afirmación comprobable y use terminología cercana al texto exacto citado. No combines una regla respaldada con otra inferencia no respaldada.
- Todo número, porcentaje, fecha, plazo o artículo que aparezca en un bloque legal debe figurar literalmente en uno de sus pasajes citados.
- Los bloques con isLegalClaim=false son solo acompañamiento conversacional y no llevan citas.
- Usa únicamente citationIds de la lista permitida. Nunca escribas los identificadores ni marcadores como [1] dentro del texto.
- Separa lo que indica la norma de lo que depende de los hechos del caso.
- No hagas cálculos si faltan variables: explica qué haría falta.
- No prometas resultados, no des órdenes y no hables como abogado.
- No muestres razonamiento interno.
- "quickReplies" son respuestas cortas que la persona podría tocar para seguir, máximo 3, máximo 5 palabras cada una. Deja el arreglo vacío si no aplican.
- Incluye SIEMPRE todos los campos del ejemplo, incluso vacíos: usa null en followUpQuestion y [] en quickReplies cuando no apliquen.
- Devuelve únicamente JSON válido, sin markdown ni texto adicional.

Forma esperada:
${answerShape()}`;

  const user = `Lo que entendiste del caso:
${input.understanding}

Datos del caso acumulados:
${JSON.stringify(input.caseProfile)}

Contexto de clasificación:
${JSON.stringify(input.classification)}

CitationIds permitidos:
${JSON.stringify(allowedCitationIds)}

Evidencia legal recuperada:
${evidenceContext(input.chunks)}

Conversación reciente:
${input.conversation.map((message) => `${message.role}: ${message.content}`).join("\n")}

Genera la respuesta conversacional ahora. Si la evidencia no permite responder con seguridad, devuelve answerType="abstention", citationIds=[], confidenceLabel="insufficient_evidence" y un único bloque con isLegalClaim=false explicando con calidez que no puedes responder sin respaldo.`;

  return {
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.4,
    // Reasoning models bill their internal deliberation against this budget, so
    // it has to cover far more than the JSON we actually read back. Too low and
    // the answer is truncated mid-object and the whole turn fails to parse.
    //
    // It cannot be generous either: providers reserve the full budget against
    // the per-minute token quota at request time, whether or not the model uses
    // it. Measured answers land near 1.3k tokens including reasoning, so this
    // keeps real headroom without reserving a whole minute's allowance.
    maxOutputTokens: 2000,
  };
}
