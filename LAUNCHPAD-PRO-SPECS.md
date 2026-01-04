# Launchpad Pro - Complete Project Specifications

**Document Purpose:** This document provides comprehensive context for AI assistants (Claude Opus or similar) to understand the Launchpad Pro project's current state, philosophies, constraints, and implementation details.

**Last Updated:** January 3, 2026

---

## 1. Project Overview

### What is Launchpad Pro?

Launchpad Pro is a SaaS application designed specifically for **coaches** to:
- Generate AI-powered product funnels
- Create lead magnet ideas and content
- Build PDF-based digital products
- Design lead magnets with ready-to-use promotion kits

### Who is it for?

**Target User:** Coaches, course creators, and digital product sellers who want to quickly create and sell digital products without video production.

### Core Value Proposition

- **Few taps to post**: Minimize steps from idea to published lead magnet
- **AI-powered generation**: Claude API generates content based on user's knowledge base
- **PDF-only products**: No video courses - everything is a downloadable PDF
- **Vector-grounded content**: Content is generated from user's actual knowledge (vector database), not hallucinated

---

## 2. Technical Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Auth & Database | Supabase (PostgreSQL) |
| Hosting | Netlify (static + functions) |
| AI Generation | Claude API (claude-sonnet-4-20250514) |
| Vector Search | OpenAI Embeddings + Supabase |

### Key Files & Their Purposes

```
src/
├── pages/
│   ├── Dashboard.jsx          # Main dashboard
│   ├── Profiles.jsx           # Creator profile management
│   ├── Audiences.jsx          # Target audience management
│   ├── ExistingProducts.jsx   # User's existing products (final destination)
│   ├── FunnelBuilder.jsx      # AI funnel generation
│   ├── LeadMagnetBuilder.jsx  # Lead magnet idea → content generation
│   ├── VisualBuilder.jsx      # Visual PDF builder
│   ├── History.jsx            # Generation history
│   ├── Settings.jsx           # User settings
│   ├── Login.jsx              # Authentication
│   └── Signup.jsx             # User registration
├── hooks/
│   ├── useAuth.jsx            # Authentication hook
│   ├── useFunnels.jsx         # Funnel CRUD operations
│   └── useGenerationJob.jsx   # Background job polling
├── prompts/
│   └── product-prompts.js     # All prompt constants & guidelines
└── lib/
    └── supabase.js            # Supabase client

netlify/functions/
├── process-generation-background.js  # Background function (15 min timeout)
├── start-generation.js               # Starts background jobs
├── check-job-status.js               # Polls job status
├── generate-lead-magnet-ideas.js     # Generates 3 lead magnet ideas
├── generate-funnel.js                # Funnel generation (legacy sync)
├── generate-content.js               # Product content generation
├── vector-search.js                  # Knowledge base search
└── setup-database.js                 # Database initialization
```

### Database Schema (Supabase)

Key tables:
- `profiles` - Creator profiles (name, business, niche, vibe)
- `audiences` - Target audiences (name, pain_points[], desires[])
- `existing_products` - User's existing products (final destination)
- `funnels` - Generated funnels (front_end, bump, upsell_1, upsell_2)
- `lead_magnets` - Generated lead magnets
- `knowledge_chunks` - Vector embeddings of user's content
- `generation_jobs` - Background job tracking

---

## 3. Core Philosophies & Constraints

### Philosophy 1: PDF-Only Products (MANDATORY)

**Rule:** Every product in the system MUST be a PDF-based deliverable. No exceptions.

**Allowed Formats:**
- Multi-Page Guide/PDF
- Checklist/Steps
- Cheat Sheet
- Swipe File
- Blueprint
- Workbook
- Google Doc
- Strategy/System

**Forbidden Formats (NEVER suggest):**
- Video courses
- Mini-courses
- Training modules
- Masterclass
- Workshops
- Anything with "hours" or time commitments
- Anything requiring video production

### Philosophy 2: SMALL = FAST RESULTS

**Rule:** People want quick wins, not 200-page manuals.

- A 1-page guide is MORE appealing than a 50-page guide
- "Get results in 3 simple steps" beats "comprehensive 100-page manual"
- Short = Easy to consume = Higher completion rate = More desire for paid product
- Numbers like 1, 3, 5, 7 are BETTER than 42, 88, 127

### Philosophy 3: NUMBER x ITEM LENGTH Rule (CRITICAL)

**The number you use depends on what TYPE of item it is:**

#### SHORT ITEMS (one-liners, few words each) = BIG numbers OK

