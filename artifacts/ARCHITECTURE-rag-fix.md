# ARCHITECTURE: RAG Critical Fix

**Date:** January 9, 2026
**Related Plan:** PLAN-rag-critical-fix.md

## Files to Modify

### Embedding Model Fix (Task 1)

| File | Line | Change |
|------|------|--------|
| `/netlify/functions/lib/knowledge-search.js` | 79, 53 | Change model to `text-embedding-3-small` |
| `/netlify/functions/vector-search.js` | 48 | Change model to `text-embedding-3-small` |
| `/netlify/functions/generate-lead-magnet-ideas.js` | 208 | Change model to `text-embedding-3-small` |
| `/netlify/functions/generate-lead-magnet-background.js` | 52 | Change model to `text-embedding-3-small` |
| `/netlify/functions/generate-lead-magnet-content-batched.js` | 45 | Change model to `text-embedding-3-small` |
| `/netlify/functions/lib/batched-generators.js` | 53 | Change model to `text-embedding-3-small` |
| `/netlify/functions/test-vector-search-fix.js` | 33 | Change model to `text-embedding-3-small` |
| `/netlify/functions/debug-vector-similarity.js` | 29 | Change model to `text-embedding-3-small` |
| `/supabase/migrations/create-rag-retrieval-logs.sql` | 18 | Change default to `text-embedding-3-small` |

### pgvector Function (Task 2)

| File | Change |
|------|--------|
| `/supabase/migrations/create-match-knowledge-chunks.sql` | CREATE new SQL function |

### Knowledge Search Update (Task 3)

| File | Change |
|------|--------|
| `/netlify/functions/lib/knowledge-search.js` | Replace client-side calculation with RPC |
| `/netlify/functions/generate-funnel.js` | Update threshold from 0.6 to 0.3, limit from 5 to 20 |
| `/netlify/functions/lib/batched-generators.js` | Replace local searchKnowledge with shared searchKnowledgeWithMetrics |

**Specific changes to knowledge-search.js:**
1. Change default `limit` from 5 to 20 (return more relevant chunks)
2. Change default `threshold` from 0.6 to 0.3 (with correct embedding model, good matches score 0.5-0.8)
3. Change `totalChunksInDb` from dynamic to 4349 (pgvector searches all chunks)
4. Replace manual Supabase fetch + JavaScript cosine similarity with `supabase.rpc('match_knowledge_chunks', ...)`
5. Update result handling to use `similarity` field from pgvector instead of calculated `score`

**Why these changes IMPROVE vector database usage:**
- Previous threshold 0.6 was too high - resulted in 0 chunks retrieved
- Previous approach only searched 1000 chunks (Supabase default limit)
- New pgvector approach searches ALL 4349 chunks server-side
- This ENABLES the vector database to work as "the brain of the entire system"

## Code Changes

### Change Pattern for Embedding Model

```javascript
// BEFORE
model: 'text-embedding-ada-002'

// AFTER
model: 'text-embedding-3-small'
```

### pgvector Function SQL

```sql
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
```

## Verification

After implementation, check `rag_retrieval_logs` table for:
- `chunks_retrieved` > 0
- `knowledge_context_passed` = true
- Similarity scores 0.3-0.8
