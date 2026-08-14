# Specification: recruiter-ready grounded preview

Status: approved by human owner
Risk: high

## Problem

Defensor builds and its structural tests pass, but the current evidence gate can
accept a top-ranked chunk without proving that it is relevant to the classified
topic or that each generated legal claim is supported by its cited passage. The
general evaluation runner also has no measured-success path. No Vercel preview
or deployment environment is configured.

## Intended outcome

Ship a recruiter-testable Vercel preview that can answer only when official
retrieved evidence passes deterministic relevance, claim-support, and citation
metadata gates. Unsupported answers must become safe abstentions.

## Scope

- Deterministic retrieval relevance checks using channel scores and corpus
  metadata.
- Per-legal-block claim-to-passage validation, including factual anchors.
- A project-owned deterministic claim-support evaluation dataset and CI gate.
- Hosted PostgreSQL/pgvector verification, migrations, and corpus ingestion.
- Existing Groq LLM and Jina embedding adapters, if live verification succeeds.
- Vercel project linking, preview-scoped environment variables, preview deploy,
  runtime logs, and browser/API smoke tests.
- Deployment documentation and rollback instructions.

## Non-scope

- Certified legal correctness or comprehensive Peruvian labor-law coverage.
- Authentication, persistent conversations, uploads, payments, calculators, or
  other V1 exclusions.
- Production promotion, custom domain, automatic merge, or destructive data
  migration.
- New AI orchestration frameworks or provider-specific application rewrites.
- Treating a free provider tier as an availability guarantee.

## Acceptance criteria

1. Evidence from an unrelated topic or regime cannot authorize an answer.
2. Semantic-only evidence below the approved similarity threshold is rejected.
3. Every legal answer block is checked only against the chunks it cites.
4. Unsupported factual anchors such as amounts, percentages, dates, or article
   numbers cause citation validation to fail closed.
5. Irrelevant and adversarial citations are rejected by deterministic tests.
6. A focused claim-support evaluation reports measured results and exits nonzero
   if any required case fails; the incomplete full evaluation remains blocked.
7. The hosted database has pgvector(1024), all migrations, and the validated
   13-source/396-chunk corpus with embeddings.
8. Preview secrets are configured without printing or committing values.
9. Lint, typecheck, unit tests, corpus validation, security scan, build, focused
   AI gate, and critical E2E/smoke checks pass.
10. The Vercel preview renders, `/api/health` responds, a supported query either
    returns grounded citations or safely abstains, and an out-of-scope query
    abstains.
11. Runtime failures and rollback/recovery steps are documented.
12. Production promotion remains a separate human decision.

## Release posture

The output is a public preview candidate for portfolio inspection, not a claim
that Defensor is production-ready or legally certified.
