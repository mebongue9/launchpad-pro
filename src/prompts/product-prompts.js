// /src/prompts/product-prompts.js
// Maria Wendt format performance data and prompt constants
// Based on analysis of 1,153 high-performing Instagram posts
// RELEVANT FILES: generate-lead-magnet-ideas.js, process-generation-background.js

// Format performance data from Maria Wendt analysis (by average comments)
export const FORMAT_PERFORMANCE = {
  'Strategy/System': {
    avgComments: 1729,
    template: 'My exact strategy for...',
    description: 'Promise the behind-the-scenes system'
  },
  'ChatGPT Prompt': {
    avgComments: 1429,
    template: '[X] ChatGPT prompts for [outcome]',
    description: 'Specific prompts for specific outcomes'
  },
  'Google Doc': {
    avgComments: 946,
    template: '[X] [Resources] for [outcome]',
    description: 'Collections, lists, curated resources'
  },
  'Multi-Page Guide/PDF': {
    avgComments: 832,
    template: 'The [X]-Page Guide to [outcome]',
    description: 'Always mention page count for perceived value'
  },
  'Checklist/Steps': {
    avgComments: 808,
    template: '[X] Steps to [outcome]',
    description: 'Step-by-step clarity'
  },
  'Cheat Sheet': {
    avgComments: 500,
    template: 'The [Topic] Cheat Sheet',
    description: 'Quick reference one-pager'
  },
  'Swipe File': {
    avgComments: 500,
    template: '[X] Ready-to-Use [Templates/Scripts/Examples]',
    description: 'Copy-paste templates'
  },
  'Blueprint': {
    avgComments: 500,
    template: 'The [Outcome] Blueprint',
    description: 'Complete system overview'
  },
  'Workbook': {
    avgComments: 400,
    template: 'The [Outcome] Action Planner',
    description: 'Fill-in-the-blank exercises'
  },
};

// PDF-Only formats (MANDATORY - no video courses)
export const PDF_ONLY_FORMATS = [
  'Strategy/System',
  'Multi-Page Guide/PDF',
  'Checklist/Steps',
  'Google Doc',
  'Cheat Sheet',
  'Swipe File',
  'Blueprint',
  'Workbook',
];

// Forbidden formats (never suggest)
export const FORBIDDEN_FORMATS = [
  'Video Course',
  'Mini-Course',
  'Video Training',
  'Tutorial Series',
  'Module',
  'Masterclass',
];

// Specificity Formula
export const SPECIFICITY_FORMULA = '[SPECIFIC NUMBER] + [FORMAT] + [DESIRED OUTCOME] + [TIME/EFFORT QUALIFIER]';

// Specificity formula examples
export const SPECIFICITY_EXAMPLES = [
  '365 Instagram Reel Ideas to Go Viral',
  'The 88-Page Guide to Automated Income',
  '6 Things to Do Daily to Reach Your First $500',
  'My Exact Strategy for 40 Reels in 2 Hours',
  '121 Ways to Make Money with ChatGPT',
  '150 Instagram Reel Hooks Proven to Attract Buyers',
  'The 7-Day Launch Blueprint',
];

// Anti-Cannibalization Principle (Only 2 upsells - user's product is final destination)
export const ANTI_CANNIBALIZATION = `
ANTI-CANNIBALIZATION PRINCIPLE (CRITICAL)
- Lead magnet: Creates AWARENESS of a problem
- Front-end ($7-17): Solves IMMEDIATE NEED (but not completely)
- Bump ($7-17): Makes front-end FASTER or EASIER
- Upsell 1 ($27-47): Goes DEEPER into implementation
- Upsell 2 ($47-97): Provides DONE-FOR-YOU elements
- User's Existing Product: The FINAL destination (signature course, premium offer)

Each level creates desire for the next. NEVER let a lower tier fully satisfy the need.
NO upsell_3 - the user's existing product fills that role.
`;

// CORE PHILOSOPHY: SMALL = FAST RESULTS
// People don't want to read 40+ pages. They want QUICK WINS.
// - A 1-page guide is MORE appealing than a 50-page guide
// - Short = Easy to consume = Higher completion rate = More desire for paid product
// - Numbers like 1, 3, 5, 7 are BETTER than 42, 88, 127

// Content Length Guidelines (STRICT - SMALL = FAST RESULTS)
export const CONTENT_LENGTH = {
  lead_magnet: { pages: '1-5', description: 'QUICK WIN - 1-page cheat sheet, 3-step checklist' },
  front_end: { pages: '5-10', description: 'Solves immediate need - still SHORT' },
  bump: { pages: '3-5', description: 'Shortcut, template, accelerator' },
  upsell_1: { pages: '10-15', description: 'Goes deeper - but not overwhelming' },
  upsell_2: { pages: '15-21', description: 'Done-for-you elements (21 pages MAX)' },
  // NO upsell_3 - user's existing product is final destination
};

// NUMBER × ITEM LENGTH RULE
// The number depends on what TYPE of item it is:
//
// SHORT ITEMS (one-liners) = BIG numbers OK:
// - Ideas, titles, hooks, subject lines, prompts
// - 50-365 is fine for these
//
// LONG ITEMS (detailed content) = SMALL numbers only:
// - Pages, guides, templates, scripts, sequences
// - Keep to 1-15 max

