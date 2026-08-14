# ADR 002: Deterministic grounding gates for the recruiter preview

Status: accepted for preview

## Context

Reciprocal Rank Fusion orders candidates but does not establish relevance, and
metadata-only citation validation cannot prove that a passage supports a legal
claim. A second unconstrained model call would increase cost and would still not
be a deterministic authority.

## Decision

Before generation, require topic/regime compatibility plus usable lexical,
semantic, or dual-channel evidence. After generation, validate every legal block
against only its cited chunks using normalized informative-term coverage and
exact factual-anchor preservation. Unsupported blocks fail closed to the existing
safe abstention path.

Keep this gate provider-independent and cover it with a frozen, deterministic
dataset. Keep the broader retrieval/generation evaluation blocked until the
hosted corpus and real predictions supply honest measurements.

## Alternatives considered

- RRF threshold only: rejected because rank is not semantic support.
- Citation-ID/URL validation only: retained as a necessary metadata gate, but
  insufficient by itself.
- A second LLM judge on every request: deferred because it adds cost, latency,
  provider coupling, and non-deterministic failure modes.
- Exact quotation-only answers: safer but too restrictive for understandable
  conversational guidance.

## Consequences

- Some valid paraphrases may abstain. This is acceptable for the preview because
  false negatives are safer than unsupported legal claims.
- Prompt wording must encourage atomic claims and terminology close to evidence.
- Threshold changes require focused dataset evidence and review.
- This gate is not legal review and must not be presented as certified accuracy.
