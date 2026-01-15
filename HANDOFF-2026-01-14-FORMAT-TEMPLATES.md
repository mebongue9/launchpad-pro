# HANDOFF: Update Format Templates to Match Existing Design System

**Date:** January 14, 2026
**Priority:** HIGH
**Session:** Format Template Integration

---

## CRITICAL WARNINGS - READ FIRST

### ⛔ DO NOT DO ANY OF THESE THINGS:

1. **DO NOT** change the database schema
2. **DO NOT** change where data comes from
3. **DO NOT** change field names
4. **DO NOT** change the data fetching logic
5. **DO NOT** change how profiles are queried
6. **DO NOT** change how cover templates are queried
7. **DO NOT** change the Supabase queries
8. **DO NOT** rename any columns or tables
9. **DO NOT** create new database migrations
10. **DO NOT** change the PDF generation pipeline
11. **DO NOT** change the PDFShift integration
12. **DO NOT** hallucinate or make up changes
13. **DO NOT** assume anything - read the existing code first

### ✅ WHAT YOU ARE ALLOWED TO DO:

**ONE THING ONLY:** Update the HTML/CSS templates in the interior renderer to use the existing format template designs from `src/templates/formats/`.

That's it. Nothing else.

---

## WHAT WAS ACCOMPLISHED IN THIS SESSION

### 1. Found the Existing Format Templates

Location: `src/templates/formats/`

| File | Format | Description |
|------|--------|-------------|
| `checklist.jsx` | Checklist | Checkbox items with notes column |
| `worksheet.jsx` | Worksheet | Fill-in sections with prompts |
| `planner.jsx` | Planner | Date-based daily/weekly layouts |
| `swipe-file.jsx` | Swipe File | Card-style templates with headers |
| `blueprint.jsx` | Blueprint | Numbered steps with connector lines |
| `cheat-sheet.jsx` | Cheat Sheet | Grid sections with colored headers |

Each template has a `generateHTML(content, style)` function that produces the correct HTML.

### 2. Found Where Content is Stored

**IMPORTANT:** Content is stored in `funnels.{slot}.chapters`, NOT in a separate table.

```
funnels table
├── front_end (JSONB)
│   ├── name
│   ├── format ("Swipe File", "Cheat Sheet", etc.)
│   ├── chapters[] ← CONTENT IS HERE
│   │   ├── title
│   │   └── content
├── bump (JSONB) - same structure
├── upsell_1 (JSONB) - same structure
├── upsell_2 (JSONB) - same structure
└── upsell_3 (JSONB) - same structure
```

**Reference document created:** `.planning/DATA-LOCATION-REFERENCE.md`

### 3. Generated Preview Files

All preview files are in `design-testing/` folder:

- `REFERENCE-16px-approved.html` - The approved 16px baseline design
- `preview-swipe-file-real-data.html` - Swipe File with real data
- `preview-planner-real-data.html` - Planner with real data
- `preview-blueprint-real-data.html` - Blueprint with real data
- `preview-cheat-sheet-real-data.html` - Cheat Sheet with real data

**Open in browser:**
```
file:///Users/martinebongue/Desktop/claude%20code%20project%201/launchpad-pro/design-testing/
```

---

## THE TASK: Integrate Format Templates into Interior Renderer

### Current State

The file `netlify/functions/lib/interior-renderer.js` currently renders ALL formats the same way - it doesn't differentiate between Swipe File, Blueprint, Planner, etc.

### Required Change

Update `interior-renderer.js` to:
1. Detect the format type from the product data
2. Apply the CORRECT template styling for that format
3. Use the existing template designs from `src/templates/formats/`

### What STAYS THE SAME (DO NOT CHANGE):

| Element | Current Location | KEEP IT THERE |
|---------|------------------|---------------|
| Profile photo | Footer of every page | ✅ Same |
| Social handle | Footer of every page | ✅ Same |
| Page numbers | Footer of every page | ✅ Same |
| Author name | About page | ✅ Same |
| Author bio | About page | ✅ Same |
| Header gradient bar | Top of every page | ✅ Same |
| Cover page | First page | ✅ Same |
| Font size | 16px baseline | ✅ Same |
| A4 page dimensions | 210mm x 297mm | ✅ Same |
| Margins | 20mm | ✅ Same |

### What CHANGES (ONLY THIS):

The content area styling based on format type:

**For Swipe File:**
- Card-style template blocks
- "Template #1", "Template #2" headers
- Gradient header on each card
- Gray content background
- Border radius on cards
- 24px gap between cards

**For Blueprint:**
- Numbered circle steps (1, 2, 3...)
- Connector lines between steps
- Step titles with descriptions
- Pro tip boxes (optional)

**For Planner:**
- Grid layout (2 columns)
- Day blocks with headers
- Focus, Tasks, Notes sections
- Checkbox lines for tasks
- Dashed borders for notes area

