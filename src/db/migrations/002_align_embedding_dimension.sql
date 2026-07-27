do $$
declare
  current_embedding_type text;
begin
  select format_type(attribute.atttypid, attribute.atttypmod)
  into current_embedding_type
  from pg_attribute as attribute
  join pg_class as relation on relation.oid = attribute.attrelid
  join pg_namespace as namespace on namespace.oid = relation.relnamespace
  where namespace.nspname = 'public'
    and relation.relname = 'legal_chunks'
    and attribute.attname = 'embedding'
    and not attribute.attisdropped;

  if current_embedding_type = 'vector(1536)' then
    if exists (select 1 from legal_chunks where embedding is not null) then
      raise exception 'Cannot change legal_chunks.embedding from vector(1536) to vector(1024) while embeddings exist; rebuild them first.';
    end if;

    alter table legal_chunks
      alter column embedding type vector(1024);
  elsif current_embedding_type is distinct from 'vector(1024)' then
    raise exception 'Unexpected legal_chunks.embedding type: %', current_embedding_type;
  end if;
end
$$;
