-- Migration: Create RAG Retrieval Logs Table
-- Purpose: Audit trail for vector database usage during generation
-- Created: 2026-01-06

CREATE TABLE IF NOT EXISTS rag_retrieval_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  audience_id UUID REFERENCES audiences(id) ON DELETE SET NULL,
  funnel_id UUID REFERENCES funnels(id) ON DELETE CASCADE,
  lead_magnet_id UUID REFERENCES lead_magnets(id) ON DELETE CASCADE,
  source_function TEXT NOT NULL,
  generation_type TEXT NOT NULL,
  search_query TEXT NOT NULL,
  total_chunks_in_db INTEGER,
  chunks_retrieved INTEGER,
  similarity_threshold DECIMAL(4,3) DEFAULT 0.600,
  model_used TEXT DEFAULT 'text-embedding-3-small',
  query_vector_length INTEGER DEFAULT 1536,
  top_5_scores JSONB,
  chunks_used JSONB,
  knowledge_context_length INTEGER,
  knowledge_context_passed BOOLEAN,
  freshness_check_performed BOOLEAN DEFAULT FALSE,
  previous_names_count INTEGER DEFAULT 0,
  previous_names_avoided JSONB,
  embedding_time_ms INTEGER,
  retrieval_time_ms INTEGER,
  total_time_ms INTEGER,
  generation_successful BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rag_logs_user_id ON rag_retrieval_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_rag_logs_funnel_id ON rag_retrieval_logs(funnel_id);
CREATE INDEX IF NOT EXISTS idx_rag_logs_created_at ON rag_retrieval_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rag_logs_source_function ON rag_retrieval_logs(source_function);

ALTER TABLE rag_retrieval_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own RAG logs" ON rag_retrieval_logs
  FOR SELECT USING (auth.uid() = user_id);

COMMENT ON TABLE rag_retrieval_logs IS 'Audit log for RAG operations - tracks vector search metrics';
