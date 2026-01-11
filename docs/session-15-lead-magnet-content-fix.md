# Session 15 Handoff: Lead Magnet Content Generation Fix

**Date:** January 11, 2026
**Status:** COMPLETED - Tested and Working
**Commit:** bbda416

---

## What Was Fixed

The Lead Magnet Content generation feature was completely broken due to two critical bugs:

### Bug 1: Invalid Database Schema Assumptions (FK Relationships)

**Error:** `"Could not find a relationship between 'funnels' and 'existing_products'"`

**Root Cause:** The `getFunnelData()` function in `batched-generators.js` tried to use FK relationships that don't exist:
```javascript
// BROKEN - These FK relationships don't exist
frontend:existing_products!funnels_front_end_product_id_fkey(*)
bump:existing_products!funnels_bump_product_id_fkey(*)
upsell1:existing_products!funnels_upsell1_product_id_fkey(*)
upsell2:existing_products!funnels_upsell2_product_id_fkey(*)
```

**Actual Schema (Verified via Supabase API):**
- `front_end`, `bump`, `upsell_1`, `upsell_2` are **JSONB columns** in funnels table, NOT FK relationships
- Only valid FK is `existing_product_id` → existing_products (for main product)
- `lead_magnets.funnel_id` → funnels (reversed FK direction)

**Fix Applied:** Rewrote `getFunnelData()` to:
1. Query only valid FK joins (main_product, profile, audience)
2. Query lead_magnet separately via `funnel_id`
3. Return JSONB data directly as `frontend`, `bump`, `upsell1`, `upsell2`

### Bug 2: Wrong Column Names (title vs name)

**Error:** `"Cannot read properties of null (reading 'title')"`

**Root Cause:** Code used `lead_magnet.title` and `lead_magnet.subtitle` but the table uses `name` and `topic`:

```javascript
// BROKEN
lead_magnet.title    // Column doesn't exist
lead_magnet.subtitle // Column doesn't exist

// CORRECT
lead_magnet.name     // Actual column
lead_magnet.topic    // Actual column
```

**Fix Applied:** Changed all 14 occurrences of `lead_magnet.title` → `lead_magnet?.name` and `lead_magnet.subtitle` → `lead_magnet?.topic` with null safety.

### Bug 3: Wrong Content Storage Columns

**Root Cause:** Code tried to save to `cover_data` and `chapters` columns that don't exist in `lead_magnets` table.

**Actual Schema:**
```
lead_magnets table:
- id, user_id, funnel_id, profile_id
- name, format, topic, keyword
- content (text, nullable) ← WHERE GENERATED CONTENT GOES
- created_at, updated_at, tldr, etc.
```

**Fix Applied:**
- Part 1: Saves `{cover, chapters:[1,2,3]}` to `content` column as JSON
- Part 2: Reads from `content` column, saves complete `{cover, chapters:[1,2,3,4,5]}` back

---

## Files Modified

### 1. `netlify/functions/lib/batched-generators.js`

| Lines | Change |
|-------|--------|
| 60-96 | Replaced `getFunnelData()` - removed invalid FK joins, query lead_magnet separately |
| 138-169 | Fixed `generateLeadMagnetPart1()` - use `name`/`topic` instead of `title`/`subtitle` |
| 223-240 | Part 1 content storage - save to `content` column as JSON |
| 255-291 | Fixed `generateLeadMagnetPart2()` - use correct column names, null safety |
| 331-349 | Part 2 content storage - save complete content to `content` column |
| 966-970 | Fixed TLDRs generator - null safety |
| 1033 | Fixed marketplace batch 1 - null safety |
| 1165-1166 | Fixed emails generator - null safety |
| 1246-1250 | Fixed bundle listing - null safety |

### 2. Previously Modified (Session 14)
- `src/hooks/useGenerationJob.jsx` - Added `funnelId` parameter
- `src/pages/LeadMagnetBuilder.jsx` - Passes `selectedFunnel` to generate call
- `netlify/functions/process-generation-background.js` - Uses batched generators

