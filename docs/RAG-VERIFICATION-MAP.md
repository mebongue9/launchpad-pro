# RAG VERIFICATION MAP

**Purpose:** Know exactly where to check RAG logs for each generation type.
**Last Updated:** 2026-01-10

---

## Database Table

All RAG logs are stored in: **`rag_retrieval_logs`**

Query to check recent logs:
```bash
curl -s 'https://psfgnelrxzdckucvytzj.supabase.co/rest/v1/rag_retrieval_logs?select=id,source_function,chunks_retrieved,knowledge_context_passed,created_at&order=created_at.desc&limit=20' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzZmduZWxyeHpkY2t1Y3Z5dHpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIwNDIxMCwiZXhwIjoyMDgwNzgwMjEwfQ.JwaMe5L7rqxnv0BQHqAelynhY4SPzQEsw9XBYgQ_eHs' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzZmduZWxyeHpkY2t1Y3Z5dHpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIwNDIxMCwiZXhwIjoyMDgwNzgwMjEwfQ.JwaMe5L7rqxnv0BQHqAelynhY4SPzQEsw9XBYgQ_eHs'
```

---

## Generation Types and Their Source Functions

| Generation Type | source_function in logs | Code File | UI Endpoint |
|-----------------|------------------------|-----------|-------------|
| **Funnel Generation** | `generate-funnel` | `/netlify/functions/generate-funnel.js` | `/.netlify/functions/generate-funnel` |
| **Lead Magnet Ideas** | `generate-lead-magnet-ideas` | `/netlify/functions/generate-lead-magnet-ideas.js` | `/.netlify/functions/generate-lead-magnet-ideas` |

---

## How to Verify RAG for Each Type

### 1. Funnel Generation

**Check logs for:** `source_function = 'generate-funnel'`

```bash
curl -s 'https://psfgnelrxzdckucvytzj.supabase.co/rest/v1/rag_retrieval_logs?source_function=eq.generate-funnel&select=*&order=created_at.desc&limit=5' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzZmduZWxyeHpkY2t1Y3Z5dHpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIwNDIxMCwiZXhwIjoyMDgwNzgwMjEwfQ.JwaMe5L7rqxnv0BQHqAelynhY4SPzQEsw9XBYgQ_eHs' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzZmduZWxyeHpkY2t1Y3Z5dHpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIwNDIxMCwiZXhwIjoyMDgwNzgwMjEwfQ.JwaMe5L7rqxnv0BQHqAelynhY4SPzQEsw9XBYgQ_eHs'
```

**Expected:** `chunks_retrieved = 40`, `knowledge_context_passed = true`

**Code location:** `/netlify/functions/generate-funnel.js` lines 45-70

---

### 2. Lead Magnet Ideas

**Check logs for:** `source_function = 'generate-lead-magnet-ideas'`

```bash
curl -s 'https://psfgnelrxzdckucvytzj.supabase.co/rest/v1/rag_retrieval_logs?source_function=eq.generate-lead-magnet-ideas&select=*&order=created_at.desc&limit=5' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzZmduZWxyeHpkY2t1Y3Z5dHpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIwNDIxMCwiZXhwIjoyMDgwNzgwMjEwfQ.JwaMe5L7rqxnv0BQHqAelynhY4SPzQEsw9XBYgQ_eHs' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzZmduZWxyeHpkY2t1Y3Z5dHpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIwNDIxMCwiZXhwIjoyMDgwNzgwMjEwfQ.JwaMe5L7rqxnv0BQHqAelynhY4SPzQEsw9XBYgQ_eHs'
```

**Expected:** `chunks_retrieved > 0`, `knowledge_context_passed = true`

**Code location:** `/netlify/functions/generate-lead-magnet-ideas.js` lines 35-65

---

## Key Fields in rag_retrieval_logs

| Field | Description |
|-------|-------------|
| `source_function` | Which function made the RAG call |
| `chunks_retrieved` | Number of knowledge chunks retrieved (0 = RAG failed) |
| `knowledge_context_passed` | true = knowledge was included in prompt |
| `search_query` | The query used to search the vector database |
| `top_5_scores` | Similarity scores of top 5 chunks |
| `created_at` | Timestamp of the generation |

---

## Quick Diagnostic Command

Run this to see all recent RAG activity:

```bash
curl -s 'https://psfgnelrxzdckucvytzj.supabase.co/rest/v1/rag_retrieval_logs?select=source_function,chunks_retrieved,knowledge_context_passed,created_at&order=created_at.desc&limit=10' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzZmduZWxyeHpkY2t1Y3Z5dHpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIwNDIxMCwiZXhwIjoyMDgwNzgwMjEwfQ.JwaMe5L7rqxnv0BQHqAelynhY4SPzQEsw9XBYgQ_eHs' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzZmduZWxyeHpkY2t1Y3Z5dHpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIwNDIxMCwiZXhwIjoyMDgwNzgwMjEwfQ.JwaMe5L7rqxnv0BQHqAelynhY4SPzQEsw9XBYgQ_eHs' | python3 -c "import sys,json;[print(f\"{r['source_function']:35} | chunks: {r['chunks_retrieved']:3} | {r['created_at'][:19]}\") for r in json.load(sys.stdin)]"
```

---

## IMPORTANT NOTES

1. **DO NOT look for `generate-lead-magnet-ideas-bg`** - This is a background job path that is NOT used by the UI
2. The UI calls synchronous endpoints directly, not the background job system
3. If `chunks_retrieved = 0`, RAG failed - check `error_message` field
4. All RAG uses the shared utility at `/netlify/functions/lib/knowledge-search.js`
