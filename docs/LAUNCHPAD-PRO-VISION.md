# LAUNCHPAD PRO — VISION & SPECIFICATION DOCUMENT
**Version:** 1.0
**Date:** January 5, 2026
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

### 2. PDF Business, Not Video Courses

We are NOT building long video courses. We are building:
- Short, actionable PDFs
- Results-focused content
- Easy to consume, easy to implement

We measure quality by EFFICIENCY, not length. A list of 82 subject lines is fine (because each line is actionable). An 82-page rambling guide is NOT fine.

### 3. Working Backwards

The workflow is designed backwards from the end goal:
1. Start with the MAIN PRODUCT (the profit maximizer you already have)
2. Then create the FUNNEL (low-ticket products that lead to your main product)
3. Then create the LEAD MAGNET (free content that leads to the funnel)

This ensures everything connects logically toward your ultimate goal.

### 4. No Wasted Tokens

Content generation is EXPENSIVE. The system is designed so that:
- User validates IDEAS before any content is generated
- Nothing is generated until user explicitly clicks "Generate" in Lead Magnet Builder
- TLDRs are used to reference products (instead of loading full content into context)

### 5. Team Delegation

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

## Profile

**Purpose:** Who is selling the products. Used for PDF branding and covers.

**Fields:**
- Name
- Business Name
- Tagline
- Social Handle (e.g., @realmartinebongue)
- Photo (URL)
- Logo (URL)
- What I do / Income method

**Notes:**
- Can create multiple profiles (including pen names)
- Selected when creating funnels/lead magnets
- Populates placeholders in PDF covers

## Audience

**Purpose:** Who you're selling to.

**Fields:**
- Audience description (detailed)

**Notes:**
- Can create multiple audiences
- Selected when creating funnels/lead magnets
- Used by AI to tailor content

## Products (Main Products)

**Purpose:** Your existing high-ticket product(s) — the profit maximizer.

**Fields:**
- Product name
- Description
- Price
- URL
- TLDR (short summary)
- "Mention price" toggle (yes/no)

**Notes:**
- TLDR is critical — used for cross-promo paragraphs, emails, bundle descriptions
- Saves tokens by not loading full product content
- "Mention price" toggle affects how cross-promo paragraph is written

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
    [Visual Builder] — Turn content into branded PDFs
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
- All ideas come from vector database
- Format is specified automatically (not chosen by user later)
- System checks previous funnels to ensure this is FRESH (no repeat titles/concepts)

**User actions:**
- "Regenerate" — get a new idea
- "Validate" — save as draft

**After validation:** Funnel is saved as DRAFT. **NOTHING IS GENERATED YET.**

### Option B: Paste Existing Idea

**User has:** A funnel idea from an external Claude project or their own planning.

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

**After validation:** Funnel is saved as DRAFT. **NOTHING IS GENERATED YET.**

---

## Step 2: Lead Magnet Builder

**Purpose:** Create the lead magnet that drives traffic to the funnel. THIS IS WHERE GENERATION IS TRIGGERED.

