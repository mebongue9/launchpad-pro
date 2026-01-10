# ARCHITECTURE: Front-End Link + Content Editor

**Date:** 2026-01-10
**Status:** APPROVED by Change Management Supervisor
**Task Document:** `/Users/martinebongue/Downloads/TASK-FRONTEND-LINK-AND-CONTENT-EDITOR.md`

---

## OVERVIEW

Implement two features as specified in the task document:
1. **Front-End Link field** in Funnel Builder
2. **Content Editor** for editing generated content

---

## FEATURE 1: Front-End Link Field

### Database Change
```sql
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS front_end_link TEXT;
```

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/FunnelBuilder.jsx` | Add `frontEndLink` state and URL input field in BOTH AI and Paste modes |
| `src/hooks/useFunnels.jsx` | Add `front_end_link` parameter to `saveFunnel` function |
| `src/components/common/LanguageSelector.jsx` | Add `w-full max-w-xs` to fix width |
| `netlify/functions/generate-lead-magnet-content-batched.js` | Include front_end_link in bridge section prompt |

### UI Placement (Per Vision Document Part 3, Step 1)
- Field appears AFTER Main Product selector, BEFORE Language selector
- Label: "Front-End Link"
- Placeholder: "https://yoursite.com/front-end-product"
- Help text: "Where will your front-end product be sold? Use a redirect link you control."
- Required: No (optional)

---

## FEATURE 2: Content Editor

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/editor/ContentEditor.jsx` | TinyMCE wrapper component |
| `src/lib/supabase-storage.js` | Image upload utilities |

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/FunnelDetails.jsx` | Add "Edit Content" buttons for each product |
| `src/hooks/useExistingProducts.jsx` | Add content update functionality |
| `package.json` | Add TinyMCE dependencies |

### Editor Requirements (Per Vision Document Part 8)
- TinyMCE with toolbar: fontfamily, fontsize (8-48pt), bold, italic, underline, link, image, alignment
- NO heading styles (H1, H2, H3)
- NO block-based editing
- Content stored as HTML in existing fields

---

## IMPLEMENTATION ORDER

1. Add `front_end_link` column to database (manual SQL)
2. Add `frontEndLink` state to FunnelBuilder.jsx
3. Add Front-End Link input field in AI mode
4. Add Front-End Link input field in Paste mode
5. Update `saveFunnel` to include `front_end_link`
6. Fix Language dropdown width
7. Update generation prompt for bridge section
8. Install TinyMCE
9. Create ContentEditor component
10. Add Edit Content buttons to FunnelDetails

---

## VISION DOCUMENT ALIGNMENT

| Requirement | Vision Reference | Status |
|-------------|------------------|--------|
| Front-End Link field | Part 3, Lines 288-346 | ALIGNED |
| Content Editor (TinyMCE) | Part 8, Lines 920-948 | ALIGNED |
| HTML content storage | Part 8, Lines 943-948 | ALIGNED |

---

## APPROVED FILES LIST

The following files are approved for modification:

- `/src/pages/FunnelBuilder.jsx`
- `/src/hooks/useFunnels.jsx`
- `/src/components/common/LanguageSelector.jsx`
- `/netlify/functions/generate-lead-magnet-content-batched.js`
- `/src/pages/FunnelDetails.jsx`
- `/src/hooks/useExistingProducts.jsx`
- `/src/components/editor/ContentEditor.jsx` (NEW)
- `/src/lib/supabase-storage.js` (NEW)
- `/package.json`

---

**END OF ARCHITECTURE**
