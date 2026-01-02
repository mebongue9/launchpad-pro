# Technical Decisions Log

## How to Use This File
- Before changing an existing approach, check if there's a documented reason for it
- When making significant decisions, add them here with reasoning
- Future you (or other developers) will thank present you

---

<!-- Template for new decisions:

## Decision: [Short title]
**ID:** DEC-{number}
**Date:** {date}
**Area:** Architecture / Database / API / UI / Deployment / Other

### Context
{What situation led to this decision}

### Options Considered
1. **{Option A}**
   - Pros: {benefits}
   - Cons: {drawbacks}

2. **{Option B}**
   - Pros: {benefits}
   - Cons: {drawbacks}

### Decision
{What we chose}

### Reasoning
{Why we chose it - this is the most important part}

### Consequences
{What this means for the project going forward}

---

-->

## DEC-001: Tech Stack Selection
**Date:** 2025-01-02
**Area:** Architecture

### Context
Choosing the technology stack for Launchpad Pro.

### Options Considered
1. **Next.js + Vercel**
   - Pros: SSR, file-based routing, easy deployment
   - Cons: More complex, overkill for this app

2. **React + Vite + Netlify**
   - Pros: Simple, fast builds, Netlify Functions for serverless
   - Cons: No SSR (not needed for this app)

### Decision
React + Vite + Netlify + Supabase

### Reasoning
- App is primarily client-side with AI generation
- No SEO requirements (coach dashboard, not public content)
- Netlify Functions perfect for Claude API calls
- Supabase provides auth + database + storage in one
- Simpler stack = faster development

### Consequences
- No SSR, but not needed
- All AI calls go through Netlify Functions (keeps API keys secure)
- Supabase handles all backend concerns

---

## DEC-002: Style Template Approach
**Date:** 2025-01-02
**Area:** UI

### Context
How to implement the 11 different visual styles for generated content.

### Decision
Self-contained HTML templates with inline CSS, converted to PDF.

### Reasoning
- HTML is easy to generate and preview
- Inline CSS ensures portability
- PDF conversion gives users downloadable files
- Templates are modular (add/remove without touching core app)

### Consequences
- Need to test PDF rendering quality
- Each template is independent
- Can add new templates without code changes

---