| Item Type | Allowed Range | Example |
|-----------|---------------|---------|
| Ideas/Titles | 100-365 | "100 Instagram Reel Ideas" |
| Hooks/One-liners | 50-100 | "75 Hooks That Stop Scroll" |
| Subject Lines | 50-100 | "50 Email Subject Lines" |
| Prompts | 30-50 | "50 ChatGPT Prompts for Coaches" |
| DM One-Liners | 30-100 | "50 DM One-Liners That Get Replies" |

**Why?** These are just lists of short lines. "100 Reel Ideas" = 100 short lines = easy to scan.

#### LONG ITEMS (pages, paragraphs, detailed content) = SMALL numbers ONLY

| Item Type | Max Number | Example |
|-----------|------------|---------|
| Pages/Guides | 1-5 | "The 3-Page Blueprint" |
| Full Templates | 5-15 | "7 Email Templates That Convert" |
| Scripts | 5-10 | "5 Discovery Call Scripts" |
| Steps/Checklist | 3-10 | "7 Steps to Premium Clients" |
| Full Sequences | 3-7 | "5 Email Sequences" |

**Why?** These are detailed, multi-paragraph items. "42-Page Guide" = too much reading!

#### BAD Examples (NEVER DO THIS)

- "42-Page Guide to..." - TOO MANY PAGES!
- "88 Full Email Sequences" - Each sequence is LONG!
- "50 Complete Sales Scripts" - Each script is LONG!
- "The 100-Page Manual" - Way too much reading!
- "127-Page Complete Guide" - Unrealistic!

### Philosophy 4: Anti-Cannibalization Principle

**Each funnel level serves a SPECIFIC purpose. NEVER let a lower tier fully satisfy the need:**

| Level | Price | Purpose | Pages |
|-------|-------|---------|-------|
| Lead Magnet | FREE | Creates AWARENESS of problem | 1-5 MAX |
| Front-End | $7-17 | Solves ONE IMMEDIATE NEED partially | 5-10 MAX |
| Bump | $7-17 | Makes front-end FASTER or EASIER | 3-5 MAX |
| Upsell 1 | $27-47 | Goes DEEPER into implementation | 10-15 MAX |
| Upsell 2 | $47-97 | Provides DONE-FOR-YOU elements | 15-21 MAX |
| User's Product | $97+ | FINAL destination (signature course) | N/A |

**Key Rule:** Each product CREATES DESIRE for the next. They complement, not compete.

### Philosophy 5: Vector Database Grounding

**Rule:** Content should come from the user's actual knowledge base (vector DB), not hallucinated.

- Lead magnet ideas should be grounded in topics that exist in the knowledge base
- If no relevant knowledge chunks found, say so - do not fabricate
- Vector search uses OpenAI embeddings with cosine similarity

---

## 4. Funnel Structure

### Only 4 Products in a Funnel (NO upsell_3)

```
Front-End ($7-17)
    ↓
Bump ($7-17) - Add-on at checkout
    ↓
Upsell 1 ($27-47)
    ↓
Upsell 2 ($47-97)
    ↓
User's Existing Product (Final Destination)
```

**Important:** The user's existing product IS the final destination. Upsell 2 bridges to it. There is NO upsell_3 in the system.

---

## 5. System Prompts (Full Text)

### Lead Magnet Strategist Prompt

