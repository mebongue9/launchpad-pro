# HANDOFF: RAG Fix Verification - January 9, 2026

**Purpose:** New session should VERIFY that all RAG fixes are correctly implemented
**Action Required:** Read each file at the specified line numbers and confirm the code matches

---

## THE PROBLEM (What Was Broken)

The RAG (Retrieval Augmented Generation) system was not working:
- Similarity threshold was set to **0.6**
- Actual similarity scores from the vector database were **~0.52**
- Result: **0 chunks retrieved**, no knowledge context passed to Claude
- Generated content was generic AI output, not grounded in the user's knowledge base

---

## THE FIX (What Was Changed)

| Setting | BEFORE (broken) | AFTER (fixed) |
|---------|-----------------|---------------|
| Similarity threshold | 0.6 | **0.3** |
| Chunk limit | 5 | **20** |
| Supabase URL | `process.env.SUPABASE_URL` | `process.env.SUPABASE_URL \|\| process.env.VITE_SUPABASE_URL` |
| RAG logging | Missing in some files | Added `logRagRetrieval()` calls |

---

## FILES TO VERIFY (6 Total)

### FILE 1: `netlify/functions/lib/knowledge-search.js`

This is the **shared utility** that all other files import from.

**VERIFY Line 12 - VITE_SUPABASE_URL fallback:**
```javascript
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
```

**VERIFY Lines 29-30 - Default threshold 0.3 and limit 20:**
```javascript
    limit = 20,
    threshold = 0.3,
```

**VERIFY Line 149 - logRagRetrieval function exists:**
```javascript
export async function logRagRetrieval(params) {
```

---

### FILE 2: `netlify/functions/generate-funnel.js`

**VERIFY Lines 10-14 - Imports shared functions:**
```javascript
import {
  searchKnowledgeWithMetrics,
  logRagRetrieval,
  getPreviousFunnelNamesWithMetrics
} from './lib/knowledge-search.js';
```

**VERIFY Lines 205-206 - Uses threshold 0.3 and limit 20:**
```javascript
      limit: 20,
      threshold: 0.3,
```

**VERIFY Line 272 - Calls logRagRetrieval:**
```javascript
      await logRagRetrieval({
```

---

### FILE 3: `netlify/functions/generate-lead-magnet-ideas.js`

**VERIFY Line 11 - Imports shared functions:**
```javascript
import { searchKnowledgeWithMetrics, logRagRetrieval } from './lib/knowledge-search.js';
```

**VERIFY Line 74 - VITE_SUPABASE_URL fallback:**
```javascript
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
```

**VERIFY Lines 217-218 - Uses threshold 0.3 and limit 20:**
```javascript
      threshold: 0.3,
      limit: 20,
```

**VERIFY Line 320 - Calls logRagRetrieval:**
```javascript
    await logRagRetrieval({
```

---

### FILE 4: `netlify/functions/generate-lead-magnet-background.js`

**VERIFY Line 10 - Imports shared functions:**
```javascript
import { searchKnowledgeWithMetrics, logRagRetrieval } from './lib/knowledge-search.js';
```

**VERIFY Line 17 - VITE_SUPABASE_URL fallback:**
```javascript
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
```

**VERIFY Lines 108-109 - Uses threshold 0.3 and limit 20:**
```javascript
    limit: 20,
    threshold: 0.3,
```

**VERIFY Line 170 - Calls logRagRetrieval:**
```javascript
          await logRagRetrieval({
```

---

### FILE 5: `netlify/functions/generate-lead-magnet-content-batched.js`

**VERIFY Line 10 - Imports shared functions:**
```javascript
import { searchKnowledgeWithMetrics, logRagRetrieval } from './lib/knowledge-search.js';
```

**VERIFY Line 13 - VITE_SUPABASE_URL fallback:**
```javascript
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
```

**VERIFY Line 35 - Part 1 uses threshold 0.3 and limit 20:**
```javascript
    { limit: 20, threshold: 0.3, sourceFunction: 'generate-lead-magnet-content-batched' }
```

**VERIFY Line 95 - Part 2 uses threshold 0.3 and limit 20:**
```javascript
    { limit: 20, threshold: 0.3, sourceFunction: 'generate-lead-magnet-content-batched' }
```

**VERIFY Line 190 - Calls logRagRetrieval for Part 1:**
```javascript
      await logRagRetrieval({
```

**VERIFY Line 220 - Calls logRagRetrieval for Part 2:**
```javascript
      await logRagRetrieval({
```

---

### FILE 6: `netlify/functions/lib/batched-generators.js`

**VERIFY Line 14 - Imports shared functions:**
```javascript
import { searchKnowledgeWithMetrics, logRagRetrieval } from './knowledge-search.js';
```

**VERIFY Line 17 - VITE_SUPABASE_URL fallback:**
```javascript
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
```

