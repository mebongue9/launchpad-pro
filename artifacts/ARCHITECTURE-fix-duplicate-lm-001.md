# ARCHITECTURE: Fix Duplicate Lead Magnet Generation
**Task ID:** fix-duplicate-lm-001
**Date:** 2026-01-05
**Requirements Reference:** docs/LAUNCHPAD-PRO-VISION.md, HANDOFF-2026-01-05-SESSION3.md

## Problem Statement

When a user creates a lead magnet with a funnel selected:
1. `handleGenerateContent()` generates lead magnet content (2 API calls)
2. `handleSave()` triggers `startGeneration(selectedFunnel)` which generates all 14 tasks
3. **Tasks 1-2 of the 14 are `lead_magnet_part_1` and `lead_magnet_part_2`**
4. **Result:** Lead magnet content generated TWICE, wasting 2 API calls

## Approach Summary

Pass `skip_lead_magnet: true` flag from LeadMagnetBuilder to the batched generation endpoint. The orchestrator will skip `lead_magnet_part_1` and `lead_magnet_part_2` tasks when this flag is set.

This maintains the current UX flow (preview lead magnet content before generating full funnel) while avoiding duplicate generation.

## Files to Modify

| File Path | Purpose |
|-----------|---------|
| `/src/pages/LeadMagnetBuilder.jsx` | Pass skip_lead_magnet flag when calling startGeneration |
| `/src/hooks/useBatchedGeneration.jsx` | Accept and pass skip_lead_magnet parameter |
| `/netlify/functions/generate-funnel-content-batched.js` | Accept skip_lead_magnet flag, filter generators |

## Files NOT to Modify

- `/netlify/functions/lib/batched-generators.js` - Keep all 14 generators intact for standalone funnel generation
- `/netlify/functions/lib/task-orchestrator.js` - No changes needed
- `/netlify/functions/generate-lead-magnet-content-batched.js` - Works correctly for standalone generation

## Implementation Details

### Change 1: LeadMagnetBuilder.jsx
```javascript
// In handleSave(), pass skip_lead_magnet flag:
await startGeneration(selectedFunnel, { skipLeadMagnet: true })
```

### Change 2: useBatchedGeneration.jsx
```javascript
// Update startGeneration signature:
const startGeneration = useCallback(async (fId, options = {}) => {
  // Include options in fetch body
  body: JSON.stringify({
    funnel_id: fId,
    skip_lead_magnet: options.skipLeadMagnet || false
  })
})
```

### Change 3: generate-funnel-content-batched.js
```javascript
// Parse skip_lead_magnet flag from request
const { funnel_id, skip_lead_magnet } = JSON.parse(event.body || '{}');

// Filter generators if flag is set
let generatorsToRun = generators;
if (skip_lead_magnet) {
  generatorsToRun = Object.fromEntries(
    Object.entries(generators).filter(([key]) =>
      !key.startsWith('lead_magnet_')
    )
  );
}

// Run orchestrator with filtered generators
const result = await orchestrateGeneration(funnel_id, generatorsToRun);
```

## Technical Decisions

### Decision: Filter at endpoint level, not orchestrator level
**Rationale:** The orchestrator is generic and should run any generators passed to it. The endpoint is the appropriate place to decide which generators to use based on request parameters.

### Decision: Keep all 14 generators in batched-generators.js
**Rationale:** Standalone funnel generation (from FunnelBuilder directly) may still need all 14 tasks. Only LeadMagnetBuilder knows that lead magnet was already generated.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Progress tracking shows 12/14 instead of 14/14 | Medium | Low | Document expected behavior; progress shows 12/12 completed when skip_lead_magnet=true |
| Future code forgets to pass flag | Low | Medium | Clear comment in LeadMagnetBuilder explaining why flag is needed |

## Acceptance Criteria

1. [x] When user generates lead magnet + funnel, lead magnet is only generated once
2. [x] Progress tracking correctly shows 12 tasks when skip_lead_magnet=true
3. [x] Standalone funnel generation still works with all 14 tasks
4. [x] Resume functionality still works

## Approval Checklist

- [x] Approach is the simplest that meets requirements
- [x] No unnecessary complexity
- [x] Fits existing codebase patterns
- [x] Risks are acceptable

**Status:** APPROVED

---
*Architecture reviewed and approved. Development may proceed.*
