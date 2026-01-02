# Launchpad Pro — Project Brief

## What We're Building

A SaaS web application for coaches that automates the creation of digital products, lead magnets, and presentations. Users log in, answer a few questions, and the AI generates complete product funnels with professionally designed PDFs and presentation slides.

---

## The Problem We're Solving

Coaches struggle with:
1. **Coming up with product ideas** — What should I sell? What format? What price?
2. **Writing the content** — The actual copy, frameworks, checklists, guides
3. **Designing the deliverables** — Making PDFs and slides look professional
4. **Creating lead magnets** — Free content that actually sells the paid products
5. **Building coherent funnels** — Products that naturally lead to each other

This app solves ALL of these in one place.

---

## Target User

- Coaches, consultants, course creators
- Non-technical (can't code, don't want to learn tools)
- Already have expertise but struggle with packaging/productizing
- May have existing products OR starting from scratch
- Value speed and done-for-you solutions

---

## Core Value Proposition

"Go from idea to designed, downloadable product funnel in one session."

---

## Key Features

### 1. Profile & Branding Setup
Users create profiles with:
- Name, business name, tagline
- Logo, photo (optional)
- Website/social handle
- Target audience description
- Niche/expertise area

These get embedded into all generated content and designs.

### 2. Funnel Builder
AI-powered funnel architecture:
- User selects profile + audience
- Optionally adds existing product as final upsell
- AI suggests complete funnel structure:
  - Front-end product ($7-17)
  - Bump offer ($7-17)
  - Upsell 1 ($27-47)
  - Upsell 2 ($47-97)
  - Upsell 3 (their existing product OR new $97-197)
- Each product has a recommended FORMAT (checklist, guide, calendar, templates, etc.)
- User approves or tweaks
- AI generates content for each product
- **Front-end product includes Promotion Kit** (in case they skip the lead magnet):
  - Video script with exact words
  - Sales captions
  - Ready to promote directly

### 3. Lead Magnet Builder
- Takes the front-end product from the funnel
- AI suggests 3 lead magnet ideas (avoids duplicates)
- User picks one
- AI writes the full content
- Content naturally bridges to the front-end product
- **Delivers complete Promotion Kit:**
  - Video script with exact words (hook → value → bridge → CTA)
  - Caption for Instagram/Facebook (comment version)
  - Caption for TikTok/DMs (DM version)
  - Keyword for CTA
  - Recording tips
  - Ready to copy-paste and post immediately

### 4. Visual Builder
Transforms content into designed outputs:
- User picks a style template (12 options)
- AI generates beautiful HTML
- Automatically converts to PDF
- Both versions saved and downloadable

### 5. Presentation Mode
- Click "Present" on any HTML output
- Full-screen presentation with keyboard navigation
- Users can record with Loom or screen share directly

### 6. Creation History
- All outputs saved to user's account
- Can re-download HTML or PDF anytime
- See what's been created (prevents duplicates)

---

## User Flow

```
1. SIGN UP / LOG IN
        ↓
2. CREATE PROFILE (one-time setup)
   - Name, brand, tagline, logo, photo
   - Can create multiple profiles for different businesses
        ↓
3. ADD AUDIENCES (reusable)
   - Who they help, pain points, desires
   - Can create multiple audiences
        ↓
4. BUILD FUNNEL
   - Select profile + audience
   - Optionally link existing product as final upsell
   - AI suggests funnel → User approves
   - AI generates content for each product
        ↓
5. CREATE LEAD MAGNET
   - AI suggests 3 options for front-end product
   - User picks one → AI writes content
        ↓
6. GENERATE VISUALS
   - Select what to design (product or lead magnet)
   - Pick style template
   - AI generates HTML + PDF
        ↓
7. PRESENT OR DOWNLOAD
   - Present directly in browser
   - Download PDF or HTML
   - Saved to history
```

---

## What Makes This Different

1. **All-in-one** — Strategy, content, AND design in one tool
2. **AI makes the decisions** — Users just approve or tweak
3. **Anti-cannibalization** — Funnel products designed to lead to each other
4. **Professional output** — Not generic templates, actual designed PDFs
5. **Built for coaches** — Language, examples, formats all coach-specific

---

## Technical Approach

- **Frontend**: React (Vite) hosted on Netlify
- **Backend/Database**: Supabase (auth + PostgreSQL + storage)
- **AI**: Claude API for all generation
- **PDF Generation**: HTML rendered to PDF via Puppeteer or similar
- **No n8n** — Everything contained in the app

---

## Style Templates (11 total)

**Clean/Professional:**
- Apple Minimal
- Apple Keynote Style (Light)
- Minimalist Clean
- Swiss Design
- Editorial Magazine

**Creative/Trendy:**
- Memphis Design
- Hand-drawn Sketch
- Brutalist
- Cluely Style

**Dark/Tech:**
- Dark Glowing Style
- Black Neon Glow

---

## Success Metrics

- User can go from zero to downloadable PDF in under 30 minutes
- Generated content is good enough to use without major edits
- Designs look professional, not "made by AI"
- Funnel logic is sound (products lead to each other naturally)

---

## Project Name

**Launchpad Pro**

*Companion to Launch Builder Pro: Build the offer → Launch the offer*

---

## References

This project builds on:
1. **Zane's Presentation Builder** — Visual generation approach via Claude
2. **Existing Lead Magnet Agent** — Prompt structure and flow
3. **Maria Wendt's Framework** — Content strategy and funnel logic
