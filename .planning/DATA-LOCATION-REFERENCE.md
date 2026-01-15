# Data Location Reference

**Created:** 2026-01-14
**Purpose:** Document where generated content is stored in the database

---

## Funnel Product Content Location

Content for funnel products is stored **IN THE FUNNELS TABLE**, not in a separate table.

### Structure

```
funnels table
├── id
├── name
├── front_end (JSONB)
│   ├── name
│   ├── format ("Swipe File", "Cheat Sheet", "Planner", "Blueprint", etc.)
│   ├── price
│   ├── description
│   ├── chapters[] ← CONTENT IS HERE
│   │   ├── [0].title
│   │   ├── [0].content ← actual text content
│   │   ├── [0].type
│   │   └── [0].number
│   ├── cover_data
│   ├── bridges_to
│   └── marketplace_listing
├── bump (JSONB) - same structure as front_end
├── upsell_1 (JSONB) - same structure
├── upsell_2 (JSONB) - same structure
└── upsell_3 (JSONB) - same structure
```

### Key Points

1. **Content is in `chapters` field**, NOT a separate `content` field
2. Each `chapter` has:
   - `title` - chapter title
   - `content` - actual text content
   - `type` - chapter type
   - `number` - chapter number

3. **Planner format** has different chapter structure:
   - `chapter_title`
   - `chapter_subtitle`
   - `daily_schedule`
   - `goal_statement`
   - `week_wrap_up`

---

## Lead Magnets Table

Standalone lead magnets (not part of funnels) are stored in:

```
lead_magnets table
├── id
├── name
├── format
├── content (JSONB)
│   ├── title
│   ├── subtitle
│   └── chapters[]
│       ├── [0].title
│       └── [0].content
```

---

## Styled Products Table

Links lead magnets to cover templates and generated PDFs:

```
styled_products table
├── id
├── funnel_id (nullable)
├── lead_magnet_id
├── product_type ("lead_magnet" or "funnel_product")
├── cover_template_id
├── cover_title
├── cover_subtitle
├── pdf_url ← generated PDF location
├── cover_png_url
```

---

## How to Fetch Content

### For Funnel Products:

```javascript
const { data: funnel } = await supabase
  .from('funnels')
  .select('*')
  .eq('id', funnelId)
  .single()

// Access content
const frontEndChapters = funnel.front_end.chapters
const bumpChapters = funnel.bump.chapters
const upsell1Chapters = funnel.upsell_1.chapters
```

### For Lead Magnets:

```javascript
const { data: leadMagnet } = await supabase
  .from('lead_magnets')
  .select('*')
  .eq('id', leadMagnetId)
  .single()

// Access content
const chapters = leadMagnet.content.chapters
```

---

## Example Funnel IDs with Content

1. **Small Audience Profit Pipeline**
   - ID: `66670305-6854-4b78-ab72-7d9167bfa808`
   - front_end: Swipe File (6 chapters)
   - bump: Swipe File (2 chapters)
   - upsell_1: Planner (6 chapters)
   - upsell_2: Blueprint (6 chapters)

2. **Small Audience Revenue Accelerator Funnel**
   - ID: `04a65423-db27-4d63-aba8-f8d917f2f99e`
   - front_end: Cheat Sheet
   - bump: Swipe File
   - upsell_1: Planner
   - upsell_2: Blueprint

---

## Format Templates Location

Existing format templates are in `src/templates/formats/`:
- `checklist.jsx`
- `worksheet.jsx`
- `planner.jsx`
- `swipe-file.jsx`
- `blueprint.jsx`
- `cheat-sheet.jsx`

Visual style templates in `src/templates/styles/index.js`:
- apple-minimal, swiss-design, dark-glowing, etc.

---

**DO NOT** look for content in:
- A separate `funnel_products` table (doesn't exist)
- A `content` field at the product slot level (it's NULL)
- The `styled_products` table (only has PDF links, not content)
