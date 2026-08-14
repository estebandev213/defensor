# Plan: recruiter-ready grounded preview

Status: active
Specification: `../../specs/launch-preview.md`
Risk: high

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
