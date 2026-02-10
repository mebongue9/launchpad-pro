# HANDOFF: PDF Cross-Promo Clickable Links — COMPLETE

**Date:** February 7, 2026
**Session:** Cross-Promo Fix Round 1 + Round 2
**Status:** DEPLOYED & VERIFIED — All 5 product types have working clickable links
**Deploy ID:** `69861f8201cef21ef0d81f28`
**Branch:** `fix/pdf-cross-promo-complete` (commit `bdcaf8e`) — NOT YET MERGED INTO MAIN

---

## CRITICAL: MERGE REQUIRED

The fixes are **live in production** (deployed from the feature branch) but the `main` branch does NOT contain them. The next step is:

```bash
cd "/Users/martinebongue/Desktop/claude code project 1/launchpad-pro"
git checkout main
git merge fix/pdf-cross-promo-complete
```

There is also an older branch `fix/pdf-cross-promo-rendering` whose changes are fully included in `fix/pdf-cross-promo-complete`, so it can be deleted after merge.

Another branch `fix/marketplace-title-seo-keywords` also exists and was completed in a prior session (marketplace title SEO keyword fix). It should also be merged or cleaned up.

---

## WHAT WAS THE PROBLEM

The app generates PDF ebooks for 5 product types in a sales funnel: Lead Magnet, Front-End, Bump, Upsell 1, Upsell 2. Each PDF is supposed to end with a cross-promotional paragraph that links the reader to the seller's main product — this is the entire monetization mechanism of the app.

**Two bugs prevented this from working:**

### Bug 1: CSS `overflow: hidden` clipped content (Round 1)
- `interior-renderer.js` had `.page { height: 297mm; overflow: hidden; }` and `.page-content { max-height: 9.1in; overflow: hidden; }`
- Any content exceeding the page box — including cross-promo paragraphs at the end of chapters — was silently clipped and invisible in the PDF
- Additionally, markdown links like `[text](url)` were being passed through `escapeHtml()` in 5 format renderers, destroying the `<a>` tags

### Bug 2: Cross-promo link never appended (Round 2)
- `batched-generators.js` builds a cross-promo paragraph via `buildCrossPromoParagraph()` that includes a markdown link `[Learn more about Product](https://url)`
- BUT the append condition checked if the AI already mentioned the product **name**: `!chapter.content.includes(product.name)`
- The AI prompt asks it to mention the product, so it would say "check out Product X" — but WITHOUT the URL
- Since the name was present, the condition was `false`, so the paragraph WITH the URL was never appended
- Result: bridge/cross-promo text existed but had NO clickable link

---

## WHAT WAS FIXED

### 4 files changed, 117 insertions, 27 deletions

### File 1: `netlify/functions/lib/interior-renderer.js`

1. **CSS overflow fix:**
   - `.page`: Changed `height: 297mm` → `min-height: 297mm`, removed `overflow: hidden`
   - `.page-content`: Removed `max-height: 9.1in` and `overflow: hidden`

2. **Link CSS added:**
   ```css
   .page-content a, .body-text a, .step-text a, p a {
     color: var(--primary-color);
     text-decoration: underline;
     font-weight: 500;
   }
   ```

3. **Import added:** `import { parseChapterContent, parseMarkdown } from './content-parser.js'`

4. **5 format renderers fixed** — changed `escapeHtml()` → `parseMarkdown()` so markdown links become clickable `<a>` tags:
   - Line ~1131: **Blueprint** — `escapeHtml(step.text)` → `parseMarkdown(step.text)`
   - Line ~1172: **Cheat-sheet** — `escapeHtml(item)` → `parseMarkdown(item)`
   - Line ~1216: **Planner** — `escapeHtml(task.text)` → `parseMarkdown(task.text)`
   - Line ~1418: **Worksheet** — `escapeHtml(line)` → `parseMarkdown(line)`
   - Line ~1529: **Swipe-file** — `escapeHtml(p)` → `parseMarkdown(p)`

### File 2: `netlify/functions/lib/content-parser.js`

- Added markdown link regex to `simpleMarkdownParse()` fallback parser (BEFORE bold/italic regexes):
  ```js
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  ```

### File 3: `netlify/functions/lib/batched-generators.js`

- Fixed cross-promo append condition at **5 locations** (one per product type):
  - Lines ~600 (Lead Magnet), ~837 (Front-End), ~952 (Bump), ~1131 (Upsell 1), ~1318 (Upsell 2)

  **Before:**
  ```js
  if (chapter.content && !chapter.content.toLowerCase().includes(product.name.toLowerCase())) {
      chapter.content += crossPromo;
  }
  ```

  **After:**
  ```js
  if (chapter.content && crossPromo) {
      const hasMarkdownLink = /\[.*?\]\(https?:\/\/.*?\)/.test(chapter.content);
      if (!hasMarkdownLink) {
          chapter.content += crossPromo;
      }
  }
  ```

### File 4: `netlify/functions/visual-builder-generate.js`

- **Render-time safety net for lead magnets** (after content load, ~line 169):
  - If last chapter has no markdown link, fetches `front_end_link` from the funnel via `lead_magnets.funnel_id`
  - Appends `[Learn more about {name}]({front_end_link})` to the last chapter content
  - This ensures even old DB content without links gets a clickable URL at render time

- **Render-time safety net for paid products** (after content load, ~line 122):
  - If last chapter has no markdown link, fetches main product URL from `existing_products` table
  - Appends `[Learn more about {name}]({url})` to the last chapter content

