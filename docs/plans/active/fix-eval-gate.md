# Plan: Fix the AI evaluation exit gate

Status: active
Specification: `../../specs/fix-eval-gate.md`
Risk: medium

## Constraints

- Work only on the approved `chore/fix-eval-gate` branch.
- No network, provider, database, retrieval, prompt, UI, or runtime changes.
- No new dependencies.
- No Claim-Support Gate implementation.
- Keep this plan under `active/` until the pull request is approved and merged.
- Stop if the approved scope, CI posture, or acceptance criteria change.

## Steps

1. Record the approved specification and this execution plan.
2. Add a pure fail-closed evaluation exit-policy function.
3. Apply it in the evaluation CLI after report generation and logging.
4. Add blocked, measured-but-unready, and measured-and-ready policy tests.
5. Temporarily remove the unavailable unconditional eval step from CI and
   document when it must return.
6. Run focused verification.
7. Run the applicable repository verification suite.
8. Prove the current blocked CLI invocation exits non-zero and inspect its report.
9. Update ignored local AIEOS status files with verified current state.
10. Inspect the tracked diff and working-tree status.
11. Obtain fresh-context technical/adversarial review and complete the
    medium-risk Teacher gate before merge.

## Files

- `docs/specs/fix-eval-gate.md`
- `docs/plans/active/fix-eval-gate.md`
- `src/server/evaluation/runner.ts`
- `scripts/evaluate/run.ts`
- `tests/evaluation.test.ts`
- `.github/workflows/ci.yml`

Ignored local-only status updates after verification:

- `aieos.yaml`
- `.aieos/project-profile.md`
- `.aieos/technology-registry.md`

## Tests and evidence

- Unit tests for all exit-policy branches.
- Direct blocked CLI exit-code assertion.
- Blocked artifact status and readiness inspection.
- Lint, typecheck, full unit tests, corpus validation, security scan, and build.
- CI results and independent review.

## Stop conditions

- A passing state would require invented metrics or Claim-Support behavior.
- The implementation requires corpus, provider, database, or golden-data changes.
- A required verification failure reveals a material issue outside approved scope.

## Recovery

Revert the isolated tracked changes. No database, external service, runtime data,
deployment, or irreversible state is involved. Ignored local status text can be
restored independently from the implementation.

## Completion checklist

- [x] Acceptance criteria have executable local evidence.
- [x] Required local checks pass.
- [x] Direct blocked-exit proof records a non-zero exit.
- [x] Tracked diff stays within approved scope.
- [ ] Independent review has no unresolved blocker.
- [ ] Teacher gate is complete.
- [ ] Pull request is approved and merged.
- [ ] Plan is moved to `docs/plans/completed/` in a later approved change.
