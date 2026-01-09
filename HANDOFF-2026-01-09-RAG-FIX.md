# HANDOFF: RAG Critical Fix

**Date:** January 9, 2026
**Session:** RAG System Repair
**Status:** COMPLETE - All fixes deployed to main

---

## Summary

The RAG system was broken because the similarity threshold was set to 0.6 but actual similarity scores from the vector database were approximately 0.52, filtering out all results. This meant knowledge context was never being passed to the AI, resulting in generic outputs instead of Maria Wendt-style content.

### Root Cause
- Threshold: 0.6 (too strict)
- Actual scores: ~0.52 (below threshold)
- Result: 0 chunks retrieved, no knowledge context

### Fix Applied
- Changed threshold from 0.6 to 0.3 across all files
- Changed limit from 5 to 20 chunks per query
- Created shared `searchKnowledgeWithMetrics` utility in `./lib/knowledge-search.js`
- Added comprehensive RAG logging to `rag_retrieval_logs` table for debugging

---

## Files Modified

| File | Commit | Changes |
|------|--------|---------|
| `netlify/functions/generate-funnel.js` | `dc636d7` | Threshold 0.6 to 0.3, limit 5 to 20 |
| `netlify/functions/lib/batched-generators.js` | `8f4759c` | Replaced local RAG functions with shared utility, added 14 logging calls |
| `netlify/functions/generate-lead-magnet-background.js` | `630b5b5` | Replaced local RAG, added logging for each section |
| `netlify/functions/generate-lead-magnet-content-batched.js` | `a851bb6` | Replaced local RAG, added logging for Part 1 and Part 2 |

---

## Technical Details

### Embedding Configuration
- **Model:** `text-embedding-3-small` (OpenAI)
- **Vector search:** pgvector RPC function `match_knowledge_chunks`
- **Threshold:** 0.3 (previously 0.6)
- **Limit:** 20 chunks per query (previously 5)

### Similarity Score Reference
- Good matches: 0.5 - 0.8
- Acceptable matches: 0.3 - 0.5
- Poor matches: below 0.3

### Shared Utility
Location: `netlify/functions/lib/knowledge-search.js`

```javascript
const { searchKnowledgeWithMetrics } = require('./lib/knowledge-search');

const ragResult = await searchKnowledgeWithMetrics(supabase, openai, query, {
  threshold: 0.3,
  limit: 20,
  sourceFunction: 'generate-funnel'
});
```

### Logging Table
All RAG operations are logged to `rag_retrieval_logs` with:
- `query_text` - The search query sent to embeddings
- `chunks_retrieved` - Number of chunks returned
- `knowledge_context_passed` - Boolean: was context included in prompt
- `source_function` - Which file made the call
- `similarity_scores` - Array of scores for debugging
- `created_at` - Timestamp

---

## Verification Steps

After any generation, check the `rag_retrieval_logs` table:

```sql
SELECT
  source_function,
  query_text,
  chunks_retrieved,
  knowledge_context_passed,
  similarity_scores,
  created_at
FROM rag_retrieval_logs
ORDER BY created_at DESC
LIMIT 20;
```

**Expected Results:**
- `chunks_retrieved` > 0 (should see 5-20 typically)
- `knowledge_context_passed` = true
- `similarity_scores` array with values between 0.3 and 0.8

---

## Approval Chain

All 4 files completed the full approval process:

1. **Supervisor Approval** - Changes reviewed and approved
2. **Code Review** - PASS
3. **QA Testing** - PASS
4. **Git Push** - Deployed to main branch

---

## Next Session Priorities

1. Monitor `rag_retrieval_logs` after real user generations
2. Verify generated content now includes Maria Wendt terminology
3. Consider tuning threshold further if needed (0.3 may retrieve too much noise)

---

## Related Files (Reference)

- Migration: `supabase/migrations/create-rag-retrieval-logs.sql`
- Architecture doc: `artifacts/ARCHITECTURE-rag-retrieval-logging.md`
- Shared utility: `netlify/functions/lib/knowledge-search.js`

---

**Session Complete**
