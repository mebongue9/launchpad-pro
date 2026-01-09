# PLAN: RAG Critical Fix - Embedding Model Mismatch

**Date:** January 9, 2026
**Priority:** CRITICAL
**Status:** Approved and In Progress

## Problem Statement

RAG (Retrieval Augmented Generation) is completely broken. The root cause is an embedding model mismatch:
- **Stored embeddings:** `text-embedding-3-small`
- **Query embeddings:** `text-embedding-ada-002` (WRONG!)

This causes similarity scores of 0.054 instead of expected 0.5-0.8, resulting in `knowledge_context_passed = false`.

## Tasks

### Task 1: Fix Embedding Model Mismatch (CRITICAL)
Change ALL embedding model references from `text-embedding-ada-002` to `text-embedding-3-small`.

Files to update:
1. `netlify/functions/lib/knowledge-search.js` - line 79 and line 53
2. `netlify/functions/vector-search.js` - line 48
3. `netlify/functions/generate-lead-magnet-ideas.js` - line 208
4. `netlify/functions/generate-lead-magnet-background.js` - line 52
5. `netlify/functions/generate-lead-magnet-content-batched.js` - line 45
6. `netlify/functions/lib/batched-generators.js` - line 53

### Task 2: Create pgvector Search Function
Create `supabase/migrations/create-match-knowledge-chunks.sql` with a PostgreSQL function that uses pgvector for efficient similarity search.

### Task 3: Update knowledge-search.js
Replace client-side similarity calculation with pgvector RPC call. This will:
- Search ALL 4,349 chunks (not limited to 1000)
- Be much faster (server-side calculation)
- Use correct threshold (0.3 instead of 0.6)

### Task 4: Test and Verify
Deploy and verify RAG works by checking `rag_retrieval_logs` table.

## Expected Outcome

After fix:
- `chunks_retrieved` > 0
- `knowledge_context_passed` = true
- Similarity scores 0.3-0.8 for relevant content

## References

- Vision document: LAUNCHPAD-PRO-SPECS.md
- Approved plan file: ~/.claude/plans/floofy-purring-cocoa.md