### User Selects:
- Profile (who's writing)
- Audience (who it's for)
- Destination type:
  - **"Funnel"** — links to a funnel (99% of cases)
  - **"Direct to Product"** — links directly to main product (standalone lead magnet)

### If "Funnel" Selected:
- User picks which validated funnel this lead magnet is for
- Lead magnet will naturally lead to the Front-End product of that funnel

### If "Direct to Product" Selected:
- User picks which main product this leads to
- No funnel involved — just lead magnet → main product
- Tagged as "standalone" in database
- Still appears in Visual Builder later

### Option A: AI Generates Lead Magnet Ideas

**User clicks:** "Generate 3 Ideas"

**System returns:** 3 lead magnet ideas

**Critical rules:**
- Ideas come from vector database
- System checks previous lead magnets to ensure freshness
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

**User clicks:** "Generate" — START CONTENT GENERATION

---

## THE GENERATION TRIGGER

**Generation ONLY happens when user clicks "Generate" in Lead Magnet Builder.**

At this point, the system generates:

### If Funnel was selected:
1. Lead Magnet content (2 API calls)
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

### If Direct to Product was selected:
1. Lead Magnet content only (2 API calls)
2. Lead Magnet TLDR (1 API call)
3. Lead Magnet marketplace listing (1 API call)

**Total: 4 API calls** (approximately)

---

## Step 3: Visual Builder

**Purpose:** Turn generated content into branded PDFs.

### User Interface Shows:
- List of COMPLETED funnels (where content has been generated)
- List of STANDALONE lead magnets (direct to product)

### User Selects:
1. A funnel OR standalone lead magnet
2. A visual template (Apple Minimal, Swiss Design, etc.)

### User Clicks: "Generate"

### System Behavior:
- System already knows the format for each product (Cheat Sheet, Checklist, etc.) — **NO MANUAL FORMAT SELECTION**
- Applies the selected visual template to ALL products in the funnel
- Uses the correct format template for each product
- Generates HTML first
- Converts to PDF

### Output:
- HTML files (downloadable)
- PDF files (downloadable)
- All products have consistent branding
- Each product uses its designated format

---

## Step 4: Export / Ready-Made Funnel

**Purpose:** Access all generated assets for distribution.

### Available for Download/Copy:

**PDFs:**
- Lead Magnet PDF
- Front-End PDF
- Bump PDF
- Upsell 1 PDF
- Upsell 2 PDF

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

# PART 5: THE 11 VISUAL TEMPLATES

These are the approved visual styles. User selects ONE for the entire funnel:

1. Apple Minimal
2. Swiss Design
3. Editorial
4. Memphis
5. Brutalist
6. Cluely
7. Dark Glow
8. Black Neon
9. Hand-drawn
10. (Others as defined in mockups)
11. (Others as defined in mockups)

All products in a funnel use the same visual template, but each uses its own format (Checklist, Worksheet, etc.).

---

# PART 6: WHAT GETS GENERATED FOR EACH PRODUCT

## Product Content Structure

### Lead Magnet (2 API calls)
- Cover page (with profile branding)
- 3-5 chapters of content
- Bridge section (leads to Front-End)
- CTA

### Front-End (2 API calls)
- Cover page
- 5-6 chapters of content
- Cross-promo paragraph (links to main product)
- Bridge section (leads to Bump offer context)
- CTA
- Review request (5 stars visual)

### Bump (1 API call)
- Cover page
- 2-3 short chapters (quick, actionable)
- Cross-promo paragraph
- CTA
- Review request

### Upsell 1 (2 API calls)
- Cover page
- 4-6 chapters of content
- Cross-promo paragraph
- Bridge section
- CTA
- Review request

### Upsell 2 (2 API calls)
- Cover page
- 4-6 chapters of content
- Cross-promo paragraph
- CTA
- Review request

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

# PART 7: TECHNICAL RULES

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
- System queries previous funnels/lead magnets
- Ensures new titles and concepts (no duplicates)

---

# PART 8: WHAT THIS IS NOT

To prevent scope creep and misunderstanding:

1. **NOT a video course platform** — PDFs only
2. **NOT using generic AI knowledge** — Vector database only
3. **NOT generating content before validation** — User must validate ideas first
4. **NOT requiring manual format selection in Visual Builder** — Formats are set in funnel idea
5. **NOT requiring complex forms to paste funnel ideas** — Simple text box with parsing
6. **NOT a funnel page builder** — We generate PDFs and marketing assets, not web pages

---

# PART 9: SUCCESS CRITERIA

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

---

# PART 10: CHECKLIST FOR CODE REVIEW

Use this checklist when reviewing any development work:

## Workflow Compliance
- [ ] Generation only triggers from Lead Magnet Builder (not Funnel Builder)
- [ ] Funnel Builder only creates drafts (no content generation)
- [ ] Formats are specified in funnel idea (not selected in Visual Builder)
- [ ] Paste option available for both funnel ideas and lead magnet ideas
- [ ] Direct-to-product option creates standalone lead magnets

## Technical Compliance
- [ ] Using 14 batched API calls (not 51+)
- [ ] Retry system with 7 attempts and escalating delays
- [ ] Progress tracking in database
- [ ] Resume capability implemented
- [ ] Freshness check for new ideas

## Content Compliance
- [ ] All content pulled from vector database
- [ ] TLDRs used for cross-promo and emails (not full content)
- [ ] Cross-promo paragraph in all paid products
- [ ] Review request in all paid products
- [ ] Email style matches Maria Wendt patterns

## Output Compliance
- [ ] All 6 formats supported (Checklist, Worksheet, Planner, Swipe File, Blueprint, Cheat Sheet)
- [ ] All visual templates apply correctly
- [ ] Marketplace listings include Etsy + Normal descriptions
- [ ] Tags are exactly 13 per product, ≤20 chars each
- [ ] Bundle listing generated

---

**END OF VISION DOCUMENT**

This document is the source of truth. If development deviates from this, it must be corrected.