```
You are an elite lead magnet strategist. Your recommendations are based on PROVEN data from 1,153 high-performing Instagram posts (Maria Wendt analysis).

## CORE PHILOSOPHY: SMALL = FAST RESULTS
People don't want to read 40+ pages. They want QUICK WINS.
- A 1-page guide is MORE appealing than a 50-page guide
- "Get results in 3 simple steps" beats "comprehensive 100-page manual"
- Short = Easy to consume = Higher completion rate = More desire for paid product

## FORMAT PERFORMANCE (by average comments - PROVEN DATA)
1. Strategy/System: 1,729 avg - "my exact strategy for..."
2. ChatGPT Prompt: 1,429 avg - specific prompts for outcomes
3. Google Doc: 946 avg - collections, lists, resources
4. Checklist/Steps: 808 avg - X steps to achieve Y
5. Cheat Sheet: Quick reference one-pager

## LEAD MAGNET LENGTH (CRITICAL - FOLLOW EXACTLY)
Lead magnets MUST be SHORT and QUICK to consume:
- 1-5 pages MAXIMUM
- 3-7 steps/items MAXIMUM
- Can be consumed in 5-10 minutes

## PDF-ONLY FORMATS (MANDATORY)
- Strategy/System (my exact strategy for...)
- Checklist (X Simple Steps to...)
- Cheat Sheet (The 1-Page Cheat Sheet)
- Blueprint (The Simple Blueprint)
- Swipe File (X Ready-to-Use Templates)

## FORBIDDEN (NEVER suggest):
- Video courses, mini-courses, training modules
- Multi-page guides over 5 pages for a lead magnet
- "Comprehensive" or "Complete" guides - sounds like work
- Big numbers for LONG items (e.g., "50-Page Guide", "88 Full Templates")

## SPECIFICITY FORMULA (REQUIRED)
[NUMBER] + [FORMAT] + [DESIRED OUTCOME] + [TIME/EFFORT QUALIFIER]

## CRITICAL: NUMBER x ITEM LENGTH RULE
The number depends on what type of item it is:

**SHORT ITEMS (one-liners, few words each) = BIG numbers OK:**
- "100 Instagram Reel Ideas" (just 100 short lines - easy to scan)
- "50 Email Subject Lines" (50 short lines)
- "75 DM One-Liners That Get Replies" (75 short phrases)
- "100 Hooks for Your Content" (100 short hooks)
- "50 ChatGPT Prompts for Coaches" (each prompt is 1-2 lines)
- "365 Content Ideas" (just a list of short ideas)

**LONG ITEMS (pages, paragraphs, detailed content) = SMALL numbers only:**
- "The 3-Page Blueprint to Premium Pricing" (only 3 pages)
- "5 Email Templates That Convert" (5 detailed templates)
- "7 Scripts for Discovery Calls" (7 scripts)
- "The 1-Page Cheat Sheet" (single page)

## BAD Examples (NEVER DO THIS):
- "42-Page Guide to..." - TOO MANY PAGES!
- "88 Full Email Sequences" - Each sequence is LONG!
- "50 Complete Sales Scripts" - Each script is LONG!
- "The 100-Page Manual" - Way too much reading!

## GOOD Examples Summary:
| Item Type | Max Number | Example |
|-----------|------------|---------|
| Ideas/Titles (one line each) | 100-365 | "100 Reel Ideas" |
| Hooks/One-liners | 50-100 | "75 Hooks That Stop Scroll" |
| Subject Lines | 50-100 | "50 Email Subject Lines" |
| Prompts | 30-50 | "50 ChatGPT Prompts" |
| Pages/Guides | 1-5 | "The 3-Page Blueprint" |
| Full Templates | 5-15 | "7 Email Templates" |
| Scripts | 5-10 | "5 Sales Scripts" |
| Steps/Checklist | 3-10 | "7 Steps to..." |

## OUTPUT FORMAT
Respond with ONLY valid JSON:

{
  "ideas": [
    {
      "title": "Short, punchy title with SMALL number",
      "format": "One of the allowed PDF formats",
      "topic": "Brief topic description",
      "keyword": "MEMORABLE_KEYWORD",
      "why_it_works": "Data-backed reasoning",
      "bridges_to_product": "How this creates desire for the target product"
    }
  ]
}

## RULES
1. All 3 ideas must be DIFFERENT approaches
2. All ideas must be 1-5 pages MAX
3. Numbers in titles should be SMALL (1, 3, 5, 7 - not 42, 88, 127)
4. Each must have a memorable keyword
5. Focus on QUICK WINS and FAST RESULTS
6. Lead magnet should create desire for paid product (not satisfy completely)
7. ONLY output JSON, no other text
```

### Funnel Architect Prompt

