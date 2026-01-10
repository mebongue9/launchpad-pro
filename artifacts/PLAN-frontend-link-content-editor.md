# PLAN: Front-End Link + Content Editor

**Date:** 2026-01-10
**Status:** APPROVED
**Task:** Implement Front-End Link field and Content Editor

---

## PHASE 1: Front-End Link Field

### Step 1.1: Database Migration
- Add `front_end_link TEXT` column to funnels table
- Run via Supabase SQL editor (manual step)

### Step 1.2: FunnelBuilder.jsx Updates
- Add `frontEndLink` state variable
- Add URL input field in AI Generation mode (after Main Product, before Language)
- Add URL input field in Paste mode (after parsed preview, before profile selection)
- Update `resetAll()` to clear frontEndLink

### Step 1.3: useFunnels.jsx Updates
- Add `frontEndLink` parameter to `saveFunnel` function
- Include `front_end_link` in database insert

### Step 1.4: LanguageSelector.jsx Fix
- Add `w-full max-w-xs` to select element width

### Step 1.5: Generation Prompt Update
- Update lead magnet generation to include front_end_link in bridge section

---

## PHASE 2: Content Editor

### Step 2.1: Install TinyMCE
- Add @tinymce/tinymce-react to package.json

### Step 2.2: Create ContentEditor Component
- Create src/components/editor/ContentEditor.jsx
- Configure TinyMCE toolbar per vision spec

### Step 2.3: FunnelDetails Updates
- Add "Edit Content" button for each product
- Open ContentEditor modal on click

### Step 2.4: Database Integration
- Load content as HTML
- Save edited content back to database

---

## FILES IN SCOPE

- `/src/pages/FunnelBuilder.jsx`
- `/src/hooks/useFunnels.jsx`
- `/src/components/common/LanguageSelector.jsx`
- `/netlify/functions/generate-lead-magnet-content-batched.js`
- `/src/pages/FunnelDetails.jsx`
- `/src/components/editor/ContentEditor.jsx` (NEW)
- `/package.json`

---

**END OF PLAN**
