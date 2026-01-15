# HANDOFF: Format Templates & Funnel Links
**Date:** 2026-01-14
**Session:** 2
**Status:** PARTIAL - Critical issues remain

---

## COMPLETED WORK

### 1. Format Template HTML Generation
Created `generate-full-format-htmls.js` that generates 4 format types:
- Blueprint
- Swipe File
- Cheat Sheet
- Planner

### 2. Visual Fixes Applied
- Fixed CSS to match `REFERENCE-16px-approved.html` (A4 size, proper pagination)
- Fixed Blueprint multi-phase chapter parsing
- Fixed Swipe File chapters 4-6 formatting (were showing as giant text blocks)
- Made markdown links clickable, bolded, and in primary color

### 3. Files Generated
Location: `/design-testing/`
- `blueprint-FINAL.html`
- `swipefile-FINAL.html`
- `cheatsheet-FINAL.html`
- `planner-FINAL.html`

---

## CRITICAL ISSUE: Missing CTA Paragraphs

### The Problem
**Cheat Sheet and Planner are MISSING the promotional CTA paragraph at the end.**

| Format | CTA Status |
|--------|------------|
| Swipe File | HAS CTA paragraph with link |
| Blueprint | HAS CTA paragraph with link |
| Cheat Sheet | MISSING - not promoting anything |
| Planner | MISSING - not promoting anything |

50% of generated content is NOT promoting the next product in the funnel.

### Root Cause
The AI content generation prompts did NOT require a CTA paragraph for all formats. This is a **prompt/generation issue**, NOT a rendering issue.

---

## FUNNEL LOGIC

- Format types (Blueprint, Swipe File, etc.) are INDEPENDENT of funnel position
- Any format can be used for any product (lead magnet, front-end, upsell, etc.)
- URLs are DYNAMIC - pulled from database fields, not hardcoded
- Lead magnets link to `front_end_link`
- Funnel products link to end product URL
- EVERY piece of content must have a CTA promoting the next product

---

## DATABASE FIELDS

| Field | Purpose |
|-------|---------|
| `front_end_link` | URL of the front-end product (top-level column in funnels table) |
| end product URL | URL of the main/end product |

---

## WHAT NEEDS TO BE DONE

### Priority 1: Fix Content Generation Prompts
Files to investigate:
- `/netlify/functions/lib/batched-generators.js`
- Find format-specific content generation
- Add CTA paragraph requirement for ALL formats

### Priority 2: Regenerate Content
Once prompts are fixed, regenerate Cheat Sheet and Planner content.

---

## KEY FILES

| File | Purpose |
|------|---------|
| `generate-full-format-htmls.js` | Generates HTML from funnel data |
| `design-testing/*-FINAL.html` | Generated HTML outputs |
| `netlify/functions/lib/batched-generators.js` | Content generation (check for prompts) |

---

## WARNING

Do NOT assume format types are tied to funnel positions. The system dynamically assigns formats to any funnel element.
