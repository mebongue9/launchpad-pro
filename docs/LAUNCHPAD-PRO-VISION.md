# LAUNCHPAD PRO — VISION & SPECIFICATION DOCUMENT
**Version:** 1.3
**Date:** January 10, 2026
**Purpose:** Source of truth for what we are building. All development must align with this document.

---

# PART 1: THE VISION

## What Is Launchpad Pro?

Launchpad Pro is a PDF information empire builder. It creates complete, ready-to-sell product funnels with a few clicks. No video, no audio — just highly actionable PDFs that deliver results fast.

## The Core Philosophy

### 1. Everything Comes From The Vector Database

This is non-negotiable. The vector database is the brain of the entire system. It contains:
- Topics the audience actually wants (from research and analysis)
- Naming conventions that convert
- Formats that work (checklist, worksheet, etc.)
- The specialized knowledge to write the content

**When the AI generates:**
- Funnel ideas → pulled from vector database
- Content for products → pulled from vector database
- Format recommendations → based on vector database analysis

**Generic AI content = garbage. Vector database content = gold.**

### 2. Multi-Niche Architecture

Launchpad Pro supports multiple niches from a single installation. Each niche has its own vector database table containing specialized knowledge, but shares all infrastructure:

**Shared across ALL niches:**
- Maria Wendt naming formulas (the patterns that convert)
- The 6 formats (Checklist, Worksheet, Planner, Swipe File, Blueprint, Cheat Sheet)
- Email style (casual, warm, one thought per line)
- Funnel structure (Lead Magnet → Front-End → Bump → Upsell 1 → Upsell 2)
- Visual Builder, Cover Lab, PDF styling
- The 14 API call generation system
- All technical infrastructure

**Unique PER niche:**
- The vector database table (specialized topic knowledge)
- The actual content that gets written

**Example:**
- "Business" niche uses `knowledge_chunks` table → generates content about FB groups, email marketing, etc.
- "Fitness" niche uses `knowledge_chunks_fitness` table → generates content about weight loss, meal plans, etc.
- Both use the same naming formula: "X [results] in Y days without [pain point]"
- But the topics and expertise come from their respective knowledge bases

### 3. PDF Business, Not Video Courses

We are NOT building long video courses. We are building:
- Short, actionable PDFs
- Results-focused content
- Easy to consume, easy to implement

We measure quality by EFFICIENCY, not length. A list of 82 subject lines is fine (because each line is actionable). An 82-page rambling guide is NOT fine.

### 4. Working Backwards

The workflow is designed backwards from the end goal:
1. Start with the MAIN PRODUCT (the profit maximizer you already have)
2. Then create the FUNNEL (low-ticket products that lead to your main product)
3. Then create the LEAD MAGNET (free content that leads to the funnel)

This ensures everything connects logically toward your ultimate goal.

### 5. No Wasted Tokens

Content generation is EXPENSIVE. The system is designed so that:
- User validates IDEAS before any content is generated
- Nothing is generated until user explicitly clicks "Generate" in Lead Magnet Builder
- TLDRs are used to reference products (instead of loading full content into context)

### 6. Team Delegation

The thinking is done. The knowledge is in the vector database. Anyone on the team can operate this:
- Press buttons
- Select options
- Generate funnels

The owner's expertise goes into improving the vector database, not daily creation work.

---

## The Business Logic

### The Funnel Structure (5 Products)

| Product | Price | Purpose |
|---------|-------|---------|
| Lead Magnet | FREE | Drives traffic, builds trust |
| Front-End | ~$17 | Main low-ticket offer |
| Bump | ~$9 | Quick add-on at checkout |
| Upsell 1 | ~$47 | Higher value offer |
| Upsell 2 | ~$67 | Highest value offer |

### Cross-Promotion to Main Product

Every PAID product (Front-End, Bump, Upsell 1, Upsell 2) ends with a paragraph promoting the user's MAIN product. This paragraph:
- Uses the TLDR of the main product (to save tokens)
- Includes the product URL
- Optionally mentions the price (if user enabled that setting)

The low-ticket funnel:
1. Generates cashflow on its own
2. Builds trust with quick wins
3. Feeds prospects to the main high-ticket product

### Lead Magnet Bridge to Front-End

The Lead Magnet ends with a bridge section that promotes the Front-End product. This section:
- Uses the Front-End Link stored with the funnel
- Encourages the reader to take the next step
- Example: "If you found this helpful, check out [Front-End Product Name] at [Front-End Link]"

### Multi-Platform Distribution

Products go to multiple places:
- Etsy
- Gumroad
- Zazzle
- User's own funnel
- Any other platform

Each platform needs different assets, so the system generates:
- Etsy-optimized descriptions (short, SEO-focused)
- Normal descriptions (longer, for Gumroad etc.)
- 13 tags per product (Etsy limit: 20 chars each)
- Bundle descriptions

