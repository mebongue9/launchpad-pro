# Generation Template Reference

This document defines the exact formatting and field mappings for all generated content.

---

## Database Field Mappings

### Funnels Table - Top-Level Columns

| Field | Type | Description |
|-------|------|-------------|
| `front_end_link` | text | **Product URL for front-end product** - Use this in emails, NOT `front_end.url` |
| `front_end` | jsonb | Front-end product data including marketplace_listing, email_sequence, tldr |
| `bump` | jsonb | Bump product data |
| `upsell_1` | jsonb | Upsell 1 product data |
| `upsell_2` | jsonb | Upsell 2 product data |
| `bundle_listing` | jsonb | Bundle marketplace data |
| `front_end_tldr` | jsonb | TLDR for front-end (also nested in front_end.tldr) |
| `bump_tldr` | jsonb | TLDR for bump |
| `upsell_1_tldr` | jsonb | TLDR for upsell 1 |
| `upsell_2_tldr` | jsonb | TLDR for upsell 2 |

### Product JSONB Structure (front_end, bump, upsell_1, upsell_2)

```json
{
  "name": "Product Name",
  "price": 17,
  "format": "Digital product",
  "tldr": {
    "what_it_is": "...",
    "who_its_for": "...",
    "problem_solved": "...",
    "key_benefits": ["...", "..."],
    "whats_inside": ["...", "..."],
    "cta": "..."
  },
  "marketplace_listing": {
    "marketplace_title": "...",
    "marketplace_description": "...",
    "marketplace_bullets": ["...", "..."],
    "marketplace_tags": ["...", "..."]
  },
  "email_sequence": [
    { "subject": "...", "body": "..." },
    { "subject": "...", "body": "..." },
    { "subject": "...", "body": "..." }
  ]
}
```

---

## Marketplace Description - 7-Section Framework

### Individual Product Descriptions

Each product description MUST have these 7 sections:

```
𝗪𝗛𝗔𝗧 𝗜𝗧 𝗜𝗦:
[One sentence from TLDR what_it_is]

━━━━━━━━━━

𝗪𝗛𝗢 𝗜𝗧'𝗦 𝗙𝗢𝗥:
[From TLDR who_its_for with situation + frustration]

━━━━━━━━━━

𝗣𝗥𝗢𝗕𝗟𝗘𝗠 𝗦𝗢𝗟𝗩𝗘𝗗:
[From TLDR problem_solved - emotional]

━━━━━━━━━━

𝗞𝗘𝗬 𝗕𝗘𝗡𝗘𝗙𝗜𝗧𝗦:

• Transformation benefit 1
• Transformation benefit 2
• Transformation benefit 3
• Transformation benefit 4

━━━━━━━━━━

𝗪𝗛𝗔𝗧'𝗦 𝗜𝗡𝗦𝗜𝗗𝗘:

• 𝗗𝗲𝗹𝗶𝘃𝗲𝗿𝗮𝗯𝗹𝗲 𝟭 so you can [benefit]
• 𝗗𝗲𝗹𝗶𝘃𝗲𝗿𝗮𝗯𝗹𝗲 𝟮 so you can [benefit]
• 𝗗𝗲𝗹𝗶𝘃𝗲𝗿𝗮𝗯𝗹𝗲 𝟯 so you can [benefit]
• 𝗗𝗲𝗹𝗶𝘃𝗲𝗿𝗮𝗯𝗹𝗲 𝟰 so you can [benefit]

━━━━━━━━━━

𝗪𝗛𝗔𝗧 𝗬𝗢𝗨'𝗟𝗟 𝗕𝗘 𝗔𝗕𝗟𝗘 𝗧𝗢 𝗗𝗢:

• 𝗔𝗰𝘁𝗶𝗼𝗻 𝟭 result they'll achieve
• 𝗔𝗰𝘁𝗶𝗼𝗻 𝟮 result they'll achieve
• 𝗔𝗰𝘁𝗶𝗼𝗻 𝟯 result they'll achieve
• 𝗔𝗰𝘁𝗶𝗼𝗻 𝟰 result they'll achieve

━━━━━━━━━━

[CTA - one action-oriented line]
```