**For Cheat Sheet:**
- 2-column grid of sections
- Colored top border on each section
- Uppercase section titles
- Bullet point lists
- Compact spacing

---

## HOW TO IMPLEMENT

### Step 1: Read the Existing Templates

Read these files to understand the HTML structure:
- `src/templates/formats/swipe-file.jsx` → `generateHTML()` function
- `src/templates/formats/blueprint.jsx` → `generateHTML()` function
- `src/templates/formats/planner.jsx` → `generateHTML()` function
- `src/templates/formats/cheat-sheet.jsx` → `generateHTML()` function

### Step 2: Update interior-renderer.js

In `netlify/functions/lib/interior-renderer.js`:

1. Add format detection based on `productType` or `format` parameter
2. Add CSS for each format type
3. Modify the content rendering to use format-specific HTML structure

**IMPORTANT:** Do NOT rewrite the entire file. Only add/modify the format-specific sections.

### Step 3: Keep All Existing Logic

The following functions should NOT be changed:
- Profile data fetching
- Cover template fetching
- Page generation logic
- Footer rendering
- About page rendering
- PDF generation calls

### Step 4: Test with Preview Files

Compare your output against the files in `design-testing/` folder to verify the styling matches.

---

## CODE LOCATIONS

### Files to READ (for reference):
- `src/templates/formats/swipe-file.jsx`
- `src/templates/formats/blueprint.jsx`
- `src/templates/formats/planner.jsx`
- `src/templates/formats/cheat-sheet.jsx`
- `src/templates/formats/checklist.jsx`
- `src/templates/formats/worksheet.jsx`
- `design-testing/*.html` (preview files)

### File to MODIFY (carefully):
- `netlify/functions/lib/interior-renderer.js`

### Files to NOT TOUCH:
- `netlify/functions/visual-builder-generate.js` - leave as is
- Any database migrations
- Any Supabase queries
- Any schema files
- `package.json`

---

## DATA STRUCTURE REFERENCE

### How to get format type:

```javascript
// The format comes from the product data
const format = product.format; // "Swipe File", "Blueprint", "Planner", "Cheat Sheet"
```

### How content is structured:

```javascript
// Content has chapters array
const chapters = product.chapters; // or content.chapters

// Each chapter has:
chapters[0].title   // "Chapter 1: The Problem-Solution Pitch Reel"
chapters[0].content // The actual text content
```

### For Planner format (different structure):

```javascript
chapters[0].chapter_title
chapters[0].chapter_subtitle
chapters[0].daily_schedule
chapters[0].goal_statement
chapters[0].week_wrap_up
```

---

## VERIFICATION CHECKLIST

Before saying you're done, verify:

- [ ] Swipe File renders with card-style template blocks
- [ ] Blueprint renders with numbered steps and connector lines
- [ ] Planner renders with grid layout and day blocks
- [ ] Cheat Sheet renders with 2-column section grid
- [ ] Profile photo still appears in footer
- [ ] Social handle still appears in footer
- [ ] Page numbers still work
- [ ] About the Author page still works
- [ ] Header gradient bar still appears
- [ ] 16px font size is maintained
- [ ] A4 page dimensions are maintained
- [ ] NO database queries were changed
- [ ] NO field names were changed
- [ ] NO schema changes were made

---

## EXAMPLE: What the Change Looks Like

### BEFORE (current - all formats look the same):
```html
<div class="page-content">
  <div class="chapter-label">Chapter 1</div>
  <h1 class="chapter-title">Title</h1>
  <div class="body-text">Content...</div>
</div>
```

### AFTER (format-specific styling):

**For Swipe File:**
```html
<div class="page-content">
  <h1 class="swipe-file-title">Title</h1>
  <div class="template-card">
    <div class="template-header">Template #1</div>
    <h3 class="template-title">Chapter Title</h3>
    <div class="template-content">Content...</div>
  </div>
</div>
```

**For Blueprint:**
```html
<div class="page-content">
  <h1 class="blueprint-title">Title</h1>
  <div class="step">
    <div class="step-number">1</div>
    <div class="step-content">
      <h3>Step Title</h3>
      <p>Description...</p>
    </div>
  </div>
</div>
```

---

## FINAL REMINDER

### You are ONLY changing the visual appearance.

The logic stays the same:
- Same data sources ✅
- Same queries ✅
- Same field names ✅
- Same page structure ✅
- Same footer ✅
- Same profile data ✅

You're just making it LOOK different based on the format type.

**If you're unsure about something, ASK. Don't assume. Don't hallucinate. Don't make up changes.**

---

## REFERENCE FILES

1. **Data location reference:** `.planning/DATA-LOCATION-REFERENCE.md`
2. **Preview files:** `design-testing/` folder
3. **Existing templates:** `src/templates/formats/` folder
4. **Current renderer:** `netlify/functions/lib/interior-renderer.js`

---

**END OF HANDOFF**