### Bundle Strategy

All 4 paid products can be sold as a bundle at ~45% discount. This increases average order value without extra work.

---

# PART 2: THE SETUP SCREENS

These are configured once and reused across all funnels.

## Niche Management (Settings)

**Purpose:** Register and manage niches. Each niche points to its own vector database table.

**Location:** Settings page

**Interface:**
```
Niche Management

Registered Niches:
┌─────────────────────────────────────────────────────────┐
│ Display Name     │ Vector Table              │ Actions  │
├─────────────────────────────────────────────────────────┤
│ Business         │ knowledge_chunks          │ [Edit]   │
│ Fitness          │ knowledge_chunks_fitness  │ [Edit]   │
│ Relationships    │ knowledge_chunks_rel      │ [Edit]   │
└─────────────────────────────────────────────────────────┘

[+ Add New Niche]
```

**Add New Niche Form:**
- Display Name: [text field] — What appears in dropdowns (e.g., "Fitness")
- Vector Table Name: [text field] — Exact table name in database (e.g., "knowledge_chunks_fitness")
- [Save Niche]

**Notes:**
- Vector table must be created and populated BEFORE registering (done outside Launchpad Pro using existing vectorization workflow)
- First niche ("Business" / `knowledge_chunks`) is pre-configured as default
- Cannot delete a niche if funnels/lead magnets exist using it

### Process: Adding a New Niche

**Step 1: Create and populate vector table (outside Launchpad Pro)**
- Create new table (e.g., `knowledge_chunks_fitness`)
- Use existing vectorization pipeline to populate with niche-specific content
- Same embedding model, same chunk structure as other knowledge tables

**Step 2: Register niche in Launchpad Pro**
- Go to Settings → Niche Management
- Click "Add New Niche"
- Enter display name: "Fitness"
- Enter table name: "knowledge_chunks_fitness"
- Save

**Step 3: Start creating**
- In Funnel Builder, select "Fitness" from Niche dropdown
- Generate funnels using fitness expertise
- All naming conventions and formats work exactly the same

---

## Profile

**Purpose:** Who is selling the products. Used for PDF branding and covers.

**Fields:**
- Name
- Business Name
- Tagline
- Social Handle (e.g., @realmartinebongue)
- Photo (URL) — **must be transparent background for interior page footers**
- Logo (URL)
- What I do / Income method

**Notes:**
- Can create multiple profiles (including pen names)
- Selected when creating funnels/lead magnets
- Populates placeholders in PDF covers and interior footers
- Profiles are NOT niche-specific (same author can write for multiple niches)

---

## Audience

**Purpose:** Who you're selling to.

**Fields:**
- Audience description (detailed)
- Niche (optional tag) — for filtering/organization only

**Notes:**
- Can create multiple audiences
- Selected when creating funnels/lead magnets
- Used by AI to tailor content
- Optional niche tag helps filter audiences when you have many

---

## Products (Main Products)

**Purpose:** Your existing high-ticket product(s) — the profit maximizer.

**Fields:**
- Product name
- Description
- Price
- URL
- TLDR (short summary)
- "Mention price" toggle (yes/no)
- Niche (optional tag) — for filtering/organization only

**Notes:**
- TLDR is critical — used for cross-promo paragraphs, emails, bundle descriptions
- Saves tokens by not loading full product content
- "Mention price" toggle affects how cross-promo paragraph is written
- Optional niche tag helps filter products when you have many

---

# PART 3: THE WORKFLOW

## Overview

```
[Profile, Audience, Products] — Setup once
           ↓
    [Funnel Builder] — Create funnel IDEA (draft only)
           ↓
   [Lead Magnet Builder] — Create lead magnet + TRIGGER GENERATION
           ↓
    [Content Editor] — Review and edit generated content (optional)
           ↓
    [Visual Builder] — Select cover + generate styled PDFs
           ↓
       [Export] — Download all assets
```

---

## Step 1: Funnel Builder

**Purpose:** Define what products will be in the funnel. THIS ONLY CREATES AN IDEA — NO CONTENT IS GENERATED.

### Option A: AI Generates Funnel Idea

**User selects:**
- Profile
- Audience
- Main Product (optional — if none, no cross-promo paragraph)
- **Niche** (required — determines which vector database to query)
- **Front-End Link** (URL — where the front-end product will be sold)
- Language

**User clicks:** "Generate Funnel"

**System returns:** A funnel IDEA showing:
```
💰 FRONT-END: [Product Name] - [Format: Cheat Sheet] - [Brief description]
⚡ BUMP: [Product Name] - [Format: Checklist] - [Brief description]
🚀 UPSELL 1: [Product Name] - [Format: Workbook] - [Brief description]
🚀 UPSELL 2: [Product Name] - [Format: Template Pack] - [Brief description]
```

