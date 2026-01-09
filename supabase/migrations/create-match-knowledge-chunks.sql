-- Migration: Create match_knowledge_chunks function for pgvector search
-- Purpose: Efficient server-side vector similarity search (replaces slow client-side calculation)
-- Created: 2026-01-09
-- Related: PLAN-rag-critical-fix.md, ARCHITECTURE-rag-fix.md

-- Function to search knowledge chunks using pgvector
-- This runs server-side in PostgreSQL, searching ALL chunks efficiently
-- Returns chunks ordered by similarity score (highest first)

CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding vector(1536),
  match_count int DEFAULT 20,
  min_similarity float DEFAULT 0.3
)
RETURNS TABLE (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    kc.id,
    kc.content,
    kc.metadata,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  WHERE 1 - (kc.embedding <=> query_embedding) > min_similarity
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Grant access to the function for all roles
GRANT EXECUTE ON FUNCTION match_knowledge_chunks TO anon, authenticated, service_role;

-- Add comment for documentation
COMMENT ON FUNCTION match_knowledge_chunks IS 'Searches knowledge_chunks using pgvector cosine similarity. Returns chunks with similarity > min_similarity, ordered by relevance.';
