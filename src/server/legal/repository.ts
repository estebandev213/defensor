import type { LegalChunk, LegalDocument, LegalSource } from "@/db/types";
import type { DatabaseClient } from "@/db/client";
import type { EmbeddingProvider } from "@/server/rag/providers";
import { deduplicateChunks, diversifyChunks } from "@/server/rag/deduplicate";
import { fuseRankedResults } from "@/server/rag/rrf";
import type { HybridSearchInput, RankedRetrievedChunk, RetrievedChunk } from "@/server/rag/types";
import { toPgVectorLiteral } from "@/server/rag/vector";

interface SourceRow {
  id: string;
  title: string;
  norm_type: string;
  norm_number: string | null;
  official_publisher: string;
  official_url: string;
  source_domain: string;
  publication_date: string | null;
  effective_from: string | null;
  effective_to: string | null;
  status: LegalSource["status"];
  retrieved_at: string;
  content_hash: string;
  metadata: Record<string, unknown>;
}

interface DocumentRow {
  id: string;
  source_id: string;
  version: string;
  raw_text: string;
  normalized_text: string;
  language: string;
  legal_regime: string[];
  topics: string[];
  parser_version: string;
  created_at: string;
}

interface ChunkRow {
  id: string;
  document_id: string;
  source_id: string;
  chunk_index: number;
  article_label: string | null;
  article_number: string | null;
  subsection: string | null;
  heading_path: string[];
  exact_text: string;
  normalized_text: string;
  citation_label: string;
  anchor: string | null;
  legal_regime: string[];
  topics: string[];
  effective_from: string | null;
  effective_to: string | null;
  status: LegalChunk["status"];
  token_count: number | null;
  metadata: Record<string, unknown>;
}

interface RetrievalRow extends ChunkRow {
  official_url: string;
  semantic_score: number | null;
  lexical_score: number | null;
}

export interface LegalCatalogRepository {
  getSourceById(id: string): Promise<LegalSource | null>;
  getDocumentById(id: string): Promise<LegalDocument | null>;
  getChunksByIds(ids: readonly string[]): Promise<LegalChunk[]>;
}

export interface LegalRepository extends LegalCatalogRepository {
  hybridSearch(input: HybridSearchInput): Promise<RetrievedChunk[]>;
}

function toSource(row: SourceRow): LegalSource {
  return {
    id: row.id,
    title: row.title,
    normType: row.norm_type,
    normNumber: row.norm_number ?? undefined,
    officialPublisher: row.official_publisher,
    officialUrl: row.official_url,
    sourceDomain: row.source_domain,
    publicationDate: row.publication_date ?? undefined,
    effectiveFrom: row.effective_from ?? undefined,
    effectiveTo: row.effective_to ?? undefined,
    status: row.status,
    retrievedAt: row.retrieved_at,
    contentHash: row.content_hash,
    metadata: row.metadata,
  };
}

function toDocument(row: DocumentRow): LegalDocument {
  return {
    id: row.id,
    sourceId: row.source_id,
    version: row.version,
    rawText: row.raw_text,
    normalizedText: row.normalized_text,
    language: row.language,
    legalRegime: row.legal_regime,
    topics: row.topics,
    parserVersion: row.parser_version,
    createdAt: row.created_at,
  };
}

function toChunk(row: ChunkRow): LegalChunk {
  return {
    id: row.id,
    documentId: row.document_id,
    sourceId: row.source_id,
    chunkIndex: row.chunk_index,
    articleLabel: row.article_label ?? undefined,
    articleNumber: row.article_number ?? undefined,
    subsection: row.subsection ?? undefined,
    headingPath: row.heading_path,
    exactText: row.exact_text,
    normalizedText: row.normalized_text,
    citationLabel: row.citation_label,
    anchor: row.anchor ?? undefined,
    legalRegime: row.legal_regime,
    topics: row.topics,
    effectiveFrom: row.effective_from ?? undefined,
    effectiveTo: row.effective_to ?? undefined,
    status: row.status,
    tokenCount: row.token_count ?? undefined,
    metadata: row.metadata,
  };
}

function toRetrievedChunk(row: RetrievalRow): RetrievedChunk {
  return {
    id: row.id,
    sourceId: row.source_id,
    text: row.exact_text,
    articleLabel: row.article_label ?? undefined,
    citationLabel: row.citation_label,
    officialUrl: row.official_url,
    semanticScore: row.semantic_score ?? undefined,
    lexicalScore: row.lexical_score ?? undefined,
    fusionScore: 0,
    status: row.status,
    effectiveFrom: row.effective_from ?? undefined,
    effectiveTo: row.effective_to ?? undefined,
    legalRegime: row.legal_regime,
    topics: row.topics,
  };
}

export class PostgresLegalCatalogRepository implements LegalRepository {
  public constructor(
    private readonly db: DatabaseClient,
    private readonly embeddingProvider?: EmbeddingProvider,
  ) {}

  public async getSourceById(id: string): Promise<LegalSource | null> {
    const rows = await this.db<SourceRow[]>`
      select id, title, norm_type, norm_number, official_publisher, official_url,
        source_domain, publication_date, effective_from, effective_to, status,
        retrieved_at, content_hash, metadata
      from legal_sources
      where id = ${id}::uuid
      limit 1
    `;
    return rows[0] ? toSource(rows[0]) : null;
  }