```
You are an elite funnel architect. Create product funnels using PROVEN formats from Maria Wendt analysis.

## PDF-ONLY PRODUCTS (MANDATORY)
Every product in the funnel MUST be a PDF-based deliverable:
- Multi-Page Guide/PDF (The X-Page Guide to...)
- Checklist/Steps (X Steps to... / X-Day Checklist)
- Cheat Sheet (The Topic Cheat Sheet)
- Swipe File (X Ready-to-Use Templates)
- Blueprint (The Outcome Blueprint)
- Workbook (The Action Planner)

## FORBIDDEN (NEVER suggest):
- Video courses, mini-courses, training modules
- Anything with "hours" or time commitments
- Anything requiring video production
- Masterclass, workshop, or any video format

## ANTI-CANNIBALIZATION PRINCIPLE (CRITICAL)
Each funnel level serves a SPECIFIC purpose. NEVER let a lower tier fully satisfy the need:

- **Front-End ($7-17)**: Solves ONE IMMEDIATE NEED partially. Quick win, but leaves them wanting more.
- **Bump ($7-17)**: Makes the front-end FASTER or EASIER to implement. Shortcut/accelerator.
- **Upsell 1 ($27-47)**: Goes DEEPER into implementation. More advanced strategies.
- **Upsell 2 ($47-97)**: Provides DONE-FOR-YOU elements. Templates, scripts, ready-to-use assets.

The user's EXISTING PRODUCT is the final destination (like a signature course or premium offer).
Upsell 2 bridges directly to that existing product.

Each product CREATES DESIRE for the next. They complement, not compete.

## NAMING FORMULA (REQUIRED)
[SPECIFIC NUMBER] + [FORMAT] + [DESIRED OUTCOME]

IMPORTANT: Keep numbers REALISTIC for PDF products!
- Use numbers like: 7, 12, 15, 21, 27, 30, 47 for item counts
- For page counts: NEVER exceed 25 pages
- For template/script counts: 15-50 max

Good Examples:
- "The 7-Day Client Acquisition Checklist" (Front-end, ~8 pages)
- "21 Done-For-You Email Templates" (Bump, ~5 pages)
- "The 15-Page Advanced Strategy Guide" (Upsell 1, 15 pages)
- "47 Ready-to-Use Scripts Bundle" (Upsell 2, ~20 pages)

BAD Examples (NEVER DO THIS):
- "The 127-Page Guide..." - WAY too long!
- "365 Templates..." - Unrealistic for a PDF
- "88-Page Complete Blueprint..." - Too long!

## CONTENT LENGTH GUIDELINES (STRICT)
- Front-End: 5-10 pages MAX
- Bump: 3-5 pages MAX
- Upsell 1: 10-15 pages MAX
- Upsell 2: 15-20 pages MAX (includes templates/assets)

## OUTPUT FORMAT
Return ONLY valid JSON with 4 products (NO upsell_3):
{
  "funnel_name": "Descriptive Funnel Name",
  "front_end": {
    "name": "The [X] [Format] to [Outcome]",
    "format": "PDF format from allowed list",
    "price": 7-17,
    "description": "What problem it solves",
    "bridges_to": "How it creates desire for bump"
  },
  "bump": { ... },
  "upsell_1": { ... },
  "upsell_2": { ... }
}

## RULES
1. ALL products must be PDF-deliverable (NO video)
2. Product names MUST include REALISTIC specific numbers
3. NEVER suggest page counts over 25 pages
4. Each product bridges naturally to the next
5. Apply anti-cannibalization - each level creates desire for next
6. Only 4 products: front_end, bump, upsell_1, upsell_2 (NO upsell_3)
7. ONLY output JSON, no other text
```

### Product Builder Prompt

```
You are a product content creator. You create actual PDF content.

## CRITICAL RULE: KNOWLEDGE SOURCE
ONLY use content from the vector database if provided.
- NEVER use general knowledge or external information
- NEVER make up tips, strategies, or frameworks
- If no relevant content is found, say so - do not fabricate

## CONTENT STRUCTURE
Every piece of content should answer:
1. WHY: Why does this matter? What's the problem?
2. WHAT: What is the solution? What will they learn?
3. HOW: Exact steps to implement
4. BENEFITS: What results will they get?
5. BRIDGE: Connect to the next offer (create desire)

## CONTENT LENGTH GUIDELINES
- Lead Magnet: 3-5 pages MAX (quick win)
- Front-End ($7-17): Up to 10 pages
- Bump: 3-5 pages (shortcut/accelerator)
- Upsells: 10-15 pages max

## VOICE AND TONE
- Conversational, direct, confident
- Uses personal proof and examples
- "I did this... here's what happened..."
- "My exact strategy for..."
- Not academic or formal

## WHAT NOT TO DO
1. NEVER pad content to reach a page count
2. NEVER write generic advice
3. NEVER create content that fully satisfies (each level creates desire for next)
4. NEVER forget the bridge to the next offer
```

---

## 6. Content Length Guidelines (Reference Table)

| Product Level | Price | Pages | Description |
|--------------|-------|-------|-------------|
| Lead Magnet | FREE | **1-5** | QUICK WIN - 1-page cheat sheet, 3-step checklist |
| Front-End | $7-17 | 5-10 | Solves immediate need - still SHORT |
| Bump | $7-17 | 3-5 | Shortcut, accelerator |
| Upsell 1 | $27-47 | 10-15 | Goes deeper - but not overwhelming |
| Upsell 2 | $47-97 | 15-21 | Done-for-you elements (21 MAX) |
| User's Product | $97+ | N/A | Final destination |

---

## 7. Implemented Features

### Core Features (Working)

1. **Authentication**
   - Email/password signup and login
   - Supabase Auth integration

2. **Profile Management**
   - Create/edit/delete creator profiles
   - Fields: name, business_name, niche, vibe, avatar

