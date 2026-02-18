# HANDOFF: Deterministic Pricing Fix

**Date:** February 18, 2026
**Status:** DEPLOYED & VERIFIED
**Commit:** (see git log)

---

## 1. What Was The Problem

The Settings UI lets the user save default prices ($9.99 / $6.99 / $12.99 / $19.99) to the `app_settings` table. But when a funnel was generated, the AI chose its own prices ($17 / $9 / $47 / $97). The Settings page was **write-only** — it saved data but nothing in the generation pipeline read it back.

**Broken funnel as evidence:**
```
Funnel ID: cbd0e997-e485-4f29-bc72-df493146f759
Created:   2026-02-18T06:34:03Z (AFTER the first "fix" deploy)
Prices:    FE=$17, Bump=$9, U1=$47, U2=$97
Expected:  FE=$9.99, Bump=$6.99, U1=$12.99, U2=$19.99
```

---

## 2. What Mistake Was Made (And Why)

### The Wrong File Was Fixed

The initial fix was applied to `netlify/functions/generate-funnel.js`. This file exists and has the right prompt, but **the frontend UI never calls it**.

The actual code path the UI uses is:

```
FunnelBuilder.jsx
  -> useFunnels.jsx:generateFunnel() (line 82)
    -> POST /.netlify/functions/create-funnel-idea-task
    -> POST /.netlify/functions/process-funnel-idea-task-background (fire & forget)
    -> GET  /.netlify/functions/get-funnel-idea-task (polling until complete)
```

`process-funnel-idea-task-background.js` is the background task system. It has a **full copy** of the prompt from `generate-funnel.js` (the file header even says "COPIED FROM generate-funnel.js"). The fix was applied to the original, not the copy that actually runs.

### The Test Was Invalid

The test called `generate-funnel.js` directly via curl:
```bash
curl -X POST .../generate-funnel  # <-- WRONG endpoint
```

This returned correct prices because the fix WAS in that file. But the UI never hits that endpoint. A valid test must go through the real path:
```bash
curl -X POST .../create-funnel-idea-task     # Step 1: create task
curl -X POST .../process-funnel-idea-task-background  # Step 2: trigger
curl        .../get-funnel-idea-task?task_id=...      # Step 3: poll
```

### Root Cause of the Mistake

The developer did not trace the actual code path from the frontend before writing the fix. The assumption was that `generate-funnel.js` was the endpoint — a reasonable assumption given the file name, but wrong. The `useFunnels.jsx` hook was not read until the post-mortem investigation.

**Lesson:** Always start from the frontend hook/component that triggers the action and trace the exact API calls it makes. Never assume based on file names.

---

## 3. The Two Duplicate Code Paths

| | `generate-funnel.js` | `process-funnel-idea-task-background.js` |
|---|---|---|
| **Called by UI?** | NO | YES |
| **Type** | Synchronous Netlify function (10s timeout) | Background function (15min timeout) |
| **Has duplicate prompt?** | Yes (original) | Yes (copy, header says "COPIED FROM generate-funnel.js") |
| **Has price override now?** | Yes (line 261) | Yes (line 288) |
| **Has title validation?** | No | Yes |

Both files now have the deterministic price override. Any future prompt or pricing changes must be applied to BOTH files.

---

## 4. All Files Modified

### File 1: `netlify/functions/process-funnel-idea-task-background.js` (THE CRITICAL FIX)

**Change A — Prompt pricing guidelines (line 84-89):**
```
BEFORE: Front-End: $7-17 / Bump: $7-17 / Upsell 1: $27-47 / Upsell 2: $47-97 / Upsell 3: $97-297
AFTER:  Front-End: $9.99 / Bump: $6.99 / Upsell 1: $12.99 / Upsell 2: $19.99
```

**Change B — JSON template prices (lines 108, 115, 122, 129):**
```
BEFORE: 17, 9, 47, 97 (plus upsell_3 at 197)
AFTER:  9.99, 6.99, 12.99, 19.99 (upsell_3 removed)
```

**Change C — Deterministic price override (lines 288-317):**
After `parseClaudeJSON()`, queries `app_settings` for `default_price_front_end/bump/upsell_1/upsell_2`, then FORCES those prices onto the parsed funnel object. AI output is overwritten regardless of what it returns.

### File 2: `netlify/functions/generate-funnel.js` (backup path, not used by UI)

**Change A — Added Supabase client (lines 9, 17-20):**
```javascript
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
```

**Change B — Deterministic price override (lines 261-290):**
Same override block as in `process-funnel-idea-task-background.js`.

### File 3: `netlify/functions/lib/batched-generators.js` (marketplace prompt fallbacks)

