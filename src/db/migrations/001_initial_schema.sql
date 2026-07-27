create extension if not exists pgcrypto;
create extension if not exists vector;

create table if not exists schema_migrations (
  id text primary key,
  applied_at timestamptz not null default now()
);

create table if not exists legal_sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  norm_type text not null,
  norm_number text,
  official_publisher text not null,
  official_url text not null,
  source_domain text not null,
  publication_date date,
  effective_from date,
  effective_to date,
  status text not null check (status in ('vigente', 'modificada', 'derogada', 'desconocida')),
  retrieved_at timestamptz not null default now(),
  content_hash text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_hash)
);

create table if not exists legal_documents (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references legal_sources(id) on delete cascade,
  version text not null,
  raw_text text not null,
  normalized_text text not null,
  language text not null default 'es',
  legal_regime text[] not null default '{}',
  topics text[] not null default '{}',
  parser_version text not null,
  created_at timestamptz not null default now(),
  unique (source_id, version)
);

create table if not exists legal_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references legal_documents(id) on delete cascade,
  source_id uuid not null references legal_sources(id) on delete cascade,
  chunk_index integer not null check (chunk_index >= 0),
  article_label text,
  article_number text,
  subsection text,
  heading_path text[] not null default '{}',
  exact_text text not null,
  normalized_text text not null,
  citation_label text not null,
  anchor text,
  legal_regime text[] not null default '{}',
  topics text[] not null default '{}',
  effective_from date,
  effective_to date,
  status text not null check (status in ('vigente', 'modificada', 'derogada', 'desconocida')),
  token_count integer check (token_count is null or token_count > 0),
  embedding vector(1024),
  search_vector tsvector generated always as (to_tsvector('spanish', normalized_text)) stored,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create table if not exists feedback_events (
  id uuid primary key default gen_random_uuid(),
  session_id_hash text not null,
  answer_id uuid not null,
  rating text not null check (rating in ('helpful', 'not_helpful')),
  reason_code text,
  safe_comment text,
  created_at timestamptz not null default now()
);

create index if not exists legal_sources_status_idx on legal_sources (status);
create index if not exists legal_documents_source_idx on legal_documents (source_id);
create index if not exists legal_chunks_embedding_idx on legal_chunks using hnsw (embedding vector_cosine_ops);
create index if not exists legal_chunks_search_idx on legal_chunks using gin (search_vector);
create index if not exists legal_chunks_topics_idx on legal_chunks using gin (topics);
create index if not exists legal_chunks_regime_idx on legal_chunks using gin (legal_regime);
create index if not exists feedback_events_answer_idx on feedback_events (answer_id);

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists legal_sources_set_updated_at on legal_sources;
create trigger legal_sources_set_updated_at
before update on legal_sources
for each row execute function set_updated_at();