export const NUMBER_LIMITS_BY_TYPE = {
  // Short items (one line each) - big numbers OK
  ideas: { min: 50, max: 365, example: '100 Reel Ideas' },
  titles: { min: 50, max: 365, example: '100 Content Titles' },
  hooks: { min: 30, max: 100, example: '75 Hooks That Stop Scroll' },
  subject_lines: { min: 30, max: 100, example: '50 Email Subject Lines' },
  one_liners: { min: 30, max: 100, example: '50 DM One-Liners' },
  prompts: { min: 20, max: 50, example: '50 ChatGPT Prompts' },

  // Long items (detailed content) - small numbers only
  pages: { min: 1, max: 5, example: 'The 3-Page Blueprint' },
  guides: { min: 1, max: 5, example: '3-Page Quick-Start Guide' },
  templates: { min: 3, max: 15, example: '7 Email Templates' },
  scripts: { min: 3, max: 10, example: '5 Sales Scripts' },
  sequences: { min: 3, max: 7, example: '5 Email Sequences' },
  steps: { min: 3, max: 10, example: '7 Steps to...' },
};

// Pricing Guidelines (Only 2 upsells)
export const PRICING_GUIDELINES = {
  lead_magnet: { price: 'FREE', purpose: 'Creates awareness' },
  front_end: { price: '$7-17', purpose: 'Solves immediate need' },
  bump: { price: '$7-17', purpose: 'Makes front-end faster/easier' },
  upsell_1: { price: '$27-47', purpose: 'Goes deeper' },
  upsell_2: { price: '$47-97', purpose: 'Done-for-you (bridges to user product)' },
  // NO upsell_3 - user's existing product is final destination
};

// Lead Magnet Strategist System Prompt
export const LEAD_MAGNET_STRATEGIST_PROMPT = `
You are an elite lead magnet strategist. Your recommendations are based on PROVEN data from 1,153 high-performing Instagram posts (Maria Wendt analysis).

## FORMAT PERFORMANCE (by average comments)
1. Strategy/System: 1,729 avg - "my exact strategy for..."
2. ChatGPT Prompt: 1,429 avg - specific prompts for outcomes
3. Google Doc: 946 avg - collections, lists, resources
4. Multi-Page Guide/PDF: 832 avg - always mention page count
5. Checklist/Steps: 808 avg - X steps to achieve Y

## PDF-ONLY FORMATS (MANDATORY)
You MUST only suggest these formats:
- Multi-Page Guide/PDF
- Checklist
- Cheat Sheet
- Swipe File
- Blueprint
- Google Doc
- Strategy/System
- Workbook

## FORBIDDEN (NEVER suggest):
- Video courses, mini-courses, training modules
- Anything with "hours" or time commitments
- Anything requiring video production

## SPECIFICITY FORMULA (REQUIRED)
[SPECIFIC NUMBER] + [FORMAT] + [DESIRED OUTCOME] + [TIME/EFFORT QUALIFIER]

Examples:
- "365 Instagram Reel Ideas to Go Viral"
- "The 88-Page Guide to Automated Income"
- "6 Things to Do Daily to Reach Your First $500"

## OUTPUT FORMAT
Return ONLY valid JSON with this structure:
{
  "ideas": [
    {
      "title": "The [X] [Format] to [Outcome]",
      "format": "One of the allowed PDF formats",
      "topic": "Brief topic description",
      "keyword": "MEMORABLE_KEYWORD",
      "why_it_works": "Data-backed reasoning",
      "bridges_to_product": "How this leads to the target product"
    }
  ]
}

## RULES
1. All 3 ideas must be DIFFERENT approaches
2. All ideas must be PDF-deliverable
3. Names MUST include specific numbers
4. Each must have a memorable keyword (numbers outperform words)
5. ONLY suggest topics from AVAILABLE KNOWLEDGE if provided
`;

// Funnel Architect System Prompt
export const FUNNEL_ARCHITECT_PROMPT = `
You are an elite funnel architect. Create product funnels using PROVEN formats.

## PDF-ONLY PRODUCTS (MANDATORY)
Every product in the funnel must be a PDF-based deliverable:
- Guide, Blueprint, Checklist, Cheat Sheet, Swipe File, Workbook

${ANTI_CANNIBALIZATION}

## NAMING FORMULA
[SPECIFIC NUMBER] + [FORMAT] + [DESIRED OUTCOME]

Examples:
- "The 7-Day Client Acquisition Checklist" (Front-end)
- "47 Done-For-You Email Templates" (Upsell 1)
- "88 High-Converting Scripts Bundle" (Upsell 2)

## PRICING GUIDELINES
- Lead Magnet: FREE
- Front-End: $7-17
- Bump: $7-17
- Upsell 1: $27-47
- Upsell 2: $47-97
- Upsell 3: $97-197

## OUTPUT FORMAT
Return ONLY valid JSON with funnel structure.
`;

// Product Builder System Prompt (for content generation)
export const PRODUCT_BUILDER_PROMPT = `
You are a product content creator. You create actual PDF content.

## CRITICAL RULE: KNOWLEDGE SOURCE
ONLY use content from the vector database if provided.
- NEVER use general knowledge or external information
- NEVER make up tips, strategies, or frameworks
- If no relevant content is found, say so—do not fabricate

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
`;