**Critical rules for AI generation:**
- All ideas come from vector database (selected niche's table)
- Format is specified automatically (not chosen by user later)
- System checks previous funnels **within the same niche** to ensure this is FRESH (no repeat titles/concepts)
- Naming formulas (Maria Wendt patterns) are universal across all niches

**User actions:**
- "Regenerate" — get a new idea
- "Validate" — save as draft

**After validation:** Funnel is saved as DRAFT with niche_id and front_end_link. **NOTHING IS GENERATED YET.**

### Option B: Paste Existing Idea

**User has:** A funnel idea from an external Claude project or their own planning.

**User selects:**
- **Niche** (required — tags the funnel for freshness checks and filtering)
- **Front-End Link** (URL — where the front-end product will be sold)

**User interface:** Simple text box (NOT a complex form)

**User pastes:**
```
💰 FRONT-END: The Complete FB Group Lead Machine - Cheat Sheet ($17)
⚡ BUMP: 7 Welcome Sequences That Convert Cold Members - Checklist ($9)
🚀 UPSELL 1: Done-For-You FB Group Content Calendar - Planner ($47)
🚀 UPSELL 2: 30-Day Content Calendar + Captions - Swipe File ($67)
```

**System:** Parses automatically, extracts product names, formats, prices.

**User clicks:** "Validate"

**After validation:** Funnel is saved as DRAFT with niche_id and front_end_link. **NOTHING IS GENERATED YET.**

### Front-End Link Field

**Purpose:** The URL where the front-end product will be sold. Used in the lead magnet's bridge section.

**Why it's needed:** The lead magnet promotes the front-end product at the end, but the front-end doesn't exist yet when the funnel is created. User sets up a redirect link (e.g., PrettyLinks) ahead of time that they can point to the actual product URL later.

**Example:** User enters `https://mysite.com/funnel-10` — this is a redirect link they control. When the front-end product is live, they point the redirect to the actual sales page.

**How it's used:** When the lead magnet content is generated, the bridge section includes this link: "Ready for more? Get [Front-End Product Name] at [Front-End Link]"

---

## Step 2: Lead Magnet Builder

**Purpose:** Create the lead magnet that drives traffic to the funnel. THIS IS WHERE GENERATION IS TRIGGERED.

### User Selects:
- Profile (who's writing)
- Audience (who it's for)
- **Niche** (required — determines which vector database to query)
- Destination type:
  - **"Funnel"** — links to a funnel (99% of cases)
  - **"Direct to Product"** — links directly to main product (standalone lead magnet)

### If "Funnel" Selected:
- User picks which validated funnel this lead magnet is for
- **Funnel dropdown is filtered to show only funnels matching the selected niche**
- Lead magnet will naturally lead to the Front-End product of that funnel
- The Front-End Link stored with the funnel is used in the bridge section

### If "Direct to Product" Selected:
- User picks which main product this leads to
- No funnel involved — just lead magnet → main product
- Tagged as "standalone" in database
- Still appears in Visual Builder later

### Option A: AI Generates Lead Magnet Ideas

**User clicks:** "Generate 3 Ideas"

**System returns:** 3 lead magnet ideas

**Critical rules:**
- Ideas come from vector database (selected niche's table)
- System checks previous lead magnets **within the same niche** to ensure freshness
- Ideas are designed to naturally lead to the selected funnel's Front-End

**User actions:**
- Pick one idea (click to select)
- "Regenerate" — get 3 new ideas
- "Generate" — START CONTENT GENERATION

### Option B: Paste Existing Idea

**User has:** A lead magnet idea already

**User pastes:**
```
🎯 LEAD MAGNET (FREE): "4 Facebook Group Posts That Generated $12,847 in 30 Days" - Swipe File
```

**User clicks:** "Generate"

### Generation Triggered

This is the moment tokens are spent. System generates (14 batched API calls):

**If Funnel was selected:**
1. Lead Magnet content (2 API calls) — includes bridge section with Front-End Link
2. Front-End content (2 API calls)
3. Bump content (1 API call)
4. Upsell 1 content (2 API calls)
5. Upsell 2 content (2 API calls)
6. All 5 TLDRs (1 API call)
7. Marketplace listings batch 1 (1 API call)
8. Marketplace listings batch 2 (1 API call)
9. All 6 emails (1 API call)
10. Bundle listing (1 API call)

**Total: 14 batched API calls**

**All API calls use the selected niche's vector database for content.**

### If Direct to Product was selected:
1. Lead Magnet content only (2 API calls)
2. Lead Magnet TLDR (1 API call)
3. Lead Magnet marketplace listing (1 API call)

**Total: 4 API calls** (approximately)

---

## Step 2.5: Content Editor (Optional)

**Purpose:** Review and edit generated content before styling in Visual Builder.

**Location:** Funnel detail page, after generation completes.

### Interface:

Each product shows:
```
Front-End: "The Complete FB Group Lead Machine"
[View] [Edit Content] [Style in Visual Builder]
```

**"Edit Content"** opens a classic rich text editor (WYSIWYG).

### Editor Requirements:

**This is a classic rich text editor, NOT a semantic/block editor.**

**Must have:**
- Font family selection (dropdown of available fonts)
- Font size selection (specific point sizes: 8, 10, 12, 14, 16, 18, 20, 24, etc.)
- Bold, italic, underline
- Link insertion (select text → add URL)
- Image insertion (upload or paste URL)
- Text alignment (left, center, right)

**Must NOT have:**
- Predefined heading styles ("Heading 1", "Heading 2", etc.)
- Block-based editing (no Notion-style blocks)
- Restricted formatting options

**Why:** The user needs full control over formatting for PDF output. Semantic editors that restrict formatting to predefined styles are not acceptable.

**Technical implementation:** Use a library like TinyMCE, CKEditor, or Quill configured for full formatting control.

### Workflow:

1. User clicks "Edit Content" on a product
2. Editor opens with the generated content
3. User makes changes (formatting, links, images)
4. User saves changes
5. Changes are stored in the database
6. When user goes to Visual Builder, the edited content is used

### What Can Be Edited:

All generated content for each product:
- Cover text (title, subtitle)
- All chapters/sections
- Bridge sections
- Cross-promo paragraphs
- CTAs
- About the Author text

### Image Insertion:

User can insert images into the content:
- Upload image file
- Or paste image URL
- Images are stored/referenced and included in final PDF

**Use case:** User wants to add screenshots, diagrams, or custom graphics to enhance the product.

---

## Step 3: Visual Builder

**Purpose:** Create styled PDFs with matching covers and interior pages.

### Visual Builder Interface Shows:
- List of COMPLETED funnels (where content has been generated)
- List of STANDALONE lead magnets (direct to product)

### User Flow:

**Step 3.1: Select Product**
- User picks which product to style (lead magnet, front-end, bump, upsell 1, upsell 2)
- Can do one at a time or batch

**Step 3.2: Select Cover**
- User picks a cover from their Cover Library
- Cover determines the color palette for the entire PDF

**Step 3.3: Preview**
- Shows Cover + Interior Pages side by side
- User sees exactly how the final product will look
- Colors from cover flow through to interior pages

**Step 3.4: Adjust (Optional)**
- Text fields auto-populated from product + profile
- User can edit: Title, Subtitle
- Size controls: Sliders for title and subtitle font size (and other elements)
- Subtitle auto-generator available (based on product TLDR)

**Step 3.5: Generate**
- System creates complete PDF: Cover (page 1) + Interior pages
- System creates Cover PNG (for marketplace listings)
- User can repeat for each product in funnel

### How Colors Flow From Cover to Interior:

When user selects a cover, the system extracts its color palette:
- Primary color (main accent)
- Secondary color (darker shade)
- Tertiary color (lighter/brighter pop)

These colors are applied to interior page elements:
- Header bar at top of each page
- Chapter labels and titles
- Section dividers
- Checkbox borders
- Step number circles
- Callout box borders and backgrounds
- Footer accent line
- Footer photo border

**Interior pages always maintain readability:**
- Background: White or very light gray
- Body text: Black or dark gray
- Accent colors used for decorative elements only

### Preview Display:

The preview shows a horizontal row:
```
[COVER] → [Chapter Page] → [Checklist Page] → [Steps Page]
```

This gives user full visibility of how cover and interior pages work together before generating.

---

## Step 4: Export / Ready-Made Funnel

**Purpose:** Access all generated assets for distribution.

### Available for Download/Copy:

**PDFs (with covers):**
- Lead Magnet PDF
- Front-End PDF
- Bump PDF
- Upsell 1 PDF
- Upsell 2 PDF

**Cover Images (PNG for marketplace listings):**
- One per product styled in Visual Builder

**Email Sequences:**
- Lead Magnet sequence (3 emails)
- Front-End sequence (3 emails)

**Marketplace Listings (per product):**
- Title (140 chars max)
- Etsy Description (short, SEO-optimized)
- Normal Description (long, for Gumroad etc.)
- 13 Tags (each ≤20 chars)

**Bundle:**
- Bundle Title
- Bundle Etsy Description
- Bundle Normal Description
- Bundle Tags

**TLDRs:**
- One per product (for reference)

---

# PART 4: THE 6 FORMATS

These are the approved formats. When a funnel idea is generated or pasted, each product specifies one of these:

| Format | Description |
|--------|-------------|
| **Checklist** | Step-by-step items to check off |
| **Worksheet** | Fill-in-the-blank exercises |
| **Planner** | Time-based organization (daily/weekly/monthly) |
| **Swipe File** | Ready-to-use templates and copy |
| **Blueprint** | Visual process/flowchart |
| **Cheat Sheet** | Quick reference, dense information |

**Important:** Format is determined when funnel idea is created — NOT selected manually later in Visual Builder.

---

# PART 5: COVER LIBRARY & COVER LAB

## Cover Library

The Cover Library stores all available cover templates. Each cover template includes:
- Layout structure (where title, subtitle, author, logo go)
- Color palette (primary, secondary, tertiary colors)
- Typography settings (font families, weights)
- Decorative elements (gradients, shapes, lines)

### Default Covers (Included):

| Cover Name | Vibe | Colors |
|------------|------|--------|
| Bold Gradient | Modern, energetic | Orange gradient (#8B2500 → #CD4F00 → #FF6B00) |
| Dark Luxury | Elegant, premium | Black + Gold (#0a0a0a + #C9A962) |
| Minimal Swiss | Clean, professional | White + Black + Red accent (#000 + #E63946) |
| Neon Dark | Tech, startup | Dark + Green glow (#0d0d0d + #00FF88) |

Additional covers can be added via Cover Lab.

---

## Cover Lab

**Purpose:** Create new cover templates without coding. A separate workspace from the main funnel workflow.

### Cover Lab Flow:

**Step 1: Upload Reference**
- User uploads a screenshot of a cover design they like

**Step 2: AI Analysis**
- System analyzes the design
- Returns verdict:
  - ✅ "100% doable" — Can be reproduced with CSS/HTML
  - ⚠️ "Partially doable" — Some elements can't be reproduced (explains what would change)
  - ❌ "Not doable" — Requires image generation or complex photo editing

**Step 3: Generate Variations (if doable)**
- System generates 4 cover variations:
  - **Variation 1:** Exact reproduction (same colors, same layout)
  - **Variations 2-4:** Creative tweaks (same color palette, different positioning/typography/effects)
- Variations might include: different font weights, element repositioning, added shadows/glows, decorative elements moved

**Step 4: Preview**
- User sees all 4 covers side by side
- Each cover is interactive (can type sample title to see how it looks)

**Step 5: Select & Save**
- User picks which variations to keep
- Names each template (e.g., "Bold Orange Gradient", "Minimalist Gold")
- Selected covers are added to Cover Library

### What Cover Lab CAN Create:
- Bold typography (condensed, stretched, overlapping)
- Gradient backgrounds (any colors)
- Solid color backgrounds
- Geometric shapes and patterns
- Clean minimal layouts
- Text effects (shadows, glows via CSS)
- Decorative lines and dividers
- Year/edition text elements

### What Cover Lab CANNOT Create:
- Photos with text masking (text behind subject)
- 3D rendered objects
- Complex illustrations
- AI-generated imagery
- Stock photos integrated into design

---

# PART 6: INTERIOR PAGE STYLING

## Interior Page Elements

Every interior page includes:

### Header Bar
- Full-width colored bar at top of page
- Uses cover's primary color (gradient if cover has gradient)
- Height: approximately 6-8px

### Chapter Label
- Small text above chapter title
- Uses cover's primary/accent color
- Uppercase, letter-spaced
- Examples: "CHAPTER 1", "CHECKLIST", "PROCESS"

### Chapter Title
- Large, bold title
- Black text (for readability)
- Font family matches cover's typography style

### Section Divider
- Colored line below chapter title
- Uses cover's primary color (gradient if applicable)
- Width: approximately 50-60px

### Body Content
- Black text on white background
- Standard readable font (Inter or similar)
- Line height optimized for readability
- **Respects formatting from Content Editor** (bold, italic, links, images, font sizes)

### Callout Boxes
- Light tinted background (very subtle version of primary color)
- Colored left border (primary color)
- Used for key insights, tips, important notes

### Checkboxes (for Checklist format)
- Border color matches primary color
- Empty (for user to check off)

### Step Numbers (for Process/Steps format)
- Circular badges with primary color background
- White number text
- Gradient if cover has gradient

### Footer (Every Page)
- Accent line at top of footer (primary color)
- Small circular photo (from profile, transparent background)
- Handle text (from profile)
- Page number on right side

### About The Author (Last Page)
- Larger photo (circular, with colored border)
- Author name (bold)
- Tagline (in primary color)
- Handle
- Short bio paragraph

---

# PART 7: WHAT GETS GENERATED FOR EACH PRODUCT

## Product Content Structure

### Lead Magnet (2 API calls)
- Cover page (styled in Visual Builder)
- 3-5 chapters of content
- Bridge section (leads to Front-End, includes Front-End Link from funnel)
- CTA
- About the Author page

### Front-End (2 API calls)
- Cover page (styled in Visual Builder)
- 5-6 chapters of content
- Cross-promo paragraph (links to main product)
- Bridge section (leads to Bump offer context)
- CTA
- Review request (5 stars visual)
- About the Author page

### Bump (1 API call)
- Cover page (styled in Visual Builder)
- 2-3 short chapters (quick, actionable)
- Cross-promo paragraph
- CTA
- Review request
- About the Author page

### Upsell 1 (2 API calls)
- Cover page (styled in Visual Builder)
- 4-6 chapters of content
- Cross-promo paragraph
- Bridge section
- CTA
- Review request
- About the Author page

### Upsell 2 (2 API calls)
- Cover page (styled in Visual Builder)
- 4-6 chapters of content
- Cross-promo paragraph
- CTA
- Review request
- About the Author page

## Marketing Materials

### TLDRs (1 API call for all 5)
Short JSON summary per product:
- What it is
- Who it's for
- What's inside
- Benefits
- CTA

### Marketplace Listings (2 API calls)
Per product:
- Title (140 chars)
- Etsy Description (short)
- Normal Description (long)
- 13 Tags (each ≤20 chars)

### Email Sequences (1 API call for all 6)
- Lead Magnet sequence: 3 emails
- Front-End sequence: 3 emails
- Maria Wendt style (casual, warm, one thought per line)

### Bundle Listing (1 API call)
- Bundle Title
- Bundle Etsy Description
- Bundle Normal Description
- Bundle Tags
- Shows value comparison ($X separately → $Y bundle)

---

# PART 8: TECHNICAL RULES

## Generation System

### Batched API Calls
- 14 total calls for a full funnel (not 51+)
- Each call generates multiple sections
- Sections separated by `===SECTION_BREAK===` delimiter

### Retry System
- 7 automatic retry attempts
- Escalating delays: 0s → 5s → 30s → 2min → 5min → 5min → 5min
- Configurable in Settings
- User doesn't need to intervene unless all 7 attempts fail

### Progress Tracking
- Each of the 14 tasks tracked in `generation_tasks` table
- Status: pending → in_progress → completed/failed
- Resume capability if browser closes

### Freshness Check
When generating funnel ideas or lead magnet ideas:
- System queries previous funnels/lead magnets **within the same niche only**
- Ensures new titles and concepts (no duplicates within niche)
- Same pattern CAN repeat across different niches

## Cover System

### Cover Template Storage
Each cover template stores:
- HTML/CSS structure
- Color palette (primary, secondary, tertiary hex values)
- Font family references
- Placeholder positions for dynamic content

### Color Extraction
When user selects a cover, system extracts colors and passes to interior page generator.

### Dynamic Placeholders
```
{{title}}           — Product title (editable in Visual Builder)
{{subtitle}}        — Auto-generated or custom (editable)
{{author}}          — From profile.name
{{business}}        — From profile.business_name
{{handle}}          — From profile.social_handle
{{tagline}}         — From profile.tagline
{{photo}}           — From profile.photo_url
{{logo}}            — From profile.logo_url
{{year}}            — Current year
```

### Subtitle Auto-Generation
System can generate subtitle from product TLDR using patterns:
- Benefit statement: "The complete system for [achieving X]"
- Outcome focus: "How to [get result] in [timeframe]"
- Audience qualifier: "For [specific audience] who want [outcome]"
- Method reveal: "The [number]-step method to [result]"
- Promise statement: "Everything you need to [achieve goal]"

## Multi-Niche Database Schema

### Niches Table
```sql
CREATE TABLE niches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  display_name TEXT NOT NULL UNIQUE,
  vector_table_name TEXT NOT NULL UNIQUE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default niche pre-configured
INSERT INTO niches (display_name, vector_table_name, is_default) 
VALUES ('Business', 'knowledge_chunks', TRUE);
```

### Foreign Keys on Content Tables
```sql
-- Funnels table
ALTER TABLE funnels ADD COLUMN niche_id UUID REFERENCES niches(id);
ALTER TABLE funnels ADD COLUMN front_end_link TEXT;

-- Lead magnets table
ALTER TABLE lead_magnets ADD COLUMN niche_id UUID REFERENCES niches(id);

-- Optional: Audiences table (for filtering only)
ALTER TABLE audiences ADD COLUMN niche_id UUID REFERENCES niches(id);

-- Optional: Products table (for filtering only)
ALTER TABLE products ADD COLUMN niche_id UUID REFERENCES niches(id);
```

## Content Editor Technical Requirements

### Editor Library
Use a classic WYSIWYG rich text editor library:
- TinyMCE (recommended)
- CKEditor
- Quill (with full toolbar configuration)

### Required Features
- Font family dropdown
- Font size dropdown (specific point sizes: 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48)
- Bold, italic, underline buttons
- Link insertion
- Image insertion (upload + URL)
- Text alignment (left, center, right)
- Undo/redo

### Prohibited Features
- Semantic heading styles (H1, H2, H3 dropdowns)
- Block-based editing
- Markdown mode
- Any formatting restrictions

### Content Storage
- Content stored as HTML in database
- Images stored in Supabase storage or referenced by URL
- HTML rendered in Visual Builder when creating PDFs

---

# PART 9: LIST FILTERING

## Purpose

As the number of funnels, lead magnets, audiences, and products grows across multiple niches, filtering allows quick access to relevant items.

## Filter Bar Design

Each list page has a simple filter bar at the top with dropdown filters:

```
[All Niches ▼] [All Statuses ▼] [All Profiles ▼] [All Time ▼]
```

Default is "show everything" — filters narrow it down.

## Funnels List Filters

| Filter | Options |
|--------|---------|
| Niche | All Niches, Business, Fitness, etc. (from registered niches) |
| Status | All Statuses, Draft, Generated, Styled |
| Profile | All Profiles, [list of profiles] |
| Date | All Time, Last 7 days, Last 30 days, Last 90 days |

**Status definitions:**
- **Draft** — Funnel idea validated, no content generated yet
- **Generated** — Content generated (14 API calls complete)
- **Styled** — PDFs created in Visual Builder

## Lead Magnets List Filters

| Filter | Options |
|--------|---------|
| Niche | All Niches, Business, Fitness, etc. |
| Status | All Statuses, Draft, Generated, Styled |
| Profile | All Profiles, [list of profiles] |
| Date | All Time, Last 7 days, Last 30 days, Last 90 days |

## Audiences List Filters

| Filter | Options |
|--------|---------|
| Niche | All Niches, Business, Fitness, etc. (based on optional niche tag) |

## Products (Main Products) List Filters

| Filter | Options |
|--------|---------|
| Niche | All Niches, Business, Fitness, etc. (based on optional niche tag) |

---

# PART 10: WHAT THIS IS NOT

To prevent scope creep and misunderstanding:

1. **NOT a video course platform** — PDFs only
2. **NOT using generic AI knowledge** — Vector database only
3. **NOT generating content before validation** — User must validate ideas first
4. **NOT requiring manual format selection in Visual Builder** — Formats are set in funnel idea
5. **NOT requiring complex forms to paste funnel ideas** — Simple text box with parsing
6. **NOT a funnel page builder** — We generate PDFs and marketing assets, not web pages
7. **NOT an image generator** — Cover Lab uses CSS/HTML templates, not AI image generation
8. **NOT Canva** — Visual Builder is simplified, template-based, automatic field population
9. **NOT requiring separate style + cover selection** — Cover determines colors, everything flows from it
10. **NOT automatic vector table creation** — Vector tables are created outside the app using existing vectorization workflow
11. **NOT niche-specific naming formulas** — Maria Wendt patterns are universal across all niches
12. **NOT niche-locked profiles** — One profile can create content for multiple niches
13. **NOT a semantic/block editor** — Content Editor uses classic rich text with full formatting control

---

# PART 11: SUCCESS CRITERIA

The system is working correctly when:

1. ✅ User can create a complete funnel + lead magnet in under 15 minutes
2. ✅ All content comes from vector database (not generic)
3. ✅ Formats are automatic (no manual selection in Visual Builder)
4. ✅ No tokens wasted on unvalidated ideas
5. ✅ Team members can operate without deep expertise
6. ✅ Output is ready for immediate upload to Etsy/Gumroad
7. ✅ All 14 API calls complete reliably with retry system
8. ✅ PDFs look professional with consistent branding
9. ✅ Cross-promo paragraphs correctly link to main product
10. ✅ Emails are Maria Wendt style (casual, warm, one thought per line)
11. ✅ Cover colors flow seamlessly to interior pages
12. ✅ Preview shows cover + interior pages together before generation
13. ✅ New covers can be added via Cover Lab without coding
14. ✅ Interior pages are readable (white background, colored accents only)
15. ✅ Footer branding appears on every page
16. ✅ New niche can be registered with just display name + table name
17. ✅ Niche dropdown appears in Funnel Builder and Lead Magnet Builder
18. ✅ Content generation pulls from correct vector table based on niche
19. ✅ Freshness checks are scoped to selected niche
20. ✅ Funnel dropdown in Lead Magnet Builder filters by selected niche
21. ✅ List filtering works across Funnels, Lead Magnets, Audiences, Products
22. ✅ Front-End Link is stored with funnel and used in lead magnet bridge section
23. ✅ Content Editor allows full formatting control (fonts, sizes, bold, links, images)
24. ✅ Edited content is preserved and used in Visual Builder PDF generation

---

# PART 12: CHECKLIST FOR CODE REVIEW

Use this checklist when reviewing any development work:

## Workflow Compliance
- [ ] Generation only triggers from Lead Magnet Builder (not Funnel Builder)
- [ ] Funnel Builder only creates drafts (no content generation)
- [ ] Formats are specified in funnel idea (not selected in Visual Builder)
- [ ] Paste option available for both funnel ideas and lead magnet ideas
- [ ] Direct-to-product option creates standalone lead magnets
- [ ] Front-End Link field in Funnel Builder
- [ ] Front-End Link stored with funnel record
- [ ] Lead magnet bridge section includes Front-End Link

## Technical Compliance
- [ ] Using 14 batched API calls (not 51+)
- [ ] Retry system with 7 attempts and escalating delays
- [ ] Progress tracking in database
- [ ] Resume capability implemented
- [ ] Freshness check for new ideas (scoped to niche)

## Content Compliance
- [ ] All content pulled from vector database
- [ ] TLDRs used for cross-promo and emails (not full content)
- [ ] Cross-promo paragraph in all paid products
- [ ] Review request in all paid products
- [ ] Email style matches Maria Wendt patterns

## Output Compliance
- [ ] All 6 formats supported (Checklist, Worksheet, Planner, Swipe File, Blueprint, Cheat Sheet)
- [ ] Marketplace listings include Etsy + Normal descriptions
- [ ] Tags are exactly 13 per product, ≤20 chars each
- [ ] Bundle listing generated

## Visual Builder Compliance
- [ ] Cover selection from Cover Library
- [ ] Preview shows cover + interior pages side by side
- [ ] Colors extracted from cover and applied to interior
- [ ] Size controls for title, subtitle, and other text elements
- [ ] Subtitle auto-generator available
- [ ] Fields auto-populated from profile + product
- [ ] Fields are editable before generation
- [ ] PDF output includes cover as page 1
- [ ] PNG cover exported for marketplace listings

## Cover Lab Compliance
- [ ] Upload reference image functionality
- [ ] AI analysis returns doable/not doable verdict
- [ ] 4 variations generated (1 exact + 3 creative tweaks)
- [ ] Same color palette maintained across variations
- [ ] User can select which variations to save
- [ ] Saved covers appear in Cover Library

## Interior Page Compliance
- [ ] Header bar uses cover's primary color
- [ ] Chapter labels use cover's accent color
- [ ] Dividers use cover's color (gradient if applicable)
- [ ] Checkboxes/step numbers use cover's colors
- [ ] Callout boxes have tinted background + colored border
- [ ] Footer on every page (accent line + photo + handle + page number)
- [ ] About the Author on last page
- [ ] White/light background maintained for readability
- [ ] Body text is black/dark gray
- [ ] Custom formatting from Content Editor preserved in PDF

## Multi-Niche Compliance
- [ ] Niches table created with correct schema
- [ ] Settings page has Niche Management section
- [ ] Can add new niche (display name + table name)
- [ ] Can edit existing niche
- [ ] Cannot delete niche with existing funnels/lead magnets
- [ ] Default niche pre-configured
- [ ] Niche dropdown in Funnel Builder (required field)
- [ ] Niche dropdown in Lead Magnet Builder (required field)
- [ ] Funnel dropdown filters by selected niche in Lead Magnet Builder
- [ ] Selected niche stored with funnel/lead magnet records
- [ ] Vector queries use correct table based on niche
- [ ] Freshness checks scoped to niche
- [ ] All 14 API calls use same niche context
- [ ] Naming formulas work regardless of niche

## List Filtering Compliance
- [ ] Filter bar on Funnels list page
- [ ] Filter bar on Lead Magnets list page
- [ ] Filter bar on Audiences list page
- [ ] Filter bar on Products list page
- [ ] Niche filter works correctly
- [ ] Status filter works correctly (Draft/Generated/Styled)
- [ ] Profile filter works correctly
- [ ] Date filter works correctly
- [ ] Default shows all items (no filter applied)
- [ ] Filters can be combined

## Content Editor Compliance
- [ ] Edit Content button on funnel detail page (per product)
- [ ] Classic rich text editor (WYSIWYG), NOT semantic/block editor
- [ ] Font family selection dropdown
- [ ] Font size selection with specific point sizes (8, 10, 12, 14, 16, 18, 20, 24, etc.)
- [ ] Bold, italic, underline buttons
- [ ] Link insertion functionality
- [ ] Image insertion (upload and URL)
- [ ] Text alignment options
- [ ] No predefined heading styles (H1, H2, etc.)
- [ ] Changes saved to database
- [ ] Edited content used in Visual Builder PDF generation
- [ ] Images included in final PDF output

---

**END OF VISION DOCUMENT**

This document is the source of truth. If development deviates from this, it must be corrected.