- **Query changes:**
  - Funnels query now includes `user_id`: `.select('front_end, bump, upsell_1, upsell_2, user_id')`
  - Lead magnets query now includes `funnel_id`: `.select('content, funnel_id')`

---

## VERIFICATION RESULTS (ACTUAL PDF OUTPUT)

All 5 product types tested with real PDF generation via the deployed API. Links verified using pypdf annotation extraction (URI annotations in PDF spec).

| Product Type | Cross-Promo Present | Clickable Link | URL | PDF Page |
|---|---|---|---|---|
| Lead Magnet | YES | YES | `https://martinebongue.com/avalanche` | 8 |
| Front-End | YES | YES | `https://martinebongue.com/3ktiny-audience` | 8 |
| Bump | YES | YES | `https://martinebongue.com/3ktiny-audience` | 3 |
| Upsell 1 | YES | YES | `https://martinebongue.com/3ktiny-audience` | 8 |
| Upsell 2 | YES | YES | `https://martinebongue.com/3ktiny-audience` | 13 |

- Lead Magnet links to `front_end_link` from the funnels table (the Front-End product listing)
- All paid products (Front-End, Bump, Upsell 1, Upsell 2) link to the main product URL from `existing_products` table

---

## DATABASE SCHEMA RELEVANT TO CROSS-PROMO

```
funnels table:
  - id (UUID)
  - front_end_link (TEXT) — URL where the front-end product is sold (used by lead magnet bridge)
  - front_end (JSONB) — { name, chapters: [{ title, content }] }
  - bump (JSONB) — same structure
  - upsell_1 (JSONB) — same structure
  - upsell_2 (JSONB) — same structure
  - user_id (UUID) — FK to auth.users

lead_magnets table:
  - id (UUID)
  - funnel_id (UUID) — FK to funnels
  - content (TEXT) — JSON string with { name, chapters: [...] }

existing_products table:
  - id (UUID)
  - user_id (UUID) — FK to auth.users
  - name (TEXT)
  - url (TEXT) — main product URL (used by paid product cross-promos)

Cross-promo content is stored INSIDE the last chapter's `content` field as appended text.
The {level}_cross_promo columns on funnels are all NULL and unused.
```

---

## HOW THE CROSS-PROMO PIPELINE WORKS (END TO END)

1. **Generation** (`batched-generators.js`):
   - `buildCrossPromoParagraph({name, url})` creates a promotional paragraph with markdown link
   - For lead magnets: uses `funnel.front_end_link` as the URL
   - For paid products: uses `existing_products.url` as the URL
   - After AI generates chapter content, the cross-promo is appended to the last chapter IF no markdown link already exists

2. **Storage**: Cross-promo text is stored as part of the last chapter's `content` field in the JSONB column

3. **Rendering** (`visual-builder-generate.js`):
   - Loads content from DB
   - Safety net: if last chapter has no markdown link, fetches the appropriate URL and injects it
   - Passes content to `interior-renderer.js`

4. **HTML Rendering** (`interior-renderer.js` + `content-parser.js`):
   - `parseChapterContent()` parses markdown including `[text](url)` → `<a>` tags
   - Format-specific renderers use `parseMarkdown()` instead of `escapeHtml()` to preserve links
   - Link CSS ensures visibility and clickability

5. **PDF Conversion**: PDFShift (Chromium-based) converts HTML to PDF, preserving `<a>` tags as clickable URI annotations

---

## LESSONS LEARNED

1. **Check for link presence, not product name** — AI will mention a product name in promotional text without including a URL. The condition must check for `[text](url)` pattern, not just the product name string.

2. **CSS `overflow: hidden` silently kills content in PDFs** — Never use fixed heights with overflow:hidden on PDF page containers. Use `min-height` instead.

3. **Git branch management matters for deploys** — `netlify deploy --prod` deploys the current working directory. When switching branches, changes from the feature branch disappear from the working tree. Must ensure all changes are present before deploying (use `git checkout branch -- file` to cherry-pick files if needed).

4. **Render-time safety net > relying on generation alone** — The generation prompt can't guarantee the AI includes a URL. Adding a programmatic safety net at render time that checks for link presence and injects one from the DB is more reliable.

5. **The `marked` library's `parseInline()` handles links natively** — But the fallback `simpleMarkdownParse()` function needed the link regex added manually since it's used when `marked` isn't available.

---

## WORKING DIRECTORY STATE

The `main` branch currently does NOT have the cross-promo fixes. The working directory has other unstaged changes from previous sessions (Etsy Empire work, etc.). The git status shows modified files across multiple features.

**Branches to potentially merge/clean up:**
- `fix/pdf-cross-promo-complete` — THIS fix (the important one)
- `fix/pdf-cross-promo-rendering` — Subset of the above, can be deleted after merge
- `fix/marketplace-title-seo-keywords` — Separate completed feature (marketplace title SEO)

---

## FILES REFERENCE

| File | Purpose | Lines Changed |
|---|---|---|
| `netlify/functions/lib/interior-renderer.js` | PDF page HTML/CSS rendering | CSS fix + 5 renderer fixes |
| `netlify/functions/lib/content-parser.js` | Markdown → HTML parser | +2 lines (link regex) |
| `netlify/functions/lib/batched-generators.js` | AI content generation | 5 condition fixes |
| `netlify/functions/visual-builder-generate.js` | PDF generation entry point | +2 safety nets, query changes |

---

**END OF HANDOFF**
