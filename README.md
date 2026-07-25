# Defensor

Defensor is a Spanish-language web foundation for clear, cautious guidance on Peruvian labor questions. The product is designed to answer from official legal sources, show verifiable citations, and abstain when the available evidence is not sufficient.

The current branch contains Phase 1 - Foundation and the beginning of Phase 2 - Data. It is a production-minded shell and data foundation, not yet a connected legal assistant.

## Current scope

- Next.js App Router with strict TypeScript and the `src/` layout.
- Mobile-first landing and consultation shell.
- V1 sidebar with new conversation, supported topic shortcuts, disclaimer, and light/dark theme.
- Empty sources panel with no invented legal content.
- Zod environment validation, safe logging, error boundaries, and `GET /api/health`.
- Vitest unit tests and Playwright smoke-test configuration.
- Versioned PostgreSQL/Supabase migration for legal sources, documents, chunks, and feedback.
- Typed legal catalog repository, corpus schema validation, and reproducible ingestion commands.

Not included yet: a configured database, populated legal corpus, LLM providers, embeddings, retrieval, streaming chat, authentication, persistent history, favorites, calculators, profiles, payments, or document uploads.

## Architecture

```text
Next.js App Router
|- src/app          routes, layout, metadata, boundaries, and healthcheck
|- src/components   accessible shell and reusable UI components
|- src/server       validated configuration, security, legal contracts, and repositories
|- src/db           typed records, migrations, and database client
|- scripts           database checks and reproducible corpus validation
|- src/lib          shared utilities
`- src/styles       design tokens and global styles
```

The foundation keeps provider and legal-domain work out of the UI so later phases can add data, retrieval, safety gates, citation validation, and streaming without rewriting the shell.

## Requirements

- Node.js 20+
- pnpm 10+

The project pins `pnpm@10.12.4` through `packageManager`.

## Local development

```bash
pnpm install
pnpm dev
```

Initial routes:

- `/` - public landing shell.
- `/chat` - consultation shell.
- `/api/health` - process and minimal configuration healthcheck.

Copy `.env.example` to `.env.local` for local configuration. The Foundation runs without external providers.

## Data commands

```bash
pnpm ingest:validate
pnpm ingest:dry
pnpm db:migrate
pnpm db:check
```

The committed seed is intentionally empty until official legal sources are reviewed and ingested. Database commands require `DATABASE_URL`.

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

The logger redacts sensitive keys and user-content fields. This phase does not send prompts to analytics or persist conversations. Do not share DNI, addresses, phone numbers, full names, or confidential documents.

Defensor is not a law firm, does not represent the user, and does not replace professional advice. Future legal answers must rely on recovered evidence and must abstain when reliable support is unavailable.

## Roadmap

The next gated phase is Phase 3 - Retrieval: add lexical/vector search and ranking only after the legal corpus and Data gates are approved.
