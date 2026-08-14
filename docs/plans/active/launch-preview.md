# Plan: recruiter-ready grounded preview

Status: active
Specification: `../../specs/launch-preview.md`
Risk: high

## Execution status (2026-08-14)

- Steps 1-8 are complete.
- Local quality gates pass: lint, typecheck, 120 unit tests, corpus validation,
  security scan, production build, and the focused claim-support evaluation
  (10/10).
- The general AI evaluation remains blocked by design because its dataset does
  not yet measure successful grounded answers; it is not release evidence.
- The Vercel project is linked and its public URL is
  `https://defensor-lu76.vercel.app`.
- Neon Free is connected with pgvector(1024), both additive migrations, and the
  validated corpus: 13 sources, 13 documents, 396 chunks, 396 embeddings.
- Groq and Jina provider variables are configured in Vercel without committing
  or printing their values. OpenRouter is not required for this candidate.
- Remaining work: generate and verify the fresh Preview deployment, capture
  browser/API/runtime evidence, and hand the final production merge to the
  human owner.

## Constraints

- Work only on `feat/launch-preview`.
- Preserve V1 exclusions and existing provider abstractions.
- Do not expose secret values or production data.
- Use preview-scoped infrastructure and do not promote to production.
- Do not weaken existing tests or make the incomplete full eval look measured.
- Stop before destructive database changes or a production deployment.

## Steps

1. Record the specification, architecture decision, and this plan.
2. Implement retrieval relevance and claim-to-passage support gates.
3. Add focused successful, insufficient, irrelevant, and adversarial cases.
4. Add a measured claim-support CLI/CI gate while preserving the blocked full eval.
5. Run local verification and review the complete diff.
6. Link the Vercel project and verify preview environment key names.
7. Verify the hosted PostgreSQL target, run additive migrations, and ingest the
   validated corpus.
8. Configure preview-scoped provider and application variables.
9. Deploy a Vercel preview and inspect build/runtime logs.
10. Verify browser -> API -> retrieval -> answer/citations and safe abstention.
11. Record evidence, limitations, recovery, and the human production handoff.

## Quality evidence

- Focused unit tests and deterministic claim-support evaluation.
- Lint, typecheck, full tests, corpus validation, security scan, and build.
- Database dimension/count checks and retrieval debug evidence.
- Preview deployment status, runtime error scan, health response, and browser
  screenshots/snapshots.

## Recovery

- Revert the isolated branch for application changes.
- Vercel preview deployments are immutable and can be removed or left unaliased.
- Preview environment variables can be removed without affecting production.
- Database migrations are additive; no rollback that drops ingested legal data
  will be executed automatically.
