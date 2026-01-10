# HANDOFF: Session 13 - RAG Fix for Background Job System

**Date:** 2026-01-10
**Session:** 13
**Status:** COMPLETE - RAG working, deployed, tested

---

## WHAT WAS FIXED

### Problem
Lead magnet ideas generation was NOT using RAG. The background job system (`process-generation-background.js`) had its own `generateLeadMagnetIdeas()` function that used hardcoded prompts without vector database.

### Root Cause
Session 12 reverted RAG from `process-generation-background.js` thinking it wasn't used. Then Session 13 changed the UI to use the background job system (to fix 504 timeouts), which broke RAG.

### Solution
Added RAG to `generateLeadMagnetIdeas()` in `process-generation-background.js`:
- Line 10: Import `searchKnowledgeWithMetrics, logRagRetrieval`
- Line 658: RAG call with threshold 0.3, limit 40
- Line 676: Knowledge context included in prompt
- Line 800: RAG logging with correct parameters

---

## CRITICAL: logRagRetrieval CORRECT PARAMETERS

**WRONG (what I did initially - DOES NOT LOG):**
```javascript
await logRagRetrieval({
  userId: inputData?.user_id || null,
  sourceFunction: 'generate-lead-magnet-ideas',
  searchQuery: knowledgeQuery,           // WRONG
  chunksRetrieved: ragMetrics.chunksRetrieved,  // WRONG
  topScores: ragMetrics.topScores,       // WRONG
  knowledgeContextPassed: !!knowledgeContext,   // WRONG
  generationSuccessful: true
});
```

**CORRECT (what works):**
```javascript
await logRagRetrieval({
  userId: inputData?.user_id || null,
  profileId: profile?.id || null,
  audienceId: audience?.id || null,
  funnelId: null,
  leadMagnetId: null,
  sourceFunction: 'generate-lead-magnet-ideas',
  generationType: 'lead-magnet-ideas',
  metrics: ragMetrics,  // PASS THE WHOLE METRICS OBJECT
  freshnessCheck: { performed: false, count: 0, names: [] },
  generationSuccessful: true,
  errorMessage: null
});
```

**KEY INSIGHT:** The `logRagRetrieval` function expects `metrics: ragMetrics` (the entire metrics object returned by `searchKnowledgeWithMetrics`), NOT individual fields.

---

## HOW TO CHECK RAG LOGS

### Quick Command
```bash
curl -s 'https://psfgnelrxzdckucvytzj.supabase.co/rest/v1/rag_retrieval_logs?select=source_function,chunks_retrieved,knowledge_context_passed,created_at&order=created_at.desc&limit=10' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzZmduZWxyeHpkY2t1Y3Z5dHpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIwNDIxMCwiZXhwIjoyMDgwNzgwMjEwfQ.JwaMe5L7rqxnv0BQHqAelynhY4SPzQEsw9XBYgQ_eHs' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzZmduZWxyeHpkY2t1Y3Z5dHpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIwNDIxMCwiZXhwIjoyMDgwNzgwMjEwfQ.JwaMe5L7rqxnv0BQHqAelynhY4SPzQEsw9XBYgQ_eHs' | python3 -c "import sys,json;[print(f\"{r['source_function']:35} | chunks: {r['chunks_retrieved']:3} | context: {r['knowledge_context_passed']} | {r['created_at']}\") for r in json.load(sys.stdin)]"
```

### Expected Output After Generation
```
generate-lead-magnet-ideas          | chunks:  14 | context: True | 2026-01-10T10:46:34
```

### Database Table
`rag_retrieval_logs` in Supabase

### Full Documentation
`/docs/RAG-VERIFICATION-MAP.md`

---

## FILES CHANGED THIS SESSION

| File | Change |
|------|--------|
| `netlify/functions/process-generation-background.js` | Added RAG to generateLeadMagnetIdeas() |
| `src/pages/LeadMagnetBuilder.jsx` | Restored 2-step workflow |
| `src/hooks/useGenerationJob.jsx` | Added useFunnelRemainingContentJob |
| `src/hooks/useBatchedGeneration.jsx` | Added deprecation comment |

---

## 2-STEP WORKFLOW (RESTORED)

**Step 5:** User clicks "Generate Lead Magnet Content"
- Uses `useLeadMagnetContentJob` hook
- Calls background job system
- User can review and regenerate

**Step 7:** User clicks "Save & Generate Funnel"
- Saves lead magnet
- Uses `useFunnelRemainingContentJob` hook
- Generates remaining 12 products

---

## DEPLOYMENT

- Code is on `main` branch, pushed to origin
- Deployed to production: https://launchpad-pro-app.netlify.app
- Deploy command used: `netlify deploy --prod --skip-functions-cache`

---

## NEXT SESSION TASKS

1. Test "Generate Lead Magnet Content" button (Step 5 in workflow)
2. Test "Save & Generate Funnel" button (Step 7)
3. Verify no 504 timeouts
4. Check RAG logs for content generation

---

## COMMITS THIS SESSION

```
ef6c3f9 fix: Add RAG to lead magnet ideas in background job system
```

---

**END OF HANDOFF**
