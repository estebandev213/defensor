# Specification: Fail-closed AI evaluation gate

Status: approved
Risk: medium

## Problem

The evaluation CLI writes a `blocked_no_corpus` report with `gates.ready: false`
but exits successfully. CI therefore treats an evaluation that did not run as
passing evidence.

## Intended outcome

Evaluation command success must mean that a valid evaluation was measured and
every represented gate passed.

## Behavioral contract

- Exit `0` only when `status` is `measured` and `gates.ready` is `true`.
- Exit non-zero for `blocked_no_corpus`.
- Exit non-zero for measured but unready or failed results.
- Exit non-zero for invalid input, exceptions, and artifact-write failures.
- Write honest blocked artifacts before returning the blocked exit status.
- Preserve null values for metrics that were not measured.
- Do not fabricate a passing report.

## Scope

- Evaluation exit policy and CLI wiring.
- Evaluation tests strictly needed to prove the policy.
- Temporary removal of the unavailable unconditional AI evaluation from CI.

## Non-scope

- Claim-Support Gate implementation.
- Retrieval, prompts, providers, database, corpus ingestion, UI, or chat behavior.
- LangGraph or new dependencies.
- Golden-dataset redesign or evaluation thresholds.

## Acceptance criteria

1. `blocked_no_corpus` produces a non-zero command exit.
2. A measured but unready result produces a non-zero exit.
3. Only a measured and ready result maps to exit `0`.
4. Blocked reports retain their status, reasons, and null metrics.
5. Exceptions remain non-zero.
6. CI cannot represent the unavailable runner as passing AI-quality evidence.
7. Exit-policy regression tests remain in the normal `pnpm test` suite.
8. Non-AI commands and runtime product behavior remain unchanged.
9. Tests contain no network, provider, database, or production-secret access.

## CI posture

The runner has no measured-success path, so `pnpm eval` is temporarily removed
from unconditional CI. Blocked and unready reports fail closed, and the normal
test suite verifies that exit policy. AI evaluation will return as a required CI
gate when the Claim-Support pilot supplies a valid measured path.

## Evidence

- Focused unit tests for all exit-policy branches.
- Direct `pnpm eval` invocation with its non-zero exit code captured.
- Inspection of the generated blocked report.
- Lint, typecheck, unit tests, corpus validation, security scan, and build.
- CI and independent-review evidence before merge.

## Limitations

This change validates gate mechanics only. It does not make the current dataset
or runner a valid claim-support quality evaluation.