  public async getDocumentById(id: string): Promise<LegalDocument | null> {
    const rows = await this.db<DocumentRow[]>`
      select id, source_id, version, raw_text, normalized_text, language,
        legal_regime, topics, parser_version, created_at
      from legal_documents
      where id = ${id}::uuid
      limit 1
    `;
    return rows[0] ? toDocument(rows[0]) : null;
  }

  public async getChunksByIds(ids: readonly string[]): Promise<LegalChunk[]> {
    if (ids.length === 0) return [];
    const rows = await this.db<ChunkRow[]>`
      select id, document_id, source_id, chunk_index, article_label, article_number,
        subsection, heading_path, exact_text, normalized_text, citation_label, anchor,
        legal_regime, topics, effective_from, effective_to, status, token_count, metadata
      from legal_chunks
      where id = any(${this.db.array([...ids])}::uuid[])
      order by chunk_index asc
    `;
    return rows.map(toChunk);
  }

  public async hybridSearch(input: HybridSearchInput): Promise<RetrievedChunk[]> {
    if (input.query.trim().length === 0) return [];
    const [lexicalRows, semanticRows] = await Promise.all([
      this.searchLexically(input),
      this.searchSemantically(input),
    ]);
    const lexicalResults = lexicalRows.map((row, index): RankedRetrievedChunk => ({
      chunk: toRetrievedChunk(row),
      rank: index + 1,
      channel: "lexical",
    }));
    const semanticResults = semanticRows.map((row, index): RankedRetrievedChunk => ({
      chunk: toRetrievedChunk(row),
      rank: index + 1,
      channel: "semantic",
    }));
    const fused = fuseRankedResults(semanticResults, lexicalResults, input.finalLimit);
    return diversifyChunks(deduplicateChunks(fused), input.finalLimit);
  }

  private async searchLexically(input: HybridSearchInput): Promise<RetrievalRow[]> {
    const topics = this.db.array(input.topics ?? []);
    const effectiveAt = input.effectiveAt ?? null;
    const legalRegime = input.legalRegime ?? null;
    return this.db<RetrievalRow[]>`
      select c.id, c.document_id, c.source_id, c.chunk_index, c.article_label, c.article_number,
        c.subsection, c.heading_path, c.exact_text, c.normalized_text, c.citation_label, c.anchor,
        c.legal_regime, c.topics, c.effective_from, c.effective_to, c.status, c.token_count, c.metadata,
        s.official_url, null::double precision as semantic_score,
        ts_rank_cd(c.search_vector, websearch_to_tsquery('spanish', ${input.query})) as lexical_score
      from legal_chunks c
      join legal_sources s on s.id = c.source_id
      where c.search_vector @@ websearch_to_tsquery('spanish', ${input.query})
        and c.status in ('vigente', 'modificada')
        and (${legalRegime}::text is null or ${legalRegime} = any(c.legal_regime))
        and (cardinality(${topics}::text[]) = 0 or c.topics && ${topics}::text[])
        and (${effectiveAt}::date is null or c.effective_from is null or c.effective_from <= ${effectiveAt}::date)
        and (${effectiveAt}::date is null or c.effective_to is null or c.effective_to >= ${effectiveAt}::date)
      order by lexical_score desc, c.id asc
      limit ${input.lexicalLimit}
    `;
  }

  private async searchSemantically(input: HybridSearchInput): Promise<RetrievalRow[]> {
    if (!this.embeddingProvider) return [];
    const embedding = await this.embeddingProvider.embedQuery(input.query);
    const vectorLiteral = toPgVectorLiteral(embedding);
    const topics = this.db.array(input.topics ?? []);
    const effectiveAt = input.effectiveAt ?? null;
    const legalRegime = input.legalRegime ?? null;
    return this.db<RetrievalRow[]>`
      select c.id, c.document_id, c.source_id, c.chunk_index, c.article_label, c.article_number,
        c.subsection, c.heading_path, c.exact_text, c.normalized_text, c.citation_label, c.anchor,
        c.legal_regime, c.topics, c.effective_from, c.effective_to, c.status, c.token_count, c.metadata,
        s.official_url, 1 - (c.embedding <=> ${vectorLiteral}::vector) as semantic_score,
        null::double precision as lexical_score
      from legal_chunks c
      join legal_sources s on s.id = c.source_id
      where c.embedding is not null
        and c.status in ('vigente', 'modificada')
        and (${legalRegime}::text is null or ${legalRegime} = any(c.legal_regime))
        and (cardinality(${topics}::text[]) = 0 or c.topics && ${topics}::text[])
        and (${effectiveAt}::date is null or c.effective_from is null or c.effective_from <= ${effectiveAt}::date)
        and (${effectiveAt}::date is null or c.effective_to is null or c.effective_to >= ${effectiveAt}::date)
      order by c.embedding <=> ${vectorLiteral}::vector, c.id asc
      limit ${input.semanticLimit}
    `;
  }
}
