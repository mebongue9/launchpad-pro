# ARCHITECTURE: Vision Corrections (FIX 4 & FIX 6)
**Task ID:** corrections-002
**Date:** 2026-01-05
**Requirements Reference:** docs/LAUNCHPAD-PRO-VISION.md, HANDOFF-2026-01-05.md

## Approach Summary
Implement remaining corrections from vision document:
1. FIX 4: Add "Mention Price" toggle to existing products form
2. FIX 6: Add freshness check when generating funnel ideas
3. FIX 6b: Add same freshness check to lead magnet idea generation

## Files to Modify

### FIX 4: Mention Price Toggle
| File Path | Purpose |
|-----------|---------|
| `/src/components/existing-products/ExistingProductForm.jsx` | Add mention_price boolean field |
| `/src/hooks/useExistingProducts.jsx` | Already supports new fields via spread operator |

### FIX 6: Freshness Check for Funnel Ideas
| File Path | Purpose |
|-----------|---------|
| `/netlify/functions/generate-funnel.js` | Query previous funnels, add to prompt |
| `/src/hooks/useFunnels.jsx` | Pass user_id to generation endpoint |

### FIX 6b: Freshness Check for Lead Magnet Ideas (Same Logic)
| File Path | Purpose |
|-----------|---------|
| `/netlify/functions/generate-lead-magnet-ideas.js` | Query previous lead magnets, add to prompt |
| `/src/hooks/useLeadMagnets.jsx` | Pass user_id to generation endpoint |

## Files to Create
None - all changes are modifications to existing files.

## Technical Decisions

### FIX 4: Database Column Addition
**Decision:** Add `mention_price` boolean column to `existing_products` table
**Default:** `false` (don't mention price by default)
**Rationale:** Per vision doc - "Optionally mentions the price (if user enabled that setting)"

### FIX 6: Freshness Implementation
**Decision:** Query last 10 funnels, extract product names, add to prompt as "avoid these"
**Rationale:** Per vision doc - "System checks previous funnels to ensure this is FRESH (no repeat titles/concepts)"

## Dependencies
No new dependencies required.

## Risks and Mitigations
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| mention_price column missing | Low | Medium | Column already exists from FIX 5 implementation |
| Freshness check adds latency | Low | Low | Single efficient query, minimal overhead |

## Acceptance Criteria
1. [ ] ExistingProductForm shows "Mention price" checkbox
2. [ ] Checkbox value saved/loaded correctly to database
3. [ ] Funnel generation queries previous funnel names
4. [ ] Generated funnels don't repeat previous product names

## Approval Checklist
- [x] Approach is the simplest that meets requirements
- [x] No unnecessary complexity
- [x] Fits existing codebase patterns
- [x] Risks are acceptable

**Status:** APPROVED

---
*Architecture reviewed and approved. Development may proceed.*
