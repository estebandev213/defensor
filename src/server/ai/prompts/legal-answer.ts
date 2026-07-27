import type { QueryClassification, LegalAnswer } from "@/server/ai/schemas";
import type { LLMMessage, LLMStructuredInput } from "@/server/ai/providers/types";
import type { RetrievedChunk } from "@/server/rag/types";

interface LegalAnswerPromptInput {
  conversation: readonly LLMMessage[];
  classification: QueryClassification;
  chunks: readonly RetrievedChunk[];
}

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
    title: "Título breve",
    summary: "Resumen claro y prudente.",
    sections: [
      {
        heading: "Qué indica la norma",
        paragraphs: ["Explicación basada únicamente en el contexto recuperado."],
        citationIds: ["REEMPLAZAR_CON_ID_RECUPERADO"],
      },
    ],
    nextSteps: ["Verifica las fechas y documentos de tu caso."],
    warnings: ["Esta orientación no reemplaza asesoría profesional."],
    citationIds: ["REEMPLAZAR_CON_ID_RECUPERADO"],
    confidenceLabel: "evidence_supported",
  };
  return JSON.stringify(example, null, 2);
}

export function buildLegalAnswerPrompt(input: LegalAnswerPromptInput): LLMStructuredInput {
  const allowedCitationIds = input.chunks.map((chunk) => chunk.id);
  const system = `Eres el generador de respuestas de Defensor, un asistente de orientación laboral peruana. Responde en español claro para una persona sin formación legal.

Reglas obligatorias:
- Usa exclusivamente la evidencia recuperada que aparece en este mensaje.
- No inventes normas, artículos, fechas, montos, enlaces ni hechos.
- No muestres razonamiento interno ni chain-of-thought.
- Separa lo que indica la norma de lo que depende de los hechos.
- Usa únicamente citationIds de la lista permitida.
- Cada sección legal debe citar al menos un citationId permitido.
- No hagas cálculos si faltan variables.
- No prometas resultados ni hables como abogado.
- Devuelve únicamente JSON válido, sin markdown ni texto adicional.

Forma esperada:
${answerShape()}`;

  const user = `Contexto de clasificación:
${JSON.stringify(input.classification)}

CitationIds permitidos:
${JSON.stringify(allowedCitationIds)}

Evidencia legal recuperada:
${evidenceContext(input.chunks)}

Conversación reciente:
${input.conversation.map((message) => `${message.role}: ${message.content}`).join("\n")}

Genera la respuesta estructurada ahora. Si la evidencia no permite responder con seguridad, devuelve answerType="abstention", sections=[], citationIds=[] y confidenceLabel="insufficient_evidence".`;

  return {
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0,
    maxOutputTokens: 1800,
  };
}
