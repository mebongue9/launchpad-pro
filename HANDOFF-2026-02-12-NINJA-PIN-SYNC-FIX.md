# Handoff: Ninja Pin Sync Field Mapping Fix

**Date:** 2026-02-12
**Status:** Complete & Verified
**Files Modified:** `netlify/functions/sync-to-ninja-pin.js`, `src/pages/LeadMagnetDetails.jsx`

---

## Problem

The `sync-to-ninja-pin` function was returning HTTP 400: `"Missing required titles for: Lead Magnet, Upsell 2, Bundle"` despite all marketplace data existing in the database. The data was there — the code was looking in the wrong place.

Additionally, the POST body sent to the Ninja Pin API used incorrect field names (`product_description` / `product_tags` instead of `marketplace_description` / `marketplace_tags`), which meant even products that passed validation would send malformed data.

---

## Root Cause: 4 Bugs

### Bug 1: Lead Magnet title read from wrong field
- **Code read:** `leadMagnet.marketplace_title` (flat TEXT column)
- **Actual data:** `leadMagnet.marketplace_listing.marketplace_title` (inside JSONB column)
- **Why:** The flat `marketplace_title` column on `lead_magnets` is **always NULL** across all records. The AI content generator writes titles into the `marketplace_listing` JSONB column instead.

### Bug 2: Upsell 2 title/description/tags read from wrong fields
- **Code read:** `funnel.upsell_2_marketplace_title` (flat TEXT column)
- **Actual data:** `funnel.upsell_2.marketplace_listing.marketplace_title` (inside JSONB column)
- **Why:** Same pattern as Lead Magnet — the batched generator writes Upsell 2 data into the `upsell_2` JSONB column's nested `marketplace_listing` object, not flat columns. Flat columns for upsell_2 are **always NULL**.

### Bug 3: Bundle read from empty `bundles` table
- **Code read:** Queried the `bundles` table which has **zero rows**
- **Actual data:** `funnel.bundle_listing` (JSONB column on the `funnels` table)
- **Why:** The bundle generator writes directly to `funnels.bundle_listing` JSONB, not to a separate `bundles` table. The bundles table exists but was never populated.

### Bug 4: POST body used wrong field names
- **Code sent:** `product_description`, `product_tags`
- **API expected:** `marketplace_description`, `marketplace_tags`
- **Why:** Field names didn't match the Ninja Pin API spec (`sync-from-launchpad` edge function).

---

## Fix Applied

All fixes in `netlify/functions/sync-to-ninja-pin.js`:

### Lead Magnet title (Bug 1)
```javascript
// Before:
if (!leadMagnet.marketplace_title) missingTitles.push('Lead Magnet');

// After:
const lmTitle = leadMagnet.marketplace_title
  || leadMagnet.marketplace_listing?.marketplace_title || null;
if (!lmTitle) missingTitles.push('Lead Magnet');
```

### Funnel levels with JSONB fallback (Bug 2)
```javascript
// Before:
if (!funnel[`${level.prefix}_marketplace_title`]) missingTitles.push(level.label);

// After:
const title = funnel[`${level.prefix}_marketplace_title`]
  || funnel[level.prefix]?.marketplace_listing?.marketplace_title || null;
if (!title) missingTitles.push(level.label);
```
Same pattern applied to `marketplace_description` and `marketplace_tags` in payloads.

### Bundle from JSONB (Bug 3)
```javascript
// Before:
const bundle = bundles && bundles.length > 0 ? bundles[0] : null;
// Then used bundle.title, bundle.etsy_description, bundle.tags

// After:
const bundleData = bundle
  ? { title: bundle.title, description: bundle.etsy_description, tags: bundle.tags }
  : funnel.bundle_listing
    ? { title: funnel.bundle_listing.title, description: funnel.bundle_listing.etsy_description, tags: funnel.bundle_listing.tags }
    : null;
```

### POST body field names (Bug 4)
```javascript
// Before:
product_description: ...,
product_tags: ...,

// After:
marketplace_description: ...,
marketplace_tags: ...,
```

---

## Frontend Changes (LeadMagnetDetails.jsx)

Added "Sync to Ninja Pin" button to the lead magnet details page:
- Only shows when funnel status is `ready`
- Calls `/.netlify/functions/sync-to-ninja-pin` with `lead_magnet_id`
- Shows confirmation dialog before syncing
- Displays success/failure toast with product counts
- Refreshes data after successful sync to show `ninja_pin_synced_at` timestamp

---

## Data Location Reference (verified via live DB queries)

| Product | Title Source | Description Source | Tags Source | Tags Format |
|---|---|---|---|---|
| Lead Magnet | `marketplace_listing.marketplace_title` (JSONB) | `marketplace_listing.marketplace_description` (JSONB) | `marketplace_listing.marketplace_tags` (JSONB) | JSON array |
| Front-End | `front_end_marketplace_title` (flat TEXT) | `front_end_etsy_description` (flat TEXT) | `front_end_marketplace_tags` (flat TEXT) | Comma-separated string |
| Bump | `bump_marketplace_title` (flat TEXT) | `bump_etsy_description` (flat TEXT) | `bump_marketplace_tags` (flat TEXT) | Comma-separated string |
| Upsell 1 | `upsell_1_marketplace_title` (flat TEXT) | `upsell_1_etsy_description` (flat TEXT) | `upsell_1_marketplace_tags` (flat TEXT) | Comma-separated string |
| Upsell 2 | `upsell_2.marketplace_listing.marketplace_title` (JSONB) | `upsell_2.marketplace_listing.marketplace_description` (JSONB) | `upsell_2.marketplace_listing.marketplace_tags` (JSONB) | JSON array |
| Bundle | `bundle_listing.title` (JSONB on funnels) | `bundle_listing.etsy_description` (JSONB on funnels) | `bundle_listing.tags` (JSONB on funnels) | Comma-separated string |

**Pattern:** Front-End, Bump, Upsell 1 use flat TEXT columns. Lead Magnet, Upsell 2, Bundle use JSONB columns. The `normalizeTagsToString()` helper handles both JSON arrays and comma-separated strings.

---

## Verification

Sync tested with lead magnet `05b55206-4aad-4c36-a0bb-9edbac84711f`:
- All 6 products returned HTTP 200 from Ninja Pin API
- Each received a `task_id` confirming task creation
- `ninja_pin_synced_at` updated on the lead_magnets row
- Receiving end (Etsy Empire) confirmed data arrived and displays correctly

---

## Lessons Learned

1. **The database has two storage patterns** — Batch 1 (front_end, bump, upsell_1) writes to flat TEXT columns. Batch 2 (upsell_2) and lead magnets/bundles write to JSONB columns. Any code reading marketplace data must check both.
2. **The `bundles` table is empty** — all bundle data lives in `funnels.bundle_listing` JSONB. Don't query the bundles table expecting data.
3. **Always verify field names against the receiving API spec** — `product_description` vs `marketplace_description` is the kind of silent failure that returns 200 but stores nothing useful.
4. **Flat columns can be permanently NULL** — `lead_magnets.marketplace_title` and `funnels.upsell_2_marketplace_title` are never written to. The generators skip them and go straight to JSONB.
