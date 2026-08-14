import type { AnswerBlock } from "@/server/ai/schemas";
import type { RetrievedChunk } from "@/server/rag/types";

const MIN_INFORMATIVE_TERMS = 2;
const MIN_TERM_COVERAGE = 0.42;

const SPANISH_STOP_WORDS = new Set([
  "ademas", "algo", "algun", "alguna", "algunas", "algunos", "ante", "aquel",
  "aqui", "cada", "como", "con", "contra", "cual", "cuando", "desde", "donde",
  "durante", "esta", "estas", "este", "estos", "hacia", "hasta", "para", "pero",
  "porque", "puede", "pueden", "segun", "sobre", "tambien", "tiene", "tienen",
  "toda", "todas", "todo", "todos", "entre", "otra", "otras", "otro", "otros",
  "mismo", "misma", "mismos", "mismas", "caso", "norma", "legal", "ley",
]);

export interface ClaimSupportResult {
  supported: boolean;
  coverage: number;
  missingAnchors: string[];
  overlappingTerms: string[];
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\*\*/g, "")
    .toLowerCase();
}

function stem(token: string): string {
  if (/^\d/.test(token)) return token;
  if (token.length > 7 && token.endsWith("mente")) return token.slice(0, -5);
  if (token.length > 6 && token.endsWith("es")) return token.slice(0, -2);
  if (token.length > 5 && token.endsWith("s")) return token.slice(0, -1);
  return token;
}

function informativeTerms(value: string): Set<string> {
  const tokens = normalize(value).match(/[a-z0-9]+/g) ?? [];
  return new Set(
    tokens
      .filter((token) => token.length >= 4 && !SPANISH_STOP_WORDS.has(token))
      .map(stem),
  );
}

function factualAnchors(value: string): Set<string> {
  const anchors = normalize(value).match(/\b\d+(?:[.,]\d+)?(?:\s*%)?\b/g) ?? [];
  return new Set(anchors.map((anchor) => anchor.replace(/\s+/g, "")));
}

export function evaluateClaimSupport(claim: string, evidence: string): ClaimSupportResult {
  const claimTerms = informativeTerms(claim);
  const evidenceTerms = informativeTerms(evidence);
  const overlappingTerms = [...claimTerms].filter((term) => evidenceTerms.has(term));
  const coverage = claimTerms.size === 0 ? 0 : overlappingTerms.length / claimTerms.size;
  const evidenceAnchors = factualAnchors(evidence);
  const missingAnchors = [...factualAnchors(claim)].filter(
    (anchor) => !evidenceAnchors.has(anchor),
  );

  return {
    supported:
      missingAnchors.length === 0 &&
      overlappingTerms.length >= MIN_INFORMATIVE_TERMS &&
      coverage >= MIN_TERM_COVERAGE,
    coverage,
    missingAnchors,
    overlappingTerms,
  };
}

export function validateLegalBlockSupport(
  block: AnswerBlock,
  chunksById: ReadonlyMap<string, RetrievedChunk>,
): ClaimSupportResult {
  const evidence = block.citationIds
    .map((id) => chunksById.get(id)?.text ?? "")
    .filter(Boolean)
    .join("\n");
  return evaluateClaimSupport(block.text, evidence);
}
