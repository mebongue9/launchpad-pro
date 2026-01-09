# ARCHITECTURE: RAG Retrieval Audit Logging

**Task:** Add database logging to prove vector database usage during generation
**Approved by:** Tech-Lead Supervisor (Session 9)
**Date:** 2026-01-06

## Problem Statement

Currently there is no way to PROVE that the Maria Wendt vector database (3,577 chunks) is actually being used during funnel/lead magnet generation. This is central to the application's value proposition.

## Solution

Add verbose audit logging that captures:
- Whether vector DB was queried
- What chunks were retrieved
- Similarity scores achieved
- Whether knowledge context was passed to Claude
- Freshness check results (previous names avoided)
- Performance timing

## Files to Create

### 1. `/supabase/migrations/create-rag-retrieval-logs.sql`
New table `rag_retrieval_logs` with columns for:
- Context: user_id, profile_id, audience_id, funnel_id, lead_magnet_id
- Request: source_function, generation_type, search_query
- Metrics: total_chunks_in_db, chunks_retrieved, similarity_threshold
- Results: top_5_scores (JSONB), chunks_used (JSONB), knowledge_context_passed
- Freshness: freshness_check_performed, previous_names_avoided
- Timing: embedding_time_ms, retrieval_time_ms, total_time_ms
- Outcome: generation_successful, error_message

### 2. `/netlify/functions/lib/knowledge-search.js`
Shared utility for knowledge base search with metrics collection.
Centralizes RAG logic currently duplicated in 4+ functions.
Returns structured object with all metrics for logging.

## Files to Modify

### 3. `/netlify/functions/generate-funnel.js`
- Remove local searchKnowledge function
- Import shared searchKnowledgeWithMetrics from lib
- Refactor getPreviousFunnelNames to return structured result
- Add RAG log insert after generation completes
- Capture profile_id and audience_id for logging

## Security Considerations

- Store metadata only (100-char previews), not full chunk content
- RLS enabled: users can only view their own logs
- Service role key required for inserts (from Netlify functions)

## Verification

After implementation, query:
```sql
SELECT chunks_retrieved, knowledge_context_passed, top_5_scores
FROM rag_retrieval_logs ORDER BY created_at DESC LIMIT 5;
```

## Phase 2 (Future)

Roll out to: generate-lead-magnet-ideas.js, lib/batched-generators.js, generate-lead-magnet-content-batched.js
