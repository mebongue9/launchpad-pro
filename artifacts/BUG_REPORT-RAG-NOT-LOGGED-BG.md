# BUG REPORT: RAG Retrieval Not Logged for Background Job Lead Magnet Ideas Generation

**Date:** 2026-01-10
**Severity:** Medium
**Component:** process-generation-background.js
**Reporter:** QA Tester Bot

---

## Title
RAG retrieval logs are NOT created when lead magnet ideas are generated via the background job path (start-generation -> process-generation-background)

---

## Environment
- **URL:** https://launchpad-pro-app.netlify.app
- **Function:** start-generation + process-generation-background
- **Job Type:** lead_magnet_ideas
- **Test Time:** 2026-01-10 07:57:45 UTC

---

## Steps to Reproduce

1. Call the start-generation endpoint to create a lead_magnet_ideas job:
```bash
curl -X POST 'https://launchpad-pro-app.netlify.app/.netlify/functions/start-generation' \
  -H 'Content-Type: application/json' \
  -d '{
    "job_type": "lead_magnet_ideas",
    "user_id": "10391013-6e2e-4b9d-9abc-208f7668df56",
    "input_data": {
      "profile": { "id": "...", "name": "Martin Ebongue", "niche": "..." },
      "audience": { "id": "...", "name": "Struggling Creators", ... },
      "front_end_product": { "name": "...", "price": 17, "description": "..." },
      "excluded_topics": [],
      "language": "English"
    }
  }'
```

2. Wait for job to complete (poll check-job-status)

3. Query the rag_retrieval_logs table for recent entries

---

## Expected Behavior

- A new entry should be created in `rag_retrieval_logs` table with:
  - `source_function: 'generate-lead-magnet-ideas-bg'`
  - `chunks_retrieved: 40` (or whatever the limit is set to)
  - `knowledge_context_passed: true`
  - Generation timestamp matching the job completion time

---

## Actual Behavior

- **NO RAG log entry is created** for lead_magnet_ideas generations via the background job path
- The job completes successfully with valid AI-generated content
- The AI response includes references to knowledge base content, suggesting RAG DID work
- But no audit trail is recorded in `rag_retrieval_logs`

---

## Evidence

### Test Job Created
```json
{
  "job_id": "2616f67d-7156-4d88-b041-115f559bc59c",
  "job_type": "lead_magnet_ideas",
  "status": "complete",
  "created_at": "2026-01-10T07:57:45.35+00:00",
  "completed_at": "2026-01-10T07:57:57.446+00:00"
}
```

### RAG Logs After Job (none from background job)
The most recent RAG log before the direct function test was:
```json
{
  "id": "8a20474c-747f-474e-8ba5-0f8222bc0648",
  "source_function": "generate-funnel",
  "created_at": "2026-01-10T07:16:33.660968+00:00"
}
```

No log exists between 07:16:33 and 08:00:06 - the background job ran at 07:57:45-07:57:57 but created no log.

### Direct Function Works Correctly
When calling `generate-lead-magnet-ideas` directly (not via background job), RAG log IS created:
```json
{
  "id": "7a583101-e235-4adb-be1f-cd65003669c9",
  "source_function": "generate-lead-magnet-ideas",
  "created_at": "2026-01-10T08:00:06.707002+00:00",
  "chunks_retrieved": 14,
  "knowledge_context_passed": true
}
```

---

## Root Cause Analysis

Looking at `/netlify/functions/process-generation-background.js` lines 655-666 and 796-811:

```javascript
// Lines 655-666: RAG search with try/catch
try {
    const ragResult = await searchKnowledgeWithMetrics(knowledgeQuery, {
      threshold: 0.3,
      limit: 40,
      sourceFunction: 'generate-lead-magnet-ideas-bg'
    });
    knowledgeContext = ragResult.context;
    ragMetrics = ragResult.metrics;
    console.log('RAG: ' + ragMetrics.chunksRetrieved + ' chunks');
} catch (e) {
    ragMetrics = { chunksRetrieved: 0, knowledgeContextPassed: false };
}

// Lines 796-811: RAG logging
if (ragMetrics) {
    try {
        await logRagRetrieval({
            userId: inputData.user_id || null,
            profileId: profile?.id || null,
            audienceId: audience?.id || null,
            sourceFunction: 'generate-lead-magnet-ideas-bg',
            generationType: 'lead-magnet-ideas',
            metrics: ragMetrics,
            generationSuccessful: true
        });
        console.log('RAG logged to rag_retrieval_logs');
    } catch (logErr) {
        console.error('RAG log failed:', logErr.message);
    }
}
```

**Possible causes:**
1. The deployed code may be different from local code (deployment issue)
2. The RAG search may be silently failing and setting minimal ragMetrics
3. The logRagRetrieval call may be failing but error is swallowed
4. Environment variables (OPENAI_API_KEY, SUPABASE_SERVICE_ROLE_KEY) may not be set correctly in the background function context

---

## Additional Findings

### Deployed Code Differs from Local Code
The direct function `generate-lead-magnet-ideas.js` has this code locally (line 221):
```javascript
sourceFunction: `generate-lead-magnet-ideas-${chunkLimit}chunks`
```

But the logged entry shows `source_function: 'generate-lead-magnet-ideas'` - meaning the deployed code is NOT the current local version.

### Chunk Count Discrepancy
- Direct function retrieved **14 chunks** (not 40 as configured in local code)
- This suggests either:
  - Deployed code has different limit settings
  - Vector search is returning fewer matches than requested
  - The similarity threshold (0.3) is filtering out many chunks

---

## Impact

- **Audit Trail Gap:** No visibility into RAG usage for background-generated lead magnet ideas
- **Debugging Difficulty:** Cannot verify if knowledge base is being used correctly
- **Compliance Risk:** Missing documentation of AI knowledge retrieval for regulatory purposes
- **Metrics Tracking:** Unable to track RAG performance for optimization

---

## Recommended Fix

1. **Verify deployment:** Ensure latest code is deployed to Netlify
2. **Add error logging:** Make RAG failures more visible in logs
3. **Verify environment variables:** Check OPENAI_API_KEY is set in Netlify function environment
4. **Add fallback logging:** Log even when RAG search fails, with error details

---

## Files Involved
- `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/netlify/functions/process-generation-background.js` (lines 655-666, 796-811)
- `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/netlify/functions/lib/knowledge-search.js`
- `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/netlify/functions/generate-lead-magnet-ideas.js` (working version for comparison)

---

## Test Commands for Verification

```bash
# 1. Trigger background job
curl -X POST 'https://launchpad-pro-app.netlify.app/.netlify/functions/start-generation' \
  -H 'Content-Type: application/json' \
  -d '{"job_type": "lead_magnet_ideas", "user_id": "...", "input_data": {...}}'

# 2. Check job status
curl -X POST 'https://launchpad-pro-app.netlify.app/.netlify/functions/check-job-status' \
  -H 'Content-Type: application/json' \
  -d '{"job_id": "JOB_ID_HERE"}'

# 3. Verify RAG log was created
curl -s "https://psfgnelrxzdckucvytzj.supabase.co/rest/v1/rag_retrieval_logs?select=*&order=created_at.desc&limit=1" \
  -H "apikey: SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer SERVICE_ROLE_KEY"
```
