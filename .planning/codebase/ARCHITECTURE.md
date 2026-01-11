# Architecture

**Analysis Date:** 2026-01-11

## Pattern Overview

**Overall:** Full-Stack SPA with Serverless Backend

**Key Characteristics:**
- React SPA with client-side routing
- Serverless functions for backend (Netlify Functions)
- PostgreSQL + pgvector for data and RAG
- AI-first content generation (Claude + OpenAI)
- Async job queue for long-running operations

## Layers

**Presentation Layer:**
- Purpose: User interface and client-side state
- Contains: React pages, components, hooks
- Location: `src/pages/*.jsx`, `src/components/**/*.jsx`
- Depends on: Supabase client, Netlify Functions
- Used by: End users via browser

**State Management Layer:**
- Purpose: Client-side data management
- Contains: Custom React hooks for data fetching/caching
- Location: `src/hooks/*.jsx`
- Depends on: Supabase client (`src/lib/supabase.js`)
- Used by: React components

**API Layer (Serverless):**
- Purpose: Backend logic and external API integration
- Contains: Netlify Functions (Node.js handlers)
- Location: `netlify/functions/*.js`
- Depends on: Supabase admin client, Claude API, OpenAI API
- Used by: Frontend via fetch calls

**Shared Libraries:**
- Purpose: Common utilities for backend functions
- Contains: Batched generators, knowledge search, admin auth, retry engine
- Location: `netlify/functions/lib/*.js`
- Depends on: Supabase, Claude, OpenAI SDKs
- Used by: Multiple Netlify Functions

**Template Layer:**
- Purpose: PDF/HTML generation templates
- Contains: 6 format templates, 11 style templates
- Location: `src/templates/formats/*.jsx`, `src/styles/templates/*.js`
- Depends on: None (pure rendering)
- Used by: Visual Builder page, PDF generator

## Data Flow

**Funnel Generation Flow:**

1. User fills form on `FunnelBuilder.jsx`
2. `useFunnels()` hook calls `/.netlify/functions/generate-funnel`
3. Function performs RAG search on `knowledge_chunks` table
4. Function calls Claude API with context
5. Response parsed and saved to `funnels` table
6. Frontend updates with new funnel data

**Batched Content Generation Flow:**

1. User triggers generation on funnel/lead magnet
2. Frontend calls `/.netlify/functions/start-generation`
3. Function creates `generation_jobs` record (status: 'pending')
4. Returns job_id immediately to frontend
5. `useGenerationJob()` hook polls `check-job-status` every 3s
6. Background function `process-generation-background` picks up job
7. Executes 14 generation tasks via `batched-generators.js`
8. Updates `generation_jobs` with progress and result
9. Frontend receives completed content

**State Management:**
- Client-side: React hooks with useState/useEffect
- Database: All persistent state in Supabase PostgreSQL
- Job queue: `generation_jobs` table with status polling
- No Redis or external caching

## Key Abstractions

**Generation Job:**
- Purpose: Track async long-running content generation
- Location: `netlify/functions/start-generation.js`, `check-job-status.js`
- Pattern: Job queue with status polling
- States: pending -> processing -> complete | failed

**Batched Generator:**
- Purpose: Generate content in 14 separate chunks
- Location: `netlify/functions/lib/batched-generators.js`
- Pattern: 14 exported functions, each handling one piece
- Examples: `generateLeadMagnetPart1`, `generateFrontEndPart1`, etc.

**Knowledge Search (RAG):**
- Purpose: Retrieve relevant context from knowledge base
- Location: `netlify/functions/lib/knowledge-search.js`
- Pattern: Vector similarity search with metrics logging
- Uses: OpenAI embeddings + Supabase pgvector RPC

**Format Template:**
- Purpose: Define content structure for each product type
- Location: `src/templates/formats/*.jsx`
- Examples: checklist.jsx, worksheet.jsx, blueprint.jsx
- Pattern: React component that renders HTML for PDF

## Entry Points

**Frontend Entry:**
- Location: `src/main.jsx`
- Triggers: Browser loads application
- Responsibilities: Mount React app, wrap with providers

**Route Configuration:**
- Location: `src/App.jsx`
- 13 routes: Dashboard, Profiles, Audiences, Funnels, Lead Magnets, Visual Builder, Settings, Admin, Auth pages

**API Entry (per function):**
- Location: `netlify/functions/*.js`
- Triggers: HTTP request to `/.netlify/functions/{name}`
- Responsibilities: Parse request, execute logic, return response

## Error Handling

**Strategy:** Try-catch at function level, return structured JSON errors

**Patterns:**
- Functions return `{ statusCode, body: JSON.stringify({ error }) }`
- Frontend hooks handle errors with toast notifications
- Console logging with emoji prefixes for debugging

**Retry Logic:**
- Location: `netlify/functions/lib/retry-engine.js`
- Max 3 retries with exponential backoff (5s -> 10s -> 20s)
- Retryable: 429, 500, 529
- Permanent failures: 400, 401, 403, 404, 413

## Cross-Cutting Concerns

**Logging:**
- Backend: `console.log('[TAG] message')` with emoji prefixes
- Frontend: Standard `console.log()`
- RAG metrics: Logged to `rag_retrieval_logs` table

**Validation:**
- Frontend: Form validation in components
- Backend: Basic checks in function handlers
- No schema validation library (manual checks)

**Authentication:**
- Frontend: `useAuth()` hook wraps Supabase Auth
- Backend: Service role key for admin operations
- Admin: `admin_users` table checked by `admin-auth.js`

**Format Enforcement:**
- 6 approved formats only (Checklist, Worksheet, Planner, Swipe File, Blueprint, Cheat Sheet)
- Enforced in prompts: `APPROVED_FORMATS_TEXT` constant
- Location: `netlify/functions/generate-funnel.js`, `batched-generators.js`

---

*Architecture analysis: 2026-01-11*
*Update when major patterns change*
