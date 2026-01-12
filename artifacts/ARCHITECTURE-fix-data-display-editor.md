# Architecture: Fix Data Display and Editor

## Overview
FIX EXISTING FUNCTIONALITY - No new features being added.
This addresses bugs where EXISTING generated content is not displaying in the UI due to data storage location mismatches. The email sequences, marketplace listings, and bundle features ALREADY EXIST in the codebase - they just have a bug where the UI reads from wrong locations.

## This is a BUG FIX - NOT NEW FUNCTIONALITY
- Email sequences: ALREADY in codebase (useEmailSequences.js, EmailSequencePreview.jsx)
- Marketplace listings: ALREADY in codebase (useMarketplaceListings.js, MarketplaceListings.jsx)
- Bundle preview: ALREADY in codebase (useBundles.js, BundlePreview.jsx)
- Content editor: ALREADY in codebase (ContentEditor.jsx)

The bug is: generators save to JSONB columns, but UI hooks read from wrong locations.

## Issues Being Fixed
1. Marketplace listings not showing (data mismatch - stored in JSONB, UI reads separate columns)
2. Email sequences not showing (data mismatch - stored in JSONB, UI reads separate table)
3. TinyMCE editor requires API key (replace with free Quill editor)
4. Lead magnets have no View/Edit actions
5. Status labels out of sync with new workflow
6. Bundle listing display issues

## Files to Modify

### Hooks (Data Layer)
| File | Change |
|------|--------|
| `/src/hooks/useMarketplaceListings.js` | Read from JSONB structure instead of separate columns |
| `/src/hooks/useEmailSequences.js` | Read from JSONB structure instead of separate table |
| `/src/hooks/useLeadMagnets.js` | Add content fetching for view/edit |
| `/src/hooks/useBundles.js` | Read bundle from JSONB structure |

### Components (UI Layer)
| File | Change |
|------|--------|
| `/src/components/editor/ContentEditor.jsx` | Replace TinyMCE with Quill |
| `/src/components/funnel/MarketplaceListings.jsx` | Adapt to new data structure |
| `/src/components/funnel/EmailSequencePreview.jsx` | Adapt to new data structure |
| `/src/components/funnel/BundlePreview.jsx` | Adapt to new data structure |
| `/src/components/funnel/FunnelCard.jsx` | Update status labels |

### Pages
| File | Change |
|------|--------|
| `/src/pages/LeadMagnetBuilder.jsx` | Add View/Edit modal for lead magnets |
| `/src/pages/FunnelDetails.jsx` | Minor fixes for data display |

### Dependencies
| Package | Purpose |
|---------|---------|
| `react-quill` | Free WYSIWYG editor replacement |

## Data Structure Reference

### Marketplace Listings (stored in JSONB)
```json
{
  "front_end": {
    "marketplace_listing": {
      "marketplace_title": "...",
      "marketplace_description": "...",
      "marketplace_bullets": ["..."],
      "marketplace_tags": ["..."]
    }
  }
}
```

### Email Sequences (stored in JSONB)
```json
{
  "front_end": {
    "email_sequence": [
      { "subject": "...", "preview": "...", "body": "..." },
      { "subject": "...", "preview": "...", "body": "..." },
      { "subject": "...", "preview": "...", "body": "..." }
    ]
  }
}
```

### Lead Magnet Emails (stored in lead_magnets table)
```json
{
  "email_sequence": [
    { "subject": "...", "preview": "...", "body": "..." }
  ]
}
```

## Status Workflow
- `draft` - Initial state
- `in_progress` - Generation running
- `ready` - Text content complete
- `complete` - All content including visuals done
