# CHANGE REQUEST: Add RAG to Lead Magnet Ideas Generation

**Date:** 2026-01-10
**Priority:** CRITICAL
**Status:** Pending Approval
**Vision Document Reference:** `docs/LAUNCHPAD-PRO-VISION.md` v1.3

---

## Vision Document Alignment

This change directly enforces the following requirements from the Vision Document:

### Core Philosophy - Section 1: "Everything Comes From The Vector Database"

> **"This is non-negotiable. The vector database is the brain of the entire system."**
>
> **When the AI generates:**
> - Funnel ideas → pulled from vector database
> - Content for products → pulled from vector database
> - Format recommendations → based on vector database analysis
>
> **"Generic AI content = garbage. Vector database content = gold."**

### Step 2: Lead Magnet Builder - Critical Rules (Part 3)

> **Critical rules:**
> - **Ideas come from vector database (selected niche's table)**
> - System checks previous lead magnets within the same niche to ensure freshness

### Part 10: What This Is NOT

> **"NOT using generic AI knowledge — Vector database only"**

### Part 11: Success Criteria

> **"✅ All content comes from vector database (not generic)"**

### Part 12: Checklist for Code Review - Content Compliance

> - [ ] **All content pulled from vector database**

---

## Problem Statement

During QA testing, we discovered that **lead magnet ideas are NOT using RAG**. This is a **direct violation** of the vision document's core philosophy.

### Evidence from Database Logs

| Generation Type | Uses RAG? | Log Entry Today (2026-01-10)? |
|-----------------|-----------|-------------------------------|
| `generate-funnel` | YES ✅ | YES - 40 chunks retrieved at 07:16:33 |
| `generate-lead-magnet-ideas` | **NO ❌** | **NONE - No RAG log exists** |

The user generated 3 lead magnet ideas, but **no entry appeared in `rag_retrieval_logs`** because RAG is not being used.

---

## Root Cause

There are two code paths for lead magnet ideas:

| Path | File | Has RAG? | Used by UI? |
|------|------|----------|-------------|
| 1 | `generate-lead-magnet-ideas.js` | YES | **NO** |
| 2 | `process-generation-background.js` → `generateLeadMagnetIdeas()` | **NO** | **YES** |

The UI uses the background job system (Path 2), which has **hardcoded prompts without vector search** at lines 634-779.

---

## Proposed Solution

### File to Modify

`netlify/functions/process-generation-background.js`

### Changes Required

#### Change 1: Add Import (Line 9)

Add the RAG utility import:

```javascript
import { searchKnowledgeWithMetrics, logRagRetrieval } from './lib/knowledge-search.js';
```

#### Change 2: Rewrite `generateLeadMagnetIdeas()` Function (Lines 634-779)

The function must:

1. **Search the vector database** using `searchKnowledgeWithMetrics()`
   - Query: profile niche + audience name + "lead magnet topics strategies"
   - Limit: 40 chunks (same as funnel generation)
   - Threshold: 0.3 (same as funnel generation)

2. **Include knowledge context in the prompt**
   - Add retrieved chunks as "AVAILABLE KNOWLEDGE" section
   - Instruct AI to ground ideas in this knowledge

3. **Log the RAG retrieval** using `logRagRetrieval()`
   - Source function: `generate-lead-magnet-ideas-bg`
   - This creates audit trail in `rag_retrieval_logs` table

---

## Scope Clarification

This change **ONLY** affects the `generateLeadMagnetIdeas()` function in the background job system.

**What this change does:**
- Adds RAG search before generating lead magnet ideas
- Ensures ideas are grounded in BRAC knowledge base
- Creates audit log entry for verification

**What this change does NOT do:**
- Does not change the workflow (user still clicks "Generate 3 Ideas")
- Does not generate content prematurely (still only generates ideas)
- Does not affect any other generation functions
- Does not change the UI

This change **follows** the "No Wasted Tokens" principle because:
- Ideas are generated BEFORE content (per workflow)
- User validates ideas BEFORE content generation
- RAG retrieval is a read-only operation, not content generation

---

## Expected Outcome

After this fix:

1. User clicks "Generate 3 Ideas" in Lead Magnet Builder
2. System queries vector database for relevant knowledge
3. 3 ideas are generated **grounded in BRAC content**
4. New entry appears in `rag_retrieval_logs` with:
   - `source_function = 'generate-lead-magnet-ideas-bg'`
   - `chunks_retrieved > 0`
   - `knowledge_context_passed = true`

---

## Testing Plan

1. Deploy fix to Netlify
2. User generates new lead magnet ideas
3. Query `rag_retrieval_logs` to confirm new entry exists
4. Verify ideas reflect BRAC knowledge base topics

---

## Rollback Plan

Revert the single file `process-generation-background.js` to previous version.

---

**APPROVAL REQUESTED**

This change is required to comply with the Vision Document's core philosophy that **all content must come from the vector database**.