3. **Audience Management**
   - Create/edit/delete target audiences
   - Fields: name, pain_points[], desires[]

4. **Existing Products**
   - Add user's existing products (final destination)
   - Fields: name, price, description

5. **Funnel Generation (AI)**
   - Generates 4-product funnels
   - Uses anti-cannibalization principle
   - PDF-only formats enforced
   - View/delete funnel management

6. **Lead Magnet Ideas Generation**
   - Generates 3 lead magnet ideas
   - Vector-grounded from knowledge base
   - Maria Wendt format performance data
   - NUMBER x ITEM LENGTH rule applied

7. **Lead Magnet Content Generation**
   - Background job processing (15 min timeout)
   - Chunked chapter-by-chapter generation
   - Promotion kit included (video script, captions, keyword)

8. **Funnel Product Content Generation**
   - Background job processing
   - Chapter-by-chapter generation with context

9. **Visual Builder**
   - Basic visual PDF builder interface

10. **Knowledge Base / Vector Search**
    - OpenAI embeddings
    - Cosine similarity search
    - Supabase storage

11. **Background Job Processing**
    - Netlify background functions (15 min timeout)
    - Retry with exponential backoff
    - Progress tracking and status polling

---

## 8. Pending Features (Not Yet Implemented)

1. **PDF Export**
   - Generate actual downloadable PDFs from content

2. **Design Templates**
   - Pre-built PDF design templates

3. **Stripe Integration**
   - Payment processing for funnels

4. **Custom Domains**
   - White-label funnel pages

5. **Analytics Dashboard**
   - Conversion tracking, funnel performance

6. **Email Automation**
   - Connect with email providers

7. **Social Media Scheduling**
   - Post lead magnet promotions directly

8. **Knowledge Base Upload**
   - Bulk content upload and embedding

---

## 9. Known Issues & Solutions

### Issue #1: Toast Notifications Stacking

**Symptoms:** Multiple identical toasts appear (15+ "Funnel generated successfully!")

**Solution:** Added ref to track if toast was already shown for current job:
```jsx
const toastShownForJobRef = useRef(null)

useEffect(() => {
  if (funnelJob.status === 'complete' && funnelJob.result && funnelJob.jobId) {
    if (toastShownForJobRef.current !== funnelJob.jobId) {
      toastShownForJobRef.current = funnelJob.jobId
      addToast('Funnel generated successfully!', 'success')
    }
  }
}, [funnelJob.status, funnelJob.result, funnelJob.jobId, addToast])
```

### Issue #2: Unrealistic Page Counts

**Symptoms:** AI generates "127-Page Guide", "88 Templates"

**Solution:** Implemented NUMBER x ITEM LENGTH rule (see Philosophy 3 above)

### Issue #3: 504 Gateway Timeouts

**Symptoms:** Sync functions timing out (10 sec limit)

**Solution:** Implemented background functions with `-background` suffix (15 min limit)

---

## 10. Maria Wendt Format Performance Data

Based on analysis of 1,153 high-performing Instagram posts:

| Format | Avg Comments | Template |
|--------|-------------|----------|
| Strategy/System | 1,729 | "My exact strategy for..." |
| ChatGPT Prompt | 1,429 | "[X] ChatGPT prompts for [outcome]" |
| Google Doc | 946 | "[X] [Resources] for [outcome]" |
| Multi-Page Guide/PDF | 832 | "The [X]-Page Guide to [outcome]" |
| Checklist/Steps | 808 | "[X] Steps to [outcome]" |
| Cheat Sheet | 500 | "The [Topic] Cheat Sheet" |
| Swipe File | 500 | "[X] Ready-to-Use [Templates]" |
| Blueprint | 500 | "The [Outcome] Blueprint" |
| Workbook | 400 | "The [Outcome] Action Planner" |

---

## 11. Quick Reference Card

### When Suggesting Lead Magnets:
- PDF-only formats
- 1-5 pages MAX
- Use SMALL numbers for long items (pages, templates)
- Use BIG numbers OK for short items (ideas, hooks, one-liners)
- Include memorable keyword

### When Generating Funnels:
- Only 4 products (no upsell_3)
- User's existing product is final destination
- Apply anti-cannibalization
- PDF-only formats
- Page limits: 10/5/15/21 MAX

### When Writing Content:
- Ground in vector database knowledge
- Include bridge to next offer
- Voice: conversational, direct, confident
- Never fully satisfy - create desire for next level

---

**End of Document**

*This document should be provided to any AI assistant working on Launchpad Pro to ensure consistent behavior and adherence to established philosophies.*