---

## Critical Formatting Rules

### 1. Unicode Bold (Required)

Use Unicode bold characters for:
- Section headers
- Deliverables in "What's Inside" (text before "so you can")
- Actions in "What You'll Be Able To Do"

**Unicode Bold Alphabet:**
```
𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭
𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇
𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵
```

**NO markdown `**` symbols** - they display as raw text on Etsy/Gumroad.

### 2. Double Newlines After Section Headers

The UI splits descriptions by `\n\n` and only renders bullets properly if the section STARTS with `•`.

**WRONG:** `𝗞𝗘𝗬 𝗕𝗘𝗡𝗘𝗙𝗜𝗧𝗦:\n• Item 1` (single newline)
**CORRECT:** `𝗞𝗘𝗬 𝗕𝗘𝗡𝗘𝗙𝗜𝗧𝗦:\n\n• Item 1` (double newline)

### 3. Bullets on Separate Lines

**WRONG:** `• Item 1 • Item 2 • Item 3` (all on one line)
**CORRECT:**
```
• Item 1
• Item 2
• Item 3
```

### 4. Separator Lines

Use `━━━━━━━━━━` or `---` as section dividers between major sections.

---

## Bundle Description Framework

Bundle descriptions follow the same 7-section framework but with product sub-sections:

```
[Section 1: WHAT IT IS - synthesize all 4 products]

[Section 2: WHO IT'S FOR]

[Section 3: PROBLEM SOLVED]

[Section 4: KEY BENEFITS - 5-7 bullets]

[Section 5: WHAT'S INSIDE - one block per product]

𝗣𝗿𝗼𝗱𝘂𝗰𝘁 𝟭 𝗡𝗮𝗺𝗲

The wall every [audience] eventually hits: [problem]

• 𝗗𝗲𝗹𝗶𝘃𝗲𝗿𝗮𝗯𝗹𝗲 so you can [benefit]
• 𝗗𝗲𝗹𝗶𝘃𝗲𝗿𝗮𝗯𝗹𝗲 so you can [benefit]

---

𝗣𝗿𝗼𝗱𝘂𝗰𝘁 𝟮 𝗡𝗮𝗺𝗲

Fixes the problem X% of [audience] have: [problem]

• 𝗗𝗲𝗹𝗶𝘃𝗲𝗿𝗮𝗯𝗹𝗲 so you can [benefit]
• 𝗗𝗲𝗹𝗶𝘃𝗲𝗿𝗮𝗯𝗹𝗲 so you can [benefit]

---

... (Products 3 & 4)

---

𝗪𝗛𝗔𝗧 𝗬𝗢𝗨'𝗟𝗟 𝗕𝗘 𝗔𝗕𝗟𝗘 𝗧𝗢 𝗗𝗢:

• Transformation bullet 1
• Transformation bullet 2
• Transformation bullet 3

[CTA]
```

**IMPORTANT:** Always include a `---` separator BEFORE the "WHAT YOU'LL BE ABLE TO DO" section.

---

## Email Generation

### URL Field

**Use `front_end_link` (top-level column)** for product URLs in emails.

**WRONG:** `funnel.front_end.url` (does not exist)
**CORRECT:** `funnel.front_end_link`

### Email Structure

Each product has 3 emails in `email_sequence`:
- Email 1: Welcome/delivery email
- Email 2: Value email
- Email 3: Testimonial/case study email

---

## Post-Processing (fixBulletNewlines)

The `fixBulletNewlines()` function in `batched-generators.js` automatically:
1. Replaces ` • ` with `\n•` (puts bullets on separate lines)
2. Replaces `:\n•` with `:\n\n•` (adds double newline after headers)

This ensures proper UI rendering even if the LLM doesn't follow formatting exactly.

---

## Files Reference

| File | Purpose |
|------|---------|
| `netlify/functions/lib/batched-generators.js` | Main generation code with prompts |
| `netlify/functions/fix-funnel-data.js` | One-time fix script for existing data |
| `src/components/funnel/MarketplaceListings.jsx` | UI that renders marketplace descriptions |
| `src/hooks/useMarketplaceListings.js` | Hook for fetching/generating listings |
