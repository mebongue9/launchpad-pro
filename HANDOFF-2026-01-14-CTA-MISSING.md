# HANDOFF: Format Templates & Funnel Links
**Date:** 2026-01-14
**Status:** PARTIAL - Critical issues remain

---

## COMPLETED WORK

### 1. Format Template HTML Generation ✓
Created `generate-full-format-htmls.js` that generates 4 format types:
- Blueprint
- Swipe File
- Cheat Sheet
- Planner

### 2. Visual Fixes Applied ✓
- Fixed CSS to match `REFERENCE-16px-approved.html` (A4 size, proper pagination)
- Fixed Blueprint multi-phase chapter parsing
- Fixed Swipe File chapters 4-6 formatting (were showing as giant text blocks)
- Made markdown links clickable, bolded, and in primary color

### 3. Files Generated ✓
Location: `/Users/martinebongue/Desktop/claude code project 1/launchpad-pro/design-testing/`
- `blueprint-FINAL.html`
- `swipefile-FINAL.html`
- `cheatsheet-FINAL.html`
- `planner-FINAL.html`

---

## CRITICAL ISSUE: Missing CTA Paragraphs

### The Problem
**Cheat Sheet and Planner are MISSING the promotional CTA paragraph at the end.**

- Swipe File ✓ Has CTA paragraph with link
- Blueprint ✓ Has CTA paragraph with link
- **Cheat Sheet ✗ NO CTA paragraph - not promoting anything**
- **Planner ✗ NO CTA paragraph - not promoting anything**

This means 50% of generated content is NOT promoting the next product in the funnel.

### Root Cause
The AI content generation prompts did NOT require a CTA paragraph for all formats. This is a prompt/generation issue, NOT a rendering issue.

---

## FUNNEL LOGIC (CORRECT UNDERSTANDING)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FUNNEL STRUCTURE                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   LEAD MAGNET              PAID FUNNEL PRODUCTS         END PRODUCT │
│   (any format)             (any format)                 (main offer)│
│                                                                     │
│   ┌──────────┐            ┌──────────────────┐         ┌──────────┐│
│   │ Could be:│            │ • Front-End      │         │ Main     ││
│   │ -Blueprint            │ • Bump           │         │ Product  ││
│   │ -Swipe   │ ────────►  │ • Upsell 1       │ ──────► │          ││
│   │ -Cheat   │            │ • Upsell 2       │         │          ││
│   │ -Planner │            │                  │         │          ││
│   └──────────┘            └──────────────────┘         └──────────┘│
│        │                           │                               │
│        │                           │                               │
│   Links to:                   Links to:                            │
│   front_end_link              end_product_url                      │
│   (DYNAMIC - from DB)         (DYNAMIC - from DB)                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

KEY POINTS:
• Format types (Blueprint, Swipe File, etc.) are INDEPENDENT of funnel position
• Any format can be used for any product (lead magnet, front-end, upsell, etc.)
• URLs are DYNAMIC - pulled from database fields, not hardcoded
• EVERY piece of content must have a CTA promoting the next product
```

---

## DATABASE FIELDS FOR URLS

| Field | Purpose | Example Value |
|-------|---------|---------------|
| `front_end_link` | URL of the front-end product | `https://martinebongue.com/zerotohero` |
| (end product URL) | URL of the main/end product | `https://martinebongue.com/3ktiny-audience` |

---

## WHAT NEEDS TO BE DONE

### Priority 1: Fix Content Generation Prompts
The AI prompts that generate content for Cheat Sheet and Planner formats MUST include instructions to add a CTA paragraph at the end promoting the next product.

**Files to investigate:**
- Look for content generation prompts in `/netlify/functions/` or similar
- Find where format-specific content is generated
- Add requirement for CTA paragraph in ALL formats

### Priority 2: Document Funnel Logic
Write this funnel logic somewhere permanent so it's always followed:
- Lead magnets → link to `front_end_link`
- Funnel products → link to end product URL
- ALL content must have CTA paragraph

### Priority 3: Regenerate Missing Content
Once prompts are fixed, regenerate the Cheat Sheet and Planner content to include CTA paragraphs.

---

## KEY FILES

| File | Purpose |
|------|---------|
| `/generate-full-format-htmls.js` | Generates HTML from funnel data |
| `/design-testing/*-FINAL.html` | Generated HTML outputs |
| `/netlify/functions/lib/batched-generators.js` | Content generation (check for prompts) |

---

## WARNING

Do NOT assume format types are tied to funnel positions. The system dynamically assigns formats to any funnel element. Always check the data to know what role a piece of content plays.