---

## Verified Database Schema

Queried directly from Supabase API:

### lead_magnets table:
```
id, user_id, funnel_id, profile_id, name, format, topic, keyword,
content (NULL), caption_comment, caption_dm, html_url, pdf_url,
style_used, created_at, updated_at, tldr, marketplace_title,
etsy_description, normal_description, marketplace_tags
```

### funnels table:
```
id, user_id, profile_id, audience_id, existing_product_id,
front_end (JSONB), bump (JSONB), upsell_1 (JSONB), upsell_2 (JSONB),
status, created_at, updated_at, language, ...
```

### existing_products table:
```
id, user_id, profile_id, name, description, price, link, angle,
format, created_at, updated_at, url, who_its_for, problem_solved,
key_benefits, transformation, tldr, mention_price
```

---

## Data Flow (How It Works Now)

```
User clicks "Generate Lead Magnet Content"
         ↓
process-generation-background.js receives job
         ↓
Case 'lead_magnet_content':
  1. generateLeadMagnetPart1(funnelId)
     - Calls getFunnelData(funnelId)
     - Generates cover + chapters 1-3
     - Saves to lead_magnets.content as JSON
     - Returns {cover, chapter1, chapter2, chapter3}
         ↓
  2. generateLeadMagnetPart2(funnelId)
     - Reads Part 1 from lead_magnets.content
     - Generates chapters 4-5 with cross-promo
     - Saves complete content to lead_magnets.content
     - Returns {chapter4, chapter5}
         ↓
Frontend displays content in review section
```

---

## Batching Is Preserved (MANDATORY)

**Why 2 API calls are required:**
- Claude has ~4,096 token output limit
- Complete lead magnet = 5 chapters + cover = 4,000-8,000+ tokens
- Single call would truncate mid-sentence, break JSON, crash

**Current structure:**
1. Part 1: Cover + Chapters 1-3 (~2,500 tokens)
2. Part 2: Chapters 4-5 + cross-promo (~1,500 tokens)

---

## Deployment Notes

- **Must use `--skip-functions-cache`** when deploying to Netlify
- Previous deploys were using cached functions with old broken code
- Command: `netlify deploy --prod --skip-functions-cache`

---

## What Works Now

- [x] Lead Magnet Content generation (2 batched API calls)
- [x] RAG panel shows green (chunks retrieved)
- [x] Content displays in review section
- [x] No schema errors
- [x] No null reference errors

---

## What Still Needs Testing

- [ ] Funnel Content generation (uses same batched generators)
- [ ] Front-End, Bump, Upsell generation
- [ ] TLDRs, Marketplace listings, Emails generation
- [ ] Bundle listing generation

---

## Key Lessons Learned

1. **ALWAYS verify database schema before writing code**
   - Query actual tables via Supabase API
   - Don't assume column names or FK relationships

2. **Netlify caches functions**
   - Use `--skip-functions-cache` for fresh deploys
   - Git push alone may not trigger fresh function builds

3. **lead_magnets table uses `name` not `title`**
   - This is a common gotcha in this codebase

---

## Commands for Future Reference

```bash
# Query lead_magnets schema (use service key from .env)
SERVICE_KEY="your-service-key"
curl -s "https://psfgnelrxzdckucvytzj.supabase.co/rest/v1/lead_magnets?select=*&limit=1" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY"

# Query funnels schema
curl -s "https://psfgnelrxzdckucvytzj.supabase.co/rest/v1/funnels?select=*&limit=1" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY"

# Deploy without cache
netlify deploy --prod --skip-functions-cache

# Check for .title references
grep -n "\.title" netlify/functions/lib/batched-generators.js
```

---

## Git History

```
bbda416 fix: Null safety for .title access - use correct schema columns
99c0e87 fix: Lead Magnet Content generation - schema-verified fix
a1b8a72 docs: Add Session 14 handoff - Admin RAG Logs Panel
```

---

**END OF SESSION 15 HANDOFF**
