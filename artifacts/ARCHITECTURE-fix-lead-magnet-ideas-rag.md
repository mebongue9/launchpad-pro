# ARCHITECTURE: Fix Lead Magnet Ideas RAG

**Date:** 2026-01-10
**Related Plan:** `PLAN-fix-lead-magnet-ideas-rag.md`
**Vision Document:** `docs/LAUNCHPAD-PRO-VISION.md` v1.3

---

## Purpose

This architecture document authorizes modifications to fix the RAG integration for lead magnet ideas generation, as required by the Vision Document's core philosophy.

---

## Vision Alignment

From Vision Document Part 1 - Core Philosophy:
> **"Everything Comes From The Vector Database - This is non-negotiable."**

The current implementation violates this by using hardcoded prompts instead of querying the vector database.

---

## Files Authorized for Modification

| File | Modification Type | Reason |
|------|------------------|--------|
| `/netlify/functions/process-generation-background.js` | Edit | Add RAG to `generateLeadMagnetIdeas()` function |

---

## Detailed Changes

### File: `/netlify/functions/process-generation-background.js`

**Change 1: Add Import (Line 9)** ✅ COMPLETED
```javascript
import { searchKnowledgeWithMetrics, logRagRetrieval } from './lib/knowledge-search.js';
```

**Change 2: Modify `generateLeadMagnetIdeas()` function (Lines 634-779)**

Add RAG search and logging to ensure ideas come from the vector database:
1. Call `searchKnowledgeWithMetrics()` with profile/audience query
2. Include knowledge context in prompt
3. Call `logRagRetrieval()` for audit trail

**CLARIFICATION: Maria Wendt Data**
The existing "Maria Wendt" references in this function are FORMAT GUIDANCE only:
- Format types (Checklist, Cheat Sheet, Blueprint, etc.) - per Vision Document Part 4
- Naming patterns (specificity formula) - per Vision Document Part 3
- This is NOT content - it's the universal formatting rules shared across all niches

Per Vision Document Part 2: "Shared across ALL niches: Maria Wendt naming formulas (the patterns that convert)"

The RAG change adds CONTENT from vector database while keeping FORMAT guidance intact.

---

## Files NOT Being Modified

- `/netlify/functions/generate-lead-magnet-ideas.js` - Already has RAG (unused code path)
- `/src/pages/LeadMagnetBuilder.jsx` - UI unchanged
- `/src/hooks/useGenerationJob.jsx` - Job system unchanged

---

## Dependencies

Uses existing shared utilities:
- `/netlify/functions/lib/knowledge-search.js` - Already proven working in `generate-funnel.js`

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| RAG search fails | Function has error handling, falls back gracefully |
| Performance impact | RAG adds ~1-2 seconds (same as funnel generation) |
| Breaking existing flow | No workflow changes, only enhances AI quality |

---

## Approval Checklist

- [x] Plan artifact created
- [x] Architecture artifact created
- [x] Vision document referenced
- [x] Single file modification (minimal scope)
- [x] Uses existing proven utilities

---

## Bug Fix: Complete Fallback Metrics ✅ FIXING NOW

**Issue Found:** When RAG search throws an error, the catch block sets an incomplete `ragMetrics` object. The `logRagRetrieval` function expects fields like `query`, `totalChunksInDb`, `similarityThreshold` etc., but the fallback only had `chunksRetrieved`, `knowledgeContextPassed`, and `error`.

**Fix:** Add complete metrics object to fallback so `logRagRetrieval` can write the audit log even on failure.

**Files:**
- `/netlify/functions/process-generation-background.js` - line 670

**Change:**
```javascript
// FROM:
ragMetrics = { chunksRetrieved: 0, knowledgeContextPassed: false, error: e.message };

// TO:
ragMetrics = {
  query: knowledgeQuery,
  chunksRetrieved: 0,
  knowledgeContextPassed: false,
  totalChunksInDb: 0,
  similarityThreshold: 0.3,
  modelUsed: 'text-embedding-3-small',
  queryVectorLength: 0,
  top5Scores: [],
  chunksUsed: [],
  knowledgeContextLength: 0,
  embeddingTimeMs: 0,
  retrievalTimeMs: 0,
  totalTimeMs: 0,
  error: e.message
};
```
