# Codebase Concerns

**Analysis Date:** 2026-01-11

## Tech Debt

**Unsafe JSON Parsing Without Error Wrapping:**
- Issue: Multiple functions parse `event.body` with `JSON.parse(event.body)` directly without try-catch
- Files:
  - `netlify/functions/check-job-status.js` (line 19)
  - `netlify/functions/start-generation.js` (line 22)
  - `netlify/functions/generate-funnel.js` (line 167)
  - `netlify/functions/generate-lead-magnet-ideas.js` (line 200)
  - `netlify/functions/generate-content.js` (line 104)
  - `netlify/functions/vector-search.js` (line 37)
- Impact: Malformed JSON causes 500 error instead of controlled 400 error
- Fix approach: Wrap all `JSON.parse(event.body)` in try-catch blocks

**Duplicate Client Initialization:**
- Issue: 35+ files initialize Supabase client individually, 11+ files initialize Anthropic client
- Files: All files in `netlify/functions/*.js`
- Why: Each function creates its own client instances
- Impact: Hard to change initialization logic, difficult to mock for testing
- Fix approach: Create centralized client factory in `netlify/functions/lib/clients.js`

**Large Monolithic Files:**
- Issue: Critical generation logic in very large files
- Files:
  - `netlify/functions/lib/batched-generators.js` - 1,466 lines (14 export functions)
  - `netlify/functions/process-generation-background.js` - 1,237 lines
- Impact: Hard to test, debug, and maintain; no function-level error isolation
- Fix approach: Split into individual task files per generator function

## Known Bugs

**Deprecated Code Not Deleted:**
- Symptoms: Deprecated hook file still exists with warning comments
- Trigger: Developer might accidentally import deprecated code
- File: `src/hooks/useBatchedGeneration.jsx` (lines 1-16 contain deprecation warning)
- Workaround: File has extensive comments warning against use
- Root cause: File marked deprecated Jan 4-5, 2026 but not deleted
- Fix: Delete deprecated files after confirming replacement works

## Security Considerations

**Missing Input Size Limits:**
- Risk: No validation on input data sizes in generation endpoints
- Files:
  - `netlify/functions/generate-content.js` (line 104)
  - `netlify/functions/generate-lead-magnet-content-batched.js`
  - `netlify/functions/generate-marketplace-listings.js`
- Current mitigation: None - API accepts any size input
- Recommendations: Add size validation (e.g., max 10KB for product descriptions), validate array lengths

**Admin Auth Single Point:**
- Risk: All admin endpoints depend on single auth module
- Files: `netlify/functions/lib/admin-auth.js` used by:
  - `netlify/functions/admin-check.js`
  - `netlify/functions/admin-create-user.js`
  - `netlify/functions/admin-update-user.js`
  - `netlify/functions/admin-delete-user.js`
- Current mitigation: Centralized auth logic (good pattern)
- Recommendations: Ensure auth module is well-tested

## Performance Bottlenecks

**No significant performance issues detected:**
- Generation uses background functions with 15-min timeout
- Polling interval is 3 seconds (reasonable)
- RAG search has optimized pgvector queries

## Fragile Areas

**Batched Generation System:**
- File: `netlify/functions/lib/batched-generators.js`
- Why fragile: 14 interdependent generation functions in single file
- Common failures: One function failing can leave generation incomplete
- Safe modification: Test each function independently before changes
- Test coverage: **No unit tests** - high risk

**Format Enforcement Logic:**
- Files:
  - `netlify/functions/generate-funnel.js` (line 16-29)
  - `netlify/functions/lib/batched-generators.js`
- Why fragile: Format list duplicated across files
- Common failures: Adding format to one file but not others
- Safe modification: Centralize APPROVED_FORMATS to single source of truth
- Test coverage: None

## Scaling Limits

**Netlify Function Timeout:**
- Current capacity: 15-minute timeout for background functions
- Limit: Very large funnels might exceed timeout
- Symptoms at limit: Generation fails with timeout error
- Scaling path: Split into smaller jobs, add resume capability

**Supabase Connection Limits:**
- Current capacity: Depends on Supabase plan
- Limit: Many concurrent generations could exhaust connections
- Scaling path: Connection pooling, queue rate limiting

## Dependencies at Risk

**No immediate dependency risks detected:**
- React 19 is latest stable
- All major dependencies are actively maintained
- Playwright is well-maintained

## Missing Critical Features

**No Test Coverage for Core Logic:**
- Problem: Critical generation functions have zero test coverage
- Current workaround: Manual testing only
- Blocks: Safe refactoring, confident deployments
- Files needing tests:
  - `netlify/functions/lib/batched-generators.js`
  - `netlify/functions/lib/retry-engine.js`
  - `netlify/functions/lib/task-orchestrator.js`
- Implementation complexity: Medium (need to mock Claude/OpenAI APIs)

## Test Coverage Gaps

**Batched Generators:**
- What's not tested: 14 content generation functions totaling 1,466 lines
- Risk: Generation logic changes could break silently
- Priority: High
- Difficulty to test: Need to mock Claude API responses

**Retry Engine:**
- What's not tested: `netlify/functions/lib/retry-engine.js` (197 lines)
- Risk: Retry logic failures could cause cascading generation failures
- Priority: High
- Difficulty to test: Need to simulate API failures

**Knowledge Search:**
- What's not tested: RAG search and embedding logic
- Risk: RAG changes could degrade content quality silently
- Priority: Medium
- Difficulty to test: Need to mock OpenAI embeddings and pgvector

**Frontend Components:**
- What's not tested: 74 React component files
- Risk: UI regressions undetected
- Priority: Medium
- Difficulty to test: Need to add component testing framework

## Environment Configuration Issues

**Inconsistent Environment Variable Fallbacks:**
- Issue: Some files check both `SUPABASE_URL` and `VITE_SUPABASE_URL`, others only check one
- Files with inconsistent patterns:
  - `netlify/functions/lib/batched-generators.js` (line 17) - has fallback
  - `netlify/functions/admin-check.js` (line 11) - no fallback
  - `netlify/functions/vector-search.js` (line 14) - no fallback
- Impact: Functions may silently fail if only `VITE_SUPABASE_URL` is set
- Fix approach: Standardize to always check both with fallback pattern

## Hardcoded Configuration

**Magic Strings:**
- Files with hardcoded values:
  - `netlify/functions/lib/batched-generators.js` (line 34): `APPROVED_FORMATS` array
  - `netlify/functions/generate-funnel.js` (line 296): `model: 'claude-sonnet-4-20250514'`
  - `netlify/functions/lib/knowledge-search.js` (line 41): `totalChunksInDb: 4349`
- Impact: Updating requires grep-and-replace across files
- Fix approach: Centralize to config module

---

*Concerns audit: 2026-01-11*
*Update as issues are fixed or new ones discovered*
