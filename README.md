# Defensor

Defensor is a Spanish-language web foundation for clear, cautious guidance on Peruvian labor questions. The product is designed to answer from official legal sources, show verifiable citations, and abstain when the available evidence is not sufficient.

## Production-first standard

Defensor is a production-targeted product, not a development demo or disposable prototype. Development environments and local commands exist only to validate behavior that is intended for production. Every change must meet production standards for correctness, security, privacy, observability, accessibility, failure handling, testing, and deployment readiness.

Incomplete integrations, placeholder legal content, fake metrics, decorative flows, and development-only shortcuts are not acceptable as product behavior. Any remaining gap must be explicit, tested where possible, and treated as a release blocker until it is resolved.

The current branch contains the Foundation, Data, Retrieval, Safety pipeline, Chat UI, public SEO, Evaluation, and production-hardening phases. Provider adapters are connected for Groq/OpenAI-compatible chat generation and Jina/OpenAI-compatible embeddings; production use still requires valid credentials, a populated official corpus, and evaluation gates.

## Current scope

- Next.js App Router with strict TypeScript and the `src/` layout.
- Mobile-first landing and consultation shell.
- V1 sidebar with new conversation, supported topic shortcuts, disclaimer, and light/dark theme.
- Empty sources panel with no invented legal content.
- Zod environment validation, safe logging, error boundaries, and `GET /api/health`.
- Vitest unit tests and Playwright smoke-test configuration.
- Versioned PostgreSQL/Supabase migration for legal sources, documents, chunks, and feedback.
- Typed legal catalog repository, corpus schema validation, and reproducible ingestion commands.
- Hybrid lexical/vector retrieval contracts with Reciprocal Rank Fusion, filters, deduplication, diversity, and a debug CLI.
- Deterministic query classification, clarification gate, evidence gate, structured legal-answer schema, abstention responses, and source-backed citation validation.
- Temporary in-browser chat state with high-level processing states, SSE response transport, safe clarification/abstention rendering, feedback controls, accessible source drawer, and no conversation persistence.
- Public landing, methodology, sources, labor-topic, privacy, and terms pages with canonical metadata, sitemap, robots rules, and JSON-LD on the landing and process pages.
- Versioned 80-case golden evaluation dataset, retrieval/generation/product metric functions, and blocked-state reports that keep unmeasured values null until a corpus and predictions exist.
- Production safeguards: hashed in-memory rate limits, request timeouts and abort handling, security headers, PII-redacted logs, bounded safe telemetry, provider fallback contracts, corpus export, secret scanning, and GitHub Actions checks.

Not included yet: a configured production database with embedded legal chunks, authentication, persistent history, favorites, calculators, profiles, payments, or document uploads.

## Architecture

```text
Next.js App Router
|- src/app          routes, layout, metadata, boundaries, and healthcheck
|- src/components   accessible shell and reusable UI components
|- src/server       validated configuration, security, legal contracts, retrieval, safety gates, and API routes
|- src/features     temporary chat state and response transport contracts
|- src/db           typed records, migrations, and database client
|- scripts           database checks and reproducible corpus validation
|- src/lib          shared utilities
`- src/styles       design tokens and global styles
```

The foundation keeps provider and legal-domain work out of the UI. The current chat transport returns only deterministic clarification or abstention states until a real corpus and LLM provider are configured; it never fabricates a legal answer.

## Requirements

- Node.js 20+
- pnpm 10+

The project pins `pnpm@10.12.4` through `packageManager`.

## Local setup for production-targeted work

```bash
pnpm install
pnpm dev
```

Initial routes:

- `/` - public landing page.
- `/chat` - consultation shell.
- `/como-funciona` - product and safety process.
- `/metodologia` - evidence and citation methodology.
- `/fuentes` - public source-catalog status.
- `/#temas-principales` - landing section that indexes the supported topics (`/derechos-laborales` redirects here).
- `/privacidad` and `/terminos` - V1 privacy and scope notices.
- `/sitemap.xml` and `/robots.txt` - technical SEO routes.
- `/api/health` - process and minimal configuration healthcheck.
- `POST /api/feedback` - validates and stores sanitized usefulness feedback without conversation text.
- `GET /api/sources/[id]` - returns public metadata for an official legal source.

Copy `.env.example` to `.env.local` for local configuration. The application still runs in safe clarification/abstention mode without external providers. When a corpus is configured, the chat route uses the configured embedding provider for semantic retrieval and the configured LLM provider for structured answer generation before citation validation.

## Data commands

```bash
pnpm ingest:pdf
pnpm ingest:validate
pnpm ingest:dry
pnpm ingest
pnpm db:migrate
pnpm db:check
pnpm eval
pnpm corpus:export
pnpm security:scan
```

`pnpm ingest:pdf` reads the reviewed catalog in `data/legal/corpus-legal-defensor-v1.json` and PDFs in `data/legal/raw/`, then deterministically writes the text seed to `data/legal/corpus.seed.json`. It requires Python with `pypdf` installed. The extractor includes only reviewed, recommended, official, current sources with extractable text; it does not call providers or write to the database. Run `pnpm ingest:validate` after regeneration. Database commands require `DATABASE_URL`.

The seed is ready for the next ingestion stage, which must generate embeddings with the configured provider and upsert them into `legal_chunks`. The V1 schema uses 1024 dimensions, matching the default output of `jina-embeddings-v3`; keep `EMBEDDING_DIMENSIONS=1024` for the configured Jina model.

`pnpm ingest` performs that next stage: it checks the database dimension, generates embeddings in batches, and upserts the corpus transactionally. The CLI automatically reads `.env.local` when present; in CI or production, provide the same variables through the process environment. It requires `DATABASE_URL`, `EMBEDDING_API_KEY`, `EMBEDDING_PROVIDER`, and `EMBEDDING_MODEL`.

`pnpm eval` validates `data/evaluation/golden.json` and writes `artifacts/evals/latest.json` and `artifacts/evals/latest.md`. The current report remains blocked until the legal corpus is populated and deterministic predictions or a test provider are connected.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm verify
```

Tests are deterministic and do not call a real LLM. On a new machine, Playwright may require `pnpm exec playwright install`.

## Security and privacy

The logger redacts sensitive keys, user-content fields, email addresses, Peruvian phone numbers, and DNI-like identifiers. This phase does not send prompts to analytics or persist conversations. Rate limiting and telemetry are process-local fallbacks until a shared production provider is configured. Do not share DNI, addresses, phone numbers, full names, or confidential documents.

Defensor is not a law firm, does not represent the user, and does not replace professional advice. Future legal answers must rely on recovered evidence and must abstain when reliable support is unavailable.

## Roadmap

The next gated phase is Phase 9 - launch audit: configure external infrastructure, ingest reviewed official sources, connect providers, and rerun the evaluation gates before public release.