Four stale fallback prices in marketplace listing prompts updated:

| Line | Before | After |
|------|--------|-------|
| 1593 | `frontend?.price \|\| '17'` | `frontend?.price \|\| '9.99'` |
| 1599 | `bump?.price \|\| '9'` | `bump?.price \|\| '6.99'` |
| 1798 | `upsell1?.price \|\| '47'` | `upsell1?.price \|\| '12.99'` |
| 1804 | `upsell2?.price \|\| '97'` | `upsell2?.price \|\| '19.99'` |

These are cosmetic (only affect prompt context for Etsy description generation), but they should match reality so the AI writes correct price references.

### File 4: `src/lib/utils.js` (frontend price defaults)

`getDefaultPrice()` now exported and accepts optional overrides:
```javascript
// BEFORE (line 81, not exported):
function getDefaultPrice(type) {
  const prices = { lead_magnet: 0, front_end: 9.99, bump: 6.99, upsell_1: 12.99, upsell_2: 19.99 }
  return prices[type] || 9.99
}

// AFTER (line 81, exported):
export function getDefaultPrice(type, overrides = null) {
  if (overrides && overrides[type] != null) return overrides[type]
  const prices = { lead_magnet: 0, front_end: 9.99, bump: 6.99, upsell_1: 12.99, upsell_2: 19.99 }
  return prices[type] || 9.99
}
```

`parseFunnelLine()` and `parseFunnelText()` updated to accept and pass through `priceOverrides` parameter.

### File 5: `src/pages/FunnelBuilder.jsx` (frontend settings loader)

**Added `useEffect` (lines 49-69):** On mount, fetches `/.netlify/functions/get-app-settings`, parses `default_price_*` values, stores in `pricingDefaults` state.

**Updated call sites:**
- `parseFunnelText(pasteText, pricingDefaults)` — paste parser uses settings prices
- `getDefaultPrice('front_end', pricingDefaults)` — manual entry fallbacks use settings prices
- Same for bump and upsell_1

---

## 5. How The Deterministic Override Works

The override is a belt-and-suspenders approach:

1. **Prompt tells AI the prices** (so it includes them in the JSON naturally)
2. **After AI returns JSON**, the code queries `app_settings` for the real prices
3. **Regardless of what AI returned**, the code overwrites `funnel.front_end.price`, `funnel.bump.price`, etc.
4. **If `app_settings` query fails**, hardcoded fallbacks ($9.99/$6.99/$12.99/$19.99) are used

This means the AI literally cannot set wrong prices. The override runs after parse, before the result is stored.

---

## 6. Test Results (Via Real UI Path)

### Test 1: Default Prices
```
app_settings: FE=$9.99, Bump=$6.99, U1=$12.99, U2=$19.99
Path: create-funnel-idea-task -> process-funnel-idea-task-background -> poll
Result: FE=9.99, Bump=6.99, U1=12.99, U2=19.99
PASSED
```

### Test 2: Changed Price
```
Changed: default_price_front_end = 14.99
Path: create-funnel-idea-task -> process-funnel-idea-task-background -> poll
Result: FE=14.99, Bump=6.99, U1=12.99, U2=19.99
PASSED (reverted to 9.99 after test)
```

---

## 7. Rules For Future Changes (Prevent Recurrence)

1. **ALWAYS trace from the frontend hook** before modifying any backend endpoint. Open `useFunnels.jsx` (or whatever hook) and follow the actual `fetch()` calls.

2. **Two files have duplicate prompts** and must BOTH be updated:
   - `netlify/functions/generate-funnel.js`
   - `netlify/functions/process-funnel-idea-task-background.js`

3. **Tests must go through the real UI path.** Never test by calling an endpoint directly unless you have confirmed that endpoint is what the UI actually calls. The real test flow is:
   ```
   POST /create-funnel-idea-task -> POST /process-funnel-idea-task-background -> GET /get-funnel-idea-task (poll)
   ```

4. **Price changes go in `app_settings` table**, not in code. The deterministic override reads from the database. To change default prices:
   ```sql
   UPDATE app_settings SET value = '14.99' WHERE key = 'default_price_front_end';
   ```

5. **The `generate-funnel.js` file is effectively dead code** for the UI. It exists and works if called directly, but the UI's background task system bypasses it entirely. Consider consolidating in the future.

---

## 8. Current State of `app_settings` Prices

```sql
SELECT key, value FROM app_settings WHERE key LIKE 'default_price_%';
```
```
default_price_front_end  = 9.99
default_price_bump       = 6.99
default_price_upsell_1   = 12.99
default_price_upsell_2   = 19.99
```

---

**END OF HANDOFF**