**VERIFY Lines 38-58 - Helper function logRagForBatchedGen exists:**
```javascript
async function logRagForBatchedGen(funnelId, funnel, taskName, ragMetrics) {
  if (!ragMetrics) return;

  try {
    await logRagRetrieval({
      ...
    });
  } catch (err) {
    ...
  }
}
```

**VERIFY Lines 125-126 - Uses threshold 0.3 and limit 20:**
```javascript
    limit: 20,
    threshold: 0.3,
```

This file has **14 generators**, each with its own RAG search. All should have `limit: 20, threshold: 0.3`.

RAG search locations in batched-generators.js:
- Line 124-128: generateLeadMagnetPart1
- Line 241-245: generateLeadMagnetPart2
- Line 331-335: generateFrontendPart1
- Line 435-439: generateFrontendPart2
- Line 535-539: generateBumpFull
- Line 633-637: generateUpsell1Part1
- Line 686-690: generateUpsell1Part2
- Line 775-779: generateUpsell2Part1
- Line 827-831: generateUpsell2Part2
- Line 920-924: generateAllTldrs
- Line 984-988: generateMarketplaceBatch1
- Line 1054-1058: generateMarketplaceBatch2
- Line 1117-1121: generateAllEmails
- Line 1197-1201: generateBundleListing

---

## DATABASE VERIFICATION

Query the `rag_retrieval_logs` table to confirm the fix is working in production.

**Supabase URL:** `https://psfgnelrxzdckucvytzj.supabase.co`

**Service Role Key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzZmduZWxyeHpkY2t1Y3Z5dHpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIwNDIxMCwiZXhwIjoyMDgwNzgwMjEwfQ.JwaMe5L7rqxnv0BQHqAelynhY4SPzQEsw9XBYgQ_eHs
```

**Verification Query:**
```bash
curl -s 'https://psfgnelrxzdckucvytzj.supabase.co/rest/v1/rag_retrieval_logs?select=source_function,similarity_threshold,chunks_retrieved,knowledge_context_passed,created_at&order=created_at.desc&limit=10' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzZmduZWxyeHpkY2t1Y3Z5dHpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIwNDIxMCwiZXhwIjoyMDgwNzgwMjEwfQ.JwaMe5L7rqxnv0BQHqAelynhY4SPzQEsw9XBYgQ_eHs' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzZmduZWxyeHpkY2t1Y3Z5dHpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIwNDIxMCwiZXhwIjoyMDgwNzgwMjEwfQ.JwaMe5L7rqxnv0BQHqAelynhY4SPzQEsw9XBYgQ_eHs'
```

**Expected Results:**
- Recent entries should have `similarity_threshold: 0.3`
- Recent entries should have `chunks_retrieved: 20`
- Recent entries should have `knowledge_context_passed: true`
- Older entries (before fix) had `similarity_threshold: 0.6`, `chunks_retrieved: 0`, `knowledge_context_passed: false`

---

## VERIFICATION CHECKLIST

For EACH of the 6 files, verify:

| File | Import shared functions | VITE fallback | threshold 0.3 | limit 20 | logRagRetrieval call |
|------|------------------------|---------------|---------------|----------|---------------------|
| knowledge-search.js | N/A (source) | Line 12 | Line 30 | Line 29 | Line 149 (defines it) |
| generate-funnel.js | Lines 10-14 | Via import | Line 206 | Line 205 | Line 272 |
| generate-lead-magnet-ideas.js | Line 11 | Line 74 | Line 217 | Line 218 | Line 320 |
| generate-lead-magnet-background.js | Line 10 | Line 17 | Line 109 | Line 108 | Line 170 |
| generate-lead-magnet-content-batched.js | Line 10 | Line 13 | Lines 35, 95 | Lines 35, 95 | Lines 190, 220 |
| batched-generators.js | Line 14 | Line 17 | 14 locations | 14 locations | Via helper at line 42 |

---

## WHAT SUCCESS LOOKS LIKE

If the fix is correct:
1. All 6 files have the code at the specified line numbers
2. Database query shows recent entries with `chunks_retrieved: 20` and `knowledge_context_passed: true`
3. Generated content is grounded in the 4,349 knowledge chunks from the vector database

---

## COMMANDS TO READ EACH FILE

```bash
# Read knowledge-search.js lines 10-35
head -35 netlify/functions/lib/knowledge-search.js | tail -26

# Read generate-funnel.js lines 10-15 and 204-210
sed -n '10,15p;204,210p' netlify/functions/generate-funnel.js

# Read generate-lead-magnet-ideas.js lines 11, 73-76, 216-220
sed -n '11p;73,76p;216,220p' netlify/functions/generate-lead-magnet-ideas.js
```

---

## END OF HANDOFF

New session: Please verify each file at the specified line numbers and confirm the code matches what is documented above.
