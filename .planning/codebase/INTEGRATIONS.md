# External Integrations

**Analysis Date:** 2026-01-11

## APIs & External Services

**AI/LLM - Claude API (Anthropic):**
- SDK: @anthropic-ai/sdk 0.71.2 - `package.json`
- Auth: `ANTHROPIC_API_KEY` env var
- Model: `claude-sonnet-4-20250514`
- Max tokens: 4096-8192 depending on endpoint
- Endpoints using Claude:
  - `netlify/functions/generate-funnel.js` - Funnel architecture generation
  - `netlify/functions/generate-content.js` - Product content generation
  - `netlify/functions/lib/batched-generators.js` - 14 batched generation functions
  - `netlify/functions/generate-lead-magnet-ideas.js` - Lead magnet ideation
  - `netlify/functions/generate-lead-magnet-content.js` - Lead magnet content

**AI/LLM - OpenAI (Embeddings):**
- SDK: openai 6.15.0 - `package.json`
- Auth: `OPENAI_API_KEY` env var
- Model: `text-embedding-3-small`
- Vector dimension: 1536
- Integration: `netlify/functions/lib/knowledge-search.js`
- Purpose: Vector embeddings for RAG knowledge base search

## Data Storage

**Databases:**
- PostgreSQL on Supabase - Primary data store
  - Connection: `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` env vars
  - Client: @supabase/supabase-js v2.89.0
  - Frontend client: `src/lib/supabase.js`
  - Extension: pgvector for vector similarity search
  - Migrations: `supabase/migrations/`

**Database Tables (inferred):**
- `knowledge_chunks` - Vector-stored knowledge base (4349 chunks)
- `rag_retrieval_logs` - RAG operation audit logs
- `generation_jobs` - Async job tracking
- `funnels` - Funnel architectures
- `lead_magnets` - Lead magnet content
- `profiles` - Creator profiles
- `audiences` - Target audiences
- `admin_users` - Admin role assignments

**File Storage:**
- Supabase Storage - User uploads (logos, photos)
- SDK: @supabase/supabase-js
- Buckets: avatars, profile-images

**Caching:**
- None currently configured

## Authentication & Identity

**Auth Provider:**
- Supabase Auth - Email/password authentication
- Implementation: `src/hooks/useAuth.jsx`
- Token storage: Browser localStorage (Supabase default)
- Session management: Supabase built-in JWT handling

**OAuth Integrations:**
- None currently configured

## Monitoring & Observability

**Error Tracking:**
- None currently configured (console.log/console.error only)

**Analytics:**
- None currently configured

**Logs:**
- Netlify function logs - stdout/stderr
- RAG metrics logged to `rag_retrieval_logs` table

## CI/CD & Deployment

**Hosting:**
- Netlify - Frontend + serverless functions
  - Build command: `npm run build`
  - Publish directory: `dist`
  - Functions directory: `netlify/functions`
  - Config: `netlify.toml`

**CI Pipeline:**
- Not explicitly configured (Netlify auto-deploy from Git)

**Deployment:**
- Automatic on main branch push
- URL: `https://launchpad-pro-app.netlify.app`

## Environment Configuration

**Development:**
- Required env vars:
  - `VITE_SUPABASE_URL` - Supabase project URL
  - `VITE_SUPABASE_ANON_KEY` - Supabase public key
  - `SUPABASE_SERVICE_ROLE_KEY` - Supabase admin key (server-side)
  - `ANTHROPIC_API_KEY` - Claude API key
  - `OPENAI_API_KEY` - OpenAI API key
- Template: `.env.example`
- Local file: `.env` (gitignored)

**Production:**
- Secrets management: Netlify environment variables dashboard
- Same variable names as development

## Webhooks & Callbacks

**Incoming:**
- None currently configured

**Outgoing:**
- None currently configured

## Function Endpoints

**Netlify Functions (40+ endpoints):**

*Generation:*
- `generate-funnel.js` - Funnel architecture
- `generate-lead-magnet-ideas.js` - Lead magnet ideation
- `generate-funnel-content-batched.js` - Full funnel content
- `generate-lead-magnet-content-batched.js` - Lead magnet content
- `start-generation.js` - Create async job
- `check-job-status.js` - Poll job progress
- `process-generation-background.js` - Background processor

*Admin:*
- `admin-check.js` - Verify admin status
- `admin-create-user.js` - Create user
- `admin-update-user.js` - Update user
- `admin-delete-user.js` - Delete user
- `admin-list-users.js` - List users

*Search:*
- `vector-search.js` - RAG similarity search

*Settings:*
- `get-app-settings.js` - Get global config
- `update-app-settings.js` - Update global config

---

*Integration audit: 2026-01-11*
*Update when adding/removing external services*
