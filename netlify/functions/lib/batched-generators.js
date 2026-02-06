// netlify/functions/lib/batched-generators.js
// All 14 batched generation functions for funnel content
// Each function generates multiple pieces of content in a single Claude API call
// CROSS-PROMO: Embedded in last chapter of each product (not separate bridge/cta)
//   - Lead Magnet → promotes Front-End
//   - Front-End, Bump, Upsell 1, Upsell 2 → promote Main Product (from existing_product_id)
//   - Uses main_product.mention_price flag (defaults to false if not set)
// RELEVANT FILES: netlify/functions/lib/task-orchestrator.js, netlify/functions/lib/retry-engine.js

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { parseClaudeJSON } from '../utils/sanitize-json.js';
import { searchKnowledgeWithMetrics, logRagRetrieval } from './knowledge-search.js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const LOG_TAG = '[BATCHED-GENERATORS]';
const SECTION_SEPARATOR = '===SECTION_BREAK===';

// MARKETPLACE LISTING FRAMEWORK - Creates Etsy/Gumroad-ready descriptions
// Uses Manifestable-proven Etsy SEO patterns for maximum conversions
// MUST use Unicode bold characters for Etsy/Gumroad compatibility (no markdown)
const MARKETPLACE_SYSTEM = `You are an expert Etsy and Gumroad marketplace copywriter specializing in digital products.

## TITLE FORMAT (MAX 140 characters)
[Keyword 1] | [Keyword 2] | [Keyword 3] | [Keyword 4] | [Keyword 5] | [Keyword 6]

Fill ALL 140 characters with searchable keyword phrases separated by |

KEYWORD STRATEGY:
1. Lead with the product's core topic as a searchable phrase
2. Add synonyms and variations (different ways people search for this topic)
3. Add format-adjacent search terms (Guide, Planner, Template, Tracker, Workbook)
4. Add audience/niche keywords (Small Business, Entrepreneur, Coach, Creator)
5. Fill remaining characters with related search terms

RULES:
- NEVER use "Digital Download" in the title
- NEVER use generic standalone labels like "Checklist", "Swipe File", "Cheat Sheet"
- Every phrase must be something a buyer would type into Etsy search
- Use | as separator between keyword phrases
- Each keyword phrase should be 2-4 words
- Maximize unique searchable terms for discoverability

EXAMPLES:
Product: "The Complete FB Group Lead Machine" (Checklist)
Title: "Facebook Group Marketing | Lead Generation Guide | FB Group Growth | Social Media Strategy | Online Business | Community Building Tips"

Product: "The 3-Minute Content Creation Swipe File" (Swipe File)
Title: "Content Creation Templates | Social Media Captions | Instagram Post Ideas | Content Strategy | Marketing Templates | Engagement Hooks"

## TAGS (EXACTLY 13 tags, each MAX 20 characters)

MANDATORY STRUCTURE:
1. "digital download" (REQUIRED - always include this exact tag)
2. "instant pdf" OR "pdf template" OR "printable" (REQUIRED - pick one)
3-5. Three FORMAT tags based on product type (checklist, worksheet, template, guide, planner, etc.)
6-8. Three NICHE tags based on product topic (online business, marketing, social media, etc.)
9-11. Three BENEFIT tags based on product outcome (lead generation, passive income, etc.)
12-13. Two AUDIENCE tags based on target customer (coach, consultant, entrepreneur, etc.)

EXAMPLE for a Marketing Checklist:
["digital download", "instant pdf", "marketing checklist", "business checklist", "checklist template", "online business", "entrepreneur", "small business", "lead generation", "sales funnel", "marketing tips", "coach", "consultant"]

CRITICAL:
- Tag #1 MUST be "digital download" (exactly 16 characters)
- Tag #2 MUST be a platform tag (instant pdf, pdf template, or printable)
- All 13 slots MUST be filled
- Each tag MUST be 20 characters or less
- No duplicate tags

## INDIVIDUAL PRODUCT DESCRIPTION - MANIFESTABLE FRAMEWORK:

CRITICAL FORMATTING: Each ✓ bullet MUST be on its own line. Use actual newline characters between bullets and sections. Never put multiple bullets on the same line.

[SECTION 1: EMOTIONAL HOOK - 2 paragraphs]
Open with a question about their pain point.
Acknowledge their struggle with empathy ("It's not your fault").
Position the product as the solution designed specifically for them.

[SECTION 2: WHY YOU'LL LOVE THIS - 5 bullets with checkmarks]
𝗪𝗵𝘆 𝗬𝗼𝘂'𝗹𝗹 𝗟𝗼𝘃𝗲 𝗧𝗵𝗶𝘀 [Product Name]:
✓ Benefit 1
✓ Benefit 2
✓ Benefit 3
✓ Benefit 4
✓ Benefit 5

[SECTION 3: WHAT'S INSIDE - 6-8 bullets with checkmarks]
𝗪𝗵𝗮𝘁'𝘀 𝗜𝗻𝘀𝗶𝗱𝗲:
✓ Feature 1
✓ Feature 2
✓ Feature 3
✓ Feature 4
✓ Feature 5
✓ Feature 6
✓ Instant digital download

[SECTION 4: WHO THIS IS FOR - 1 paragraph]
𝗣𝗲𝗿𝗳𝗲𝗰𝘁 𝗳𝗼𝗿 [audience description with specific situations].

[SECTION 5: WHAT YOU'LL RECEIVE]
𝗪𝗛𝗔𝗧 𝗬𝗢𝗨'𝗟𝗟 𝗥𝗘𝗖𝗘𝗜𝗩𝗘:
✓ 1 PDF [Product Name]

[SECTION 6: LEGAL/TERMS]
𝗣𝗟𝗘𝗔𝗦𝗘 𝗡𝗢𝗧𝗘: This is a digital product. No physical items will be shipped.
𝗧𝗘𝗥𝗠𝗦 𝗢𝗙 𝗦𝗘𝗥𝗩𝗜𝗖𝗘: Due to the digital nature of this product, all sales are final.
This product is for PERSONAL USE ONLY.
Copyright 2026. All rights reserved.

## UNICODE BOLD CHARACTERS (CRITICAL):
You MUST use Unicode bold for section headers. This is how bold displays on Etsy/Gumroad.

Unicode bold alphabet to use:
- Bold letters: 𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭 𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇
- Bold numbers: 𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵

DO NOT use markdown ** symbols - they show as raw text on marketplaces.

## SECTION DIVIDERS:
Use this line between major sections: ━━━━━━━━━━

## marketplace_bullets field:
Short deliverable names for the "What's Included" display card.
Format: "[Count/Type] [deliverable]" (no benefits, just scannable items)
Examples: ["3 Reel Formats", "Filming Tutorials", "Case Studies", "Implementation Guide"]`;

// Helper: Safely parse sections from Claude response with validation
function safeParseSections(responseText, expectedCount, taskName) {
  if (!responseText) {
    throw new Error(`${taskName}: Empty response from Claude API`);
  }

  const sections = responseText.split(SECTION_SEPARATOR).map(s => s.trim()).filter(s => s.length > 0);

  console.log(`${LOG_TAG} ${taskName}: Got ${sections.length} sections (expected ${expectedCount})`);

  if (sections.length < expectedCount) {
    console.error(`${LOG_TAG} ${taskName}: Response doesn't contain expected ${expectedCount} sections`);
    console.error(`${LOG_TAG} Response preview: ${responseText.substring(0, 500)}...`);
    throw new Error(`${taskName}: Response contains ${sections.length} sections instead of ${expectedCount}. Claude may not have followed the format.`);
  }

  return sections;
}

// Helper: Ensure proper formatting for marketplace descriptions
// 1. Fixes bullets on same line: "• item1 • item2" -> "• item1\n• item2"
// 2. Adds double newline after section headers so UI renders bullets correctly
//    The UI splits by \n\n and only renders bullets if section STARTS with •
function fixBulletNewlines(text) {
  if (!text) return text;
  let fixed = text;
  // Replace " • " (space-bullet-space) with newline-bullet
  fixed = fixed.replace(/ • /g, '\n• ').replace(/ - /g, '\n- ');
  // Add double newline after section headers followed by bullets
  // Pattern: "HEADER:\n•" -> "HEADER:\n\n•"
  fixed = fixed.replace(/:\n•/g, ':\n\n•');
  fixed = fixed.replace(/:\n-/g, ':\n\n-');
  return fixed;
}

// Helper: Convert text to Unicode bold
function toUnicodeBold(text) {
  if (!text) return '';
  const boldMap = {
    'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜',
    'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥',
    'S': '𝗦', 'T': '𝗧', 'U': '𝗨', 'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭',
    'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶',
    'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿',
    's': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
    '0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰', '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵'
  };
  return text.split('').map(c => boldMap[c] || c).join('');
}

// THE 6 APPROVED FORMATS - Data-proven from Maria Wendt's research
// These are the ONLY formats allowed. No others.
const APPROVED_FORMATS = ['Checklist', 'Worksheet', 'Planner', 'Swipe File', 'Blueprint', 'Cheat Sheet'];

// FORMAT INSTRUCTIONS - Structure content based on lead magnet/product format
const FORMAT_INSTRUCTIONS = {
  'Checklist': `
    Structure content as numbered action items with checkbox markers (☐ or □).
    Each item should be a specific, actionable step the reader can check off.
    Format: "☐ [Action item]" followed by 1-2 sentences explaining why/how.
    Aim for 10-15 actionable items per chapter.
    Do NOT write long paragraphs - this is a checklist, not an essay.
  `,

  'Worksheet': `
    Structure content as fill-in-the-blank exercises and reflection questions.
    Include prompts like "My goal is: _____________" or "List 3 things you want to achieve: 1. _____ 2. _____ 3. _____"
    Add space indicators for user answers: [Your answer here]
    Include reflection questions: "What would success look like for you?"
    Mix teaching moments with interactive exercises.
  `,

  'Planner': `
    Organize content by time periods.
    Format options: "DAY 1:", "DAY 2:"... OR "WEEK 1:", "WEEK 2:"...
    Each time period has specific tasks/focus areas.
    Include checkboxes for daily/weekly tasks.
    Add "Goal for this [day/week]:" sections.
    Think calendar/schedule format.
  `,

  'Swipe File': `
    Provide ready-to-use templates the reader can copy and paste immediately.
    Structure as: "TEMPLATE #1: [Name]" followed by the actual template text.
    Include fill-in-the-blank spots marked with [brackets] for personalization.
    Add brief context before each template (1-2 sentences max).
    Examples: email templates, DM scripts, post captions, sales copy.
  `,

  'Blueprint': `
    Present as a step-by-step process with clear phases.
    Format: "PHASE 1: [Name]" → "STEP 1.1:" → "STEP 1.2:" etc.
    Use visual sequence indicators (arrows, numbers, phases).
    Include "What you need" and "Expected outcome" for each phase.
    Think flowchart in text form.
  `,

  'Cheat Sheet': `
    Use dense, quick-reference formatting.
    Heavy use of bullet points, numbered lists, and short phrases.
    Include comparison tables where relevant.
    No lengthy explanations - just the facts and actionable info.
    Think "reference card" not "chapter book".
    Organize by category with clear headers.
  `
};

// Helper: Get format instructions based on format name
// STRICT ENFORCEMENT: Only the 6 approved formats are allowed
// Unknown formats default to Cheat Sheet (most flexible format)
function getFormatInstructions(format) {
  const normalizedFormat = format?.trim() || '';

  // Direct match
  if (FORMAT_INSTRUCTIONS[normalizedFormat]) {
    return FORMAT_INSTRUCTIONS[normalizedFormat];
  }

  // Check for partial matches (e.g., "Swipe File (5 Ready-to-Use Templates)" → "Swipe File")
  for (const approvedFormat of APPROVED_FORMATS) {
    if (normalizedFormat.toLowerCase().includes(approvedFormat.toLowerCase())) {
      return FORMAT_INSTRUCTIONS[approvedFormat];
    }
  }

  // NO FALLBACK to generic instructions - default to Cheat Sheet (most flexible approved format)
  // This ensures we ALWAYS use approved format instructions
  console.warn(`[FORMAT WARNING] Unknown format "${normalizedFormat}" - defaulting to Cheat Sheet`);
  return FORMAT_INSTRUCTIONS['Cheat Sheet'];
}

// RAG FIX: Removed local searchKnowledge function (had broken 0.6 threshold)
// Now using shared searchKnowledgeWithMetrics from ./knowledge-search.js
// This enables: pgvector server-side search, threshold 0.3, RAG logging
// Aligns with vision: "Everything Comes From The Vector Database"

// Helper: Log RAG retrieval metrics after content generation
async function logRagForBatchedGen(funnelId, funnel, taskName, ragMetrics) {
  if (!ragMetrics) return;
  
  try {
    await logRagRetrieval({
      userId: funnel?.user_id || null,
      profileId: funnel?.profile?.id || null,
      audienceId: funnel?.audience?.id || null,
      funnelId: funnelId,
      leadMagnetId: funnel?.lead_magnet?.id || null,
      sourceFunction: 'batched-generators',
      generationType: taskName,
      metrics: ragMetrics,
      freshnessCheck: { performed: false, count: 0, names: [] },
      generationSuccessful: true,
      errorMessage: null
    });
  } catch (err) {
    console.error(`${LOG_TAG} Failed to log RAG metrics:`, err.message);
  }
}

// Helper: Get language-specific prompt suffix
// LANGUAGE FIX: Ensures all 14 generation tasks output content in the selected language
function getLanguagePromptSuffix(language) {
  if (!language || language === 'English') {
    return '';
  }
  return `

OUTPUT LANGUAGE: ${language}
All content must be written entirely in ${language}.
Do not include any English unless the user's language is English.`;
}

// Helper: Get funnel data (including Main Product for cross-promo)
// SCHEMA-VERIFIED: front_end, bump, upsell_1, upsell_2 are JSONB columns, NOT FK relationships
async function getFunnelData(funnelId) {
  // 1. Get funnel with valid FK joins only (profile, audience, main_product)
  const { data: funnel, error } = await supabase
    .from('funnels')
    .select(`
      *,
      main_product:existing_products!funnels_existing_product_id_fkey(*),
      profile:profiles(*),
      audience:audiences(*)
    `)
    .eq('id', funnelId)
    .single();

  if (error) {
    throw new Error(`Failed to load funnel: ${error.message}`);
  }

  // 2. Get lead_magnet separately (FK is reversed: lead_magnets.funnel_id → funnels)
  const { data: lead_magnet } = await supabase
    .from('lead_magnets')
    .select('*')
    .eq('funnel_id', funnelId)
    .maybeSingle();

  // 3. Return with consistent naming
  // front_end, bump, upsell_1, upsell_2 are JSONB columns in funnels table
  return {
    ...funnel,
    lead_magnet: lead_magnet,
    frontend: funnel.front_end,      // JSONB data, not a table row
    bump: funnel.bump,               // JSONB data
    upsell1: funnel.upsell_1,        // JSONB data
    upsell2: funnel.upsell_2         // JSONB data
  };
}

// Helper: Build cross-promo paragraph to embed in content
// For Lead Magnet: promotes Front-End
// For paid products (Front-End, Bump, Upsell 1, Upsell 2): promotes Main Product
function buildCrossPromoParagraph(promotedProduct, mentionPrice = false) {
  if (!promotedProduct) return '';

  const name = promotedProduct.name || 'our premium product';
  const tldr = promotedProduct.tldr || promotedProduct.description || '';
  const url = promotedProduct.url || '';
  const price = promotedProduct.price;

  let promo = `\n\n---\n\n**Want to take this further?**\n\n`;
  promo += `If you found this valuable, you'll love "${name}". `;

  if (tldr) {
    promo += `${tldr} `;
  }

  if (mentionPrice && price) {
    promo += `Get it now for just $${price}. `;
  }

  if (url) {
    promo += `\n\n[Learn more about ${name}](${url})`;
  }

  return promo;
}

// ============================================================================
// PRODUCT CONTENT GENERATORS (Tasks 1-9)
// ============================================================================

// Task 1: Lead Magnet Part 1 (Cover + Chapters 1-3)
export async function generateLeadMagnetPart1(funnelId) {
  console.log(`📝 ${LOG_TAG} Generating lead magnet part 1 (cover + chapters 1-3)`);

  const funnel = await getFunnelData(funnelId);
  const { lead_magnet, profile, audience, frontend } = funnel;

  // Search knowledge base
  // SCHEMA-FIX: lead_magnets uses 'name' and 'topic', not 'title' and 'subtitle'
  const knowledgeQuery = `${lead_magnet?.name || 'lead magnet'} ${lead_magnet?.topic || ''} content for chapters`;
  const { context: knowledge, metrics: ragMetrics } = await searchKnowledgeWithMetrics(knowledgeQuery, {
    limit: 40,
    threshold: 0.3,
    sourceFunction: 'batched-generators-lm-part1'
  });

  // Get format instructions for content structure
  const formatInstructions = getFormatInstructions(lead_magnet?.format);

  // Batched prompt for cover + 3 chapters
  const prompt = `${knowledge}

Generate the COVER PAGE and FIRST 3 CHAPTERS for this lead magnet.

LEAD MAGNET INFO:
- Title: ${lead_magnet?.name || 'Untitled Lead Magnet'}
- Topic: ${lead_magnet?.topic || 'General'}
- Format: ${lead_magnet?.format || 'General'}
- Author: ${profile?.name || 'Unknown Author'}
- Target Audience: ${audience?.name || 'General Audience'}
- Bridge Product: ${frontend?.name || 'Next Product'}

FORMAT INSTRUCTIONS (CRITICAL - FOLLOW EXACTLY):
${formatInstructions}

The content structure MUST match the format above. If the format is "Checklist", output checkbox items, NOT paragraphs. If the format is "Swipe File", output ready-to-use templates, NOT essays.

INSTRUCTIONS:
Generate 4 sections separated by exactly: ${SECTION_SEPARATOR}

Section 1 - COVER PAGE (JSON):
{
  "type": "cover",
  "title": "${lead_magnet?.name || 'Untitled'}",
  "subtitle": "${lead_magnet?.topic || ''}",
  "author": "By ${profile?.name || 'Author'}",
  "tagline": "Short tagline (5-8 words)"
}

${SECTION_SEPARATOR}

Section 2 - CHAPTER 1 (JSON):
{
  "type": "chapter",
  "number": 1,
  "title": "Chapter 1: [Compelling Title]",
  "content": "[Full chapter content following the FORMAT INSTRUCTIONS above - 400-600 words]"
}

${SECTION_SEPARATOR}

Section 3 - CHAPTER 2 (JSON):
{
  "type": "chapter",
  "number": 2,
  "title": "Chapter 2: [Compelling Title]",
  "content": "[Full chapter content following the FORMAT INSTRUCTIONS above - 400-600 words]"
}

${SECTION_SEPARATOR}

Section 4 - CHAPTER 3 (JSON):
{
  "type": "chapter",
  "number": 3,
  "title": "Chapter 3: [Compelling Title]",
  "content": "[Full chapter content following the FORMAT INSTRUCTIONS above - 400-600 words]"
}

IMPORTANT: Use ONLY the creator's knowledge above. Return valid JSON for each section. CRITICAL: The content MUST follow the FORMAT INSTRUCTIONS - structure content according to the specified format type.${getLanguagePromptSuffix(funnel.language)}`;

  console.log(`🔄 ${LOG_TAG} Calling Claude API for batched generation...`);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    system: `You are a lead magnet content writer. Use the creator's knowledge to create valuable, specific content. Return valid JSON for each section separated by the exact separator.${getLanguagePromptSuffix(funnel.language)}`,
    messages: [{ role: 'user', content: prompt }]
  });

  // Parse response into sections
  const fullResponse = response.content[0].text;
  const sections = fullResponse.split(SECTION_SEPARATOR).map(s => s.trim());

  console.log(`✅ ${LOG_TAG} Got ${sections.length} sections from API`);

  // Parse each JSON section
  const cover = parseClaudeJSON(sections[0]);
  const chapter1 = parseClaudeJSON(sections[1]);
  const chapter2 = parseClaudeJSON(sections[2]);
  const chapter3 = parseClaudeJSON(sections[3]);

  // Save Part 1 to content column as JSON (Part 2 will read this)
  // SCHEMA-VERIFIED: lead_magnets has 'content' column, not 'cover_data' or 'chapters'
  const part1Content = JSON.stringify({
    cover: cover,
    chapters: [chapter1, chapter2, chapter3],
    part: 1,
    generated_at: new Date().toISOString()
  });

  // FIX: Update by lead_magnet.id instead of funnel_id (funnel_id might be NULL)
  if (!lead_magnet?.id) {
    throw new Error('No lead magnet found for this funnel - cannot save content');
  }

  await supabase
    .from('lead_magnets')
    .update({
      content: part1Content,
      updated_at: new Date().toISOString()
    })
    .eq('id', lead_magnet.id);

  console.log(`✅ ${LOG_TAG} Lead magnet part 1 saved to content column (id: ${lead_magnet.id})`);

  // Log RAG metrics
  await logRagForBatchedGen(funnelId, funnel, 'lead-magnet-part1', ragMetrics);

  return { cover, chapter1, chapter2, chapter3 };
}

// Task 2: Lead Magnet Part 2 (Chapters 4-5 with embedded cross-promo promoting Front-End)
export async function generateLeadMagnetPart2(funnelId) {
  console.log(`📝 ${LOG_TAG} Generating lead magnet part 2 (chapters 4-5 with embedded cross-promo)`);

  const funnel = await getFunnelData(funnelId);
  const { lead_magnet, profile, audience, frontend } = funnel;

  // Read Part 1 results from content column
  // SCHEMA-VERIFIED: lead_magnets has 'content' column, not 'chapters'
  const { data: existingData } = await supabase
    .from('lead_magnets')
    .select('content')
    .eq('funnel_id', funnelId)
    .single();

  const part1Data = existingData?.content ? JSON.parse(existingData.content) : {};
  const previousChapters = part1Data.chapters || [];
  const existingCover = part1Data.cover || {};

  // SCHEMA-FIX: lead_magnets uses 'name' not 'title'
  const { context: knowledge, metrics: ragMetrics } = await searchKnowledgeWithMetrics(`${lead_magnet?.name || 'lead magnet'} final chapters`, {
    limit: 40,
    threshold: 0.3,
    sourceFunction: 'batched-generators'
  });

  // Build cross-promo paragraph for Front-End product
  // Lead Magnet always promotes Front-End (not Main Product)
  // front_end_link is a top-level column, not inside the JSONB
  const frontendWithUrl = { ...frontend, url: funnel.front_end_link };
  const crossPromo = buildCrossPromoParagraph(frontendWithUrl, false);

  // Get format instructions for content structure
  const formatInstructions = getFormatInstructions(lead_magnet?.format);

  const prompt = `${knowledge}

Generate the FINAL 2 CHAPTERS for this lead magnet.

LEAD MAGNET INFO:
- Title: ${lead_magnet?.name || 'Lead Magnet'}
- Topic: ${lead_magnet?.topic || 'General'}
- Format: ${lead_magnet?.format || 'General'}
- Front-End Product: ${frontend?.name || 'Next Product'} ($${frontend?.price || '0'})

FORMAT INSTRUCTIONS (CRITICAL - FOLLOW EXACTLY):
${formatInstructions}

The content structure MUST match the format above. If the format is "Checklist", output checkbox items, NOT paragraphs. If the format is "Swipe File", output ready-to-use templates, NOT essays.

PREVIOUS CHAPTERS:
${previousChapters.map(c => `- ${c?.title || 'Chapter'}`).join('\n')}

IMPORTANT: Chapter 5 (the final chapter) MUST end with a natural cross-promotion paragraph that promotes "${frontend?.name || 'the next product'}".
The cross-promo should feel like a natural conclusion, not a hard sell. Something like:
"If you enjoyed this and want to take it further, check out [product name] which [brief benefit]..."

Generate 2 sections separated by: ${SECTION_SEPARATOR}

Section 1 - CHAPTER 4 (JSON):
{
  "type": "chapter",
  "number": 4,
  "title": "Chapter 4: [Title]",
  "content": "[400-600 words following the FORMAT INSTRUCTIONS above]"
}

${SECTION_SEPARATOR}

Section 2 - CHAPTER 5 (JSON):
{
  "type": "chapter",
  "number": 5,
  "title": "Chapter 5: [Title]",
  "content": "[400-600 words following FORMAT INSTRUCTIONS - wrap up content AND include a natural cross-promo paragraph at the end promoting ${frontend.name}]"
}

Use creator's knowledge. Return valid JSON. CRITICAL: The content MUST follow the FORMAT INSTRUCTIONS - structure content according to the specified format type.${getLanguagePromptSuffix(funnel.language)}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 12000,
    messages: [{ role: 'user', content: prompt }]
  });

  const sections = response.content[0].text.split(SECTION_SEPARATOR).map(s => s.trim());

  const chapter4 = parseClaudeJSON(sections[0]);
  const chapter5 = parseClaudeJSON(sections[1]);

  // Ensure cross-promo is embedded in chapter 5 content if AI didn't include it
  if (chapter5.content && !chapter5.content.toLowerCase().includes(frontend.name.toLowerCase())) {
    chapter5.content += crossPromo;
  }

  // Combine Part 1 + Part 2 and save complete content
  // SCHEMA-VERIFIED: save to 'content' column, not 'chapters'
  const fullContent = JSON.stringify({
    cover: existingCover,
    chapters: [...previousChapters, chapter4, chapter5],
    part: 2,
    complete: true,
    generated_at: new Date().toISOString()
  });

  // FIX: Update by lead_magnet.id instead of funnel_id (funnel_id might be NULL)
  if (!lead_magnet?.id) {
    throw new Error('No lead magnet found for this funnel - cannot save content');
  }

  await supabase
    .from('lead_magnets')
    .update({
      content: fullContent,
      updated_at: new Date().toISOString()
    })
    .eq('id', lead_magnet.id);

  console.log(`✅ ${LOG_TAG} Lead magnet part 2 saved to content column (id: ${lead_magnet.id}, complete with 5 chapters)`);

  // Log RAG metrics
  await logRagForBatchedGen(funnelId, funnel, 'lead-magnet-part2', ragMetrics);

  return { chapter4, chapter5 };
}

// Task 3: Front-End Part 1 (Cover + Chapters 1-3)
export async function generateFrontendPart1(funnelId) {
  console.log(`📝 ${LOG_TAG} Generating front-end part 1 (cover + chapters 1-3)`);

  const funnel = await getFunnelData(funnelId);
  const { frontend, profile, audience, bump } = funnel;

  const { context: knowledge, metrics: ragMetrics } = await searchKnowledgeWithMetrics(`${frontend.name} ${frontend.description} content chapters`, {
    limit: 40,
    threshold: 0.3,
    sourceFunction: 'batched-generators'
  });

  // Get format instructions for content structure
  const formatInstructions = getFormatInstructions(frontend?.format);

  const prompt = `${knowledge}

Generate COVER PAGE and FIRST 3 CHAPTERS for this front-end product.

PRODUCT INFO:
- Name: ${frontend.name}
- Price: $${frontend.price}
- Format: ${frontend?.format || 'General'}
- Description: ${frontend.description}
- Target Audience: ${audience.name}

FORMAT INSTRUCTIONS (CRITICAL - FOLLOW EXACTLY):
${formatInstructions}

The content structure MUST match the format above. If the format is "Checklist", output checkbox items, NOT paragraphs. If the format is "Swipe File", output ready-to-use templates, NOT essays.

Generate 4 sections separated by: ${SECTION_SEPARATOR}

Section 1 - COVER (JSON):
{
  "type": "cover",
  "title": "${frontend.name}",
  "subtitle": "${frontend.description}",
  "author": "By ${profile.name}",
  "price": "$${frontend.price}"
}

${SECTION_SEPARATOR}

Section 2 - CHAPTER 1 (JSON):
{
  "type": "chapter",
  "number": 1,
  "title": "Chapter 1: [Title]",
  "content": "[500-800 words following FORMAT INSTRUCTIONS above]"
}

${SECTION_SEPARATOR}

Section 3 - CHAPTER 2 (JSON):
{
  "type": "chapter",
  "number": 2,
  "title": "Chapter 2: [Title]",
  "content": "[500-800 words following FORMAT INSTRUCTIONS above]"
}

${SECTION_SEPARATOR}

Section 4 - CHAPTER 3 (JSON):
{
  "type": "chapter",
  "number": 3,
  "title": "Chapter 3: [Title]",
  "content": "[500-800 words following FORMAT INSTRUCTIONS above]"
}

Use creator's knowledge. Return valid JSON. CRITICAL: The content MUST follow the FORMAT INSTRUCTIONS.${getLanguagePromptSuffix(funnel.language)}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }]
  });

  // Use safe section parsing with validation
  const sections = safeParseSections(response.content[0].text, 4, 'FrontendPart1');

  const cover = parseClaudeJSON(sections[0]);
  const chapter1 = parseClaudeJSON(sections[1]);
  const chapter2 = parseClaudeJSON(sections[2]);
  const chapter3 = parseClaudeJSON(sections[3]);

  // Store content in funnel's JSONB column (front_end is JSONB, not a separate table)
  const updatedFrontend = {
    ...funnel.front_end,
    cover_data: cover,
    chapters: [chapter1, chapter2, chapter3]
  };

  await supabase.from('funnels').update({
    front_end: updatedFrontend,
    updated_at: new Date().toISOString()
  }).eq('id', funnelId);

  console.log(`✅ ${LOG_TAG} Front-end part 1 saved to funnel JSONB`);

  // Log RAG metrics
  await logRagForBatchedGen(funnelId, funnel, 'frontend-part1', ragMetrics);

  return { cover, chapter1, chapter2, chapter3 };
}

// Task 4: Front-End Part 2 (Chapters 4-6 with embedded cross-promo promoting Main Product)
export async function generateFrontendPart2(funnelId) {
  console.log(`📝 ${LOG_TAG} Generating front-end part 2 (chapters 4-6 with embedded cross-promo)`);

  const funnel = await getFunnelData(funnelId);
  const { frontend, main_product } = funnel;

  // Read previous chapters from funnel's JSONB column (saved by Part 1)
  const previousChapters = funnel.front_end?.chapters || [];

  const { context: knowledge, metrics: ragMetrics } = await searchKnowledgeWithMetrics(`${frontend.name} final chapters`, {
    limit: 40,
    threshold: 0.3,
    sourceFunction: 'batched-generators'
  });

  // Cross-promo promotes Main Product (user's flagship product)
  // mention_price defaults to false if not set
  const mentionPrice = main_product?.mention_price || false;
  const crossPromo = buildCrossPromoParagraph(main_product, mentionPrice);

  const promoProductName = main_product?.name || 'our premium offering';

  // Get format instructions for content structure
  const formatInstructions = getFormatInstructions(frontend?.format);

  const prompt = `${knowledge}

Generate FINAL 3 CHAPTERS for this front-end product.

PRODUCT: ${frontend.name} - ${frontend.description}
FORMAT: ${frontend?.format || 'General'}
CROSS-PROMO TARGET: ${promoProductName}${main_product?.tldr ? ` - ${main_product.tldr}` : ''}

FORMAT INSTRUCTIONS (CRITICAL - FOLLOW EXACTLY):
${formatInstructions}

The content structure MUST match the format above. If the format is "Checklist", output checkbox items, NOT paragraphs. If the format is "Swipe File", output ready-to-use templates, NOT essays.

PREVIOUS CHAPTERS:
${previousChapters.map(c => `- ${c.title}`).join('\n')}

IMPORTANT: Chapter 6 (the final chapter) MUST end with a natural cross-promotion paragraph that promotes "${promoProductName}".
The cross-promo should feel like a natural next step, not a hard sell.

Generate 3 sections separated by: ${SECTION_SEPARATOR}

Section 1 - CHAPTER 4 (JSON):
{
  "type": "chapter",
  "number": 4,
  "title": "Chapter 4: [Title]",
  "content": "[500-800 words following FORMAT INSTRUCTIONS above]"
}

${SECTION_SEPARATOR}

Section 2 - CHAPTER 5 (JSON):
{
  "type": "chapter",
  "number": 5,
  "title": "Chapter 5: [Title]",
  "content": "[500-800 words following FORMAT INSTRUCTIONS above]"
}

${SECTION_SEPARATOR}

Section 3 - CHAPTER 6 (JSON):
{
  "type": "chapter",
  "number": 6,
  "title": "Chapter 6: [Title]",
  "content": "[500-800 words following FORMAT INSTRUCTIONS - wrap up AND include cross-promo paragraph at the end promoting ${promoProductName}]"
}

Use creator's knowledge. Return valid JSON. CRITICAL: The content MUST follow the FORMAT INSTRUCTIONS.${getLanguagePromptSuffix(funnel.language)}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 14000,
    messages: [{ role: 'user', content: prompt }]
  });

  // Use safe section parsing with validation
  const sections = safeParseSections(response.content[0].text, 3, 'FrontendPart2');

  const chapter4 = parseClaudeJSON(sections[0]);
  const chapter5 = parseClaudeJSON(sections[1]);
  const chapter6 = parseClaudeJSON(sections[2]);

  // Ensure cross-promo is embedded if AI didn't include it
  if (chapter6.content && main_product && !chapter6.content.toLowerCase().includes(main_product.name.toLowerCase())) {
    chapter6.content += crossPromo;
  }

  const allChapters = [...previousChapters, chapter4, chapter5, chapter6];

  // Store content in funnel's JSONB column (front_end is JSONB, not a separate table)
  const updatedFrontend = {
    ...funnel.front_end,
    chapters: allChapters
  };

  await supabase.from('funnels').update({
    front_end: updatedFrontend,
    updated_at: new Date().toISOString()
  }).eq('id', funnelId);

  console.log(`✅ ${LOG_TAG} Front-end part 2 saved to funnel JSONB (cross-promo embedded)`);

  // Log RAG metrics
  await logRagForBatchedGen(funnelId, funnel, 'frontend-part2', ragMetrics);

  return { chapter4, chapter5, chapter6 };
}

// Task 5: Bump Full Product (short format with embedded cross-promo promoting Main Product)
export async function generateBumpFull(funnelId) {
  console.log(`📝 ${LOG_TAG} Generating bump product (short format with embedded cross-promo)`);

  const funnel = await getFunnelData(funnelId);
  const { bump, profile, audience, main_product } = funnel;

  const { context: knowledge, metrics: ragMetrics } = await searchKnowledgeWithMetrics(`${bump.name} ${bump.description} quick actionable`, {
    limit: 40,
    threshold: 0.3,
    sourceFunction: 'batched-generators'
  });

  // Cross-promo promotes Main Product (user's flagship product)
  const mentionPrice = main_product?.mention_price || false;
  const crossPromo = buildCrossPromoParagraph(main_product, mentionPrice);
  const promoProductName = main_product?.name || 'our premium offering';

  // Get format instructions for content structure
  const formatInstructions = getFormatInstructions(bump?.format);

  const prompt = `${knowledge}

Generate COMPLETE BUMP PRODUCT (short format - quick wins).

PRODUCT: ${bump.name}
Price: $${bump.price}
Format: ${bump?.format || 'General'}
Description: ${bump.description}
CROSS-PROMO TARGET: ${promoProductName}${main_product?.tldr ? ` - ${main_product.tldr}` : ''}

FORMAT INSTRUCTIONS (CRITICAL - FOLLOW EXACTLY):
${formatInstructions}

The content structure MUST match the format above. If the format is "Checklist", output checkbox items, NOT paragraphs. If the format is "Swipe File", output ready-to-use templates, NOT essays.

This is a BUMP OFFER - keep it SHORT and ACTIONABLE (3 sections total).

IMPORTANT: Chapter 2 (the final chapter) MUST end with a brief cross-promotion paragraph promoting "${promoProductName}".

Generate 3 sections separated by: ${SECTION_SEPARATOR}

Section 1 - COVER (JSON):
{
  "type": "cover",
  "title": "${bump.name}",
  "subtitle": "${bump.description}",
  "author": "By ${profile.name}",
  "price": "$${bump.price}"
}

${SECTION_SEPARATOR}

Section 2 - CHAPTER 1 (JSON):
{
  "type": "chapter",
  "number": 1,
  "title": "Chapter 1: [Quick Win Title]",
  "content": "[300-400 words following FORMAT INSTRUCTIONS - immediate value]"
}

${SECTION_SEPARATOR}

Section 3 - CHAPTER 2 (JSON):
{
  "type": "chapter",
  "number": 2,
  "title": "Chapter 2: [Actionable Title]",
  "content": "[300-400 words following FORMAT INSTRUCTIONS - actionable steps AND end with brief cross-promo for ${promoProductName}]"
}

Keep it SHORT and ACTIONABLE. Use creator's knowledge. Return valid JSON. CRITICAL: Follow FORMAT INSTRUCTIONS.${getLanguagePromptSuffix(funnel.language)}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 10000,
    messages: [{ role: 'user', content: prompt }]
  });

  // Use safe section parsing with validation
  const sections = safeParseSections(response.content[0].text, 3, 'BumpFull');

  const cover = parseClaudeJSON(sections[0]);
  const chapter1 = parseClaudeJSON(sections[1]);
  const chapter2 = parseClaudeJSON(sections[2]);

  // Ensure cross-promo is embedded if AI didn't include it
  if (chapter2.content && main_product && !chapter2.content.toLowerCase().includes(main_product.name.toLowerCase())) {
    chapter2.content += crossPromo;
  }

  // Store content in funnel's JSONB column (bump is JSONB, not a separate table)
  const updatedBump = {
    ...funnel.bump,
    cover_data: cover,
    chapters: [chapter1, chapter2]
  };

  await supabase.from('funnels').update({
    bump: updatedBump,
    updated_at: new Date().toISOString()
  }).eq('id', funnelId);

  console.log(`✅ ${LOG_TAG} Bump product saved to funnel JSONB (cross-promo embedded)`);

  // Log RAG metrics
  await logRagForBatchedGen(funnelId, funnel, 'bump', ragMetrics);

  return { cover, chapter1, chapter2 };
}

// Task 6: Upsell 1 Part 1 (Cover + First Half)
export async function generateUpsell1Part1(funnelId) {
  console.log(`📝 ${LOG_TAG} Generating upsell 1 part 1`);

  const funnel = await getFunnelData(funnelId);
  const { upsell1, profile, audience } = funnel;

  const { context: knowledge, metrics: ragMetrics } = await searchKnowledgeWithMetrics(`${upsell1.name} ${upsell1.description}`, {
    limit: 40,
    threshold: 0.3,
    sourceFunction: 'batched-generators'
  });

  // Get format instructions for content structure
  const formatInstructions = getFormatInstructions(upsell1?.format);

  const prompt = `${knowledge}

Generate COVER and FIRST HALF for this upsell product.

PRODUCT: ${upsell1.name} ($${upsell1.price})
Format: ${upsell1?.format || 'General'}
Description: ${upsell1.description}

FORMAT INSTRUCTIONS (CRITICAL - FOLLOW EXACTLY):
${formatInstructions}

The content structure MUST match the format above. If the format is "Checklist", output checkbox items, NOT paragraphs. If the format is "Swipe File", output ready-to-use templates, NOT essays.

Generate 4 sections separated by: ${SECTION_SEPARATOR}

Section 1 - COVER (JSON), Section 2-4 - CHAPTERS 1-3 (JSON following FORMAT INSTRUCTIONS)

Use 600-800 words per chapter following the FORMAT INSTRUCTIONS. Return valid JSON.${getLanguagePromptSuffix(funnel.language)}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }]
  });

  // Use safe section parsing with validation
  const sections = safeParseSections(response.content[0].text, 4, 'Upsell1Part1');
  const cover = parseClaudeJSON(sections[0]);
  const chapters = [parseClaudeJSON(sections[1]), parseClaudeJSON(sections[2]), parseClaudeJSON(sections[3])];

  // Store content in funnel's JSONB column (upsell_1 is JSONB, not a separate table)
  const updatedUpsell1 = {
    ...funnel.upsell_1,
    cover_data: cover,
    chapters: chapters
  };

  await supabase.from('funnels').update({
    upsell_1: updatedUpsell1,
    updated_at: new Date().toISOString()
  }).eq('id', funnelId);

  console.log(`✅ ${LOG_TAG} Upsell 1 part 1 saved to funnel JSONB`);

  // Log RAG metrics
  await logRagForBatchedGen(funnelId, funnel, 'upsell1-part1', ragMetrics);

  return { cover, chapters };
}

// Task 7: Upsell 1 Part 2 (Second Half with embedded cross-promo promoting Main Product)
export async function generateUpsell1Part2(funnelId) {
  console.log(`📝 ${LOG_TAG} Generating upsell 1 part 2 (with embedded cross-promo)`);

  const funnel = await getFunnelData(funnelId);
  const { upsell1, main_product } = funnel;

  // Read previous chapters from funnel's JSONB column (saved by Part 1)
  const previousChapters = funnel.upsell_1?.chapters || [];

  const { context: knowledge, metrics: ragMetrics } = await searchKnowledgeWithMetrics(`${upsell1.name} final chapters`, {
    limit: 40,
    threshold: 0.3,
    sourceFunction: 'batched-generators'
  });

  // Cross-promo promotes Main Product (user's flagship product)
  const mentionPrice = main_product?.mention_price || false;
  const crossPromo = buildCrossPromoParagraph(main_product, mentionPrice);
  const promoProductName = main_product?.name || 'our premium offering';

  // Get format instructions for content structure
  const formatInstructions = getFormatInstructions(upsell1?.format);

  const prompt = `${knowledge}

Generate FINAL 3 CHAPTERS for upsell 1.

PRODUCT: ${upsell1.name}
FORMAT: ${upsell1?.format || 'General'}
PREVIOUS CHAPTERS: ${previousChapters.map(c => c.title).join(', ')}
CROSS-PROMO TARGET: ${promoProductName}${main_product?.tldr ? ` - ${main_product.tldr}` : ''}

FORMAT INSTRUCTIONS (CRITICAL - FOLLOW EXACTLY):
${formatInstructions}

The content structure MUST match the format above. If the format is "Checklist", output checkbox items, NOT paragraphs. If the format is "Swipe File", output ready-to-use templates, NOT essays.

IMPORTANT: Chapter 6 (the final chapter) MUST end with a natural cross-promotion paragraph promoting "${promoProductName}".

Generate 3 sections separated by: ${SECTION_SEPARATOR}

Section 1 - CHAPTER 4 (JSON):
{
  "type": "chapter",
  "number": 4,
  "title": "Chapter 4: [Title]",
  "content": "[600-800 words following FORMAT INSTRUCTIONS]"
}

${SECTION_SEPARATOR}

Section 2 - CHAPTER 5 (JSON):
{
  "type": "chapter",
  "number": 5,
  "title": "Chapter 5: [Title]",
  "content": "[600-800 words following FORMAT INSTRUCTIONS]"
}

${SECTION_SEPARATOR}

Section 3 - CHAPTER 6 (JSON):
{
  "type": "chapter",
  "number": 6,
  "title": "Chapter 6: [Title]",
  "content": "[600-800 words following FORMAT INSTRUCTIONS - wrap up AND include cross-promo paragraph at the end promoting ${promoProductName}]"
}

Return valid JSON. CRITICAL: Follow FORMAT INSTRUCTIONS.${getLanguagePromptSuffix(funnel.language)}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 14000,
    messages: [{ role: 'user', content: prompt }]
  });

  // Use safe section parsing with validation
  const sections = safeParseSections(response.content[0].text, 3, 'Upsell1Part2');
  const chapter4 = parseClaudeJSON(sections[0]);
  const chapter5 = parseClaudeJSON(sections[1]);
  const chapter6 = parseClaudeJSON(sections[2]);

  // Ensure cross-promo is embedded if AI didn't include it
  if (chapter6.content && main_product && !chapter6.content.toLowerCase().includes(main_product.name.toLowerCase())) {
    chapter6.content += crossPromo;
  }

  // Store content in funnel's JSONB column (upsell_1 is JSONB, not a separate table)
  const updatedUpsell1 = {
    ...funnel.upsell_1,
    chapters: [...previousChapters, chapter4, chapter5, chapter6]
  };

  await supabase.from('funnels').update({
    upsell_1: updatedUpsell1,
    updated_at: new Date().toISOString()
  }).eq('id', funnelId);

  console.log(`✅ ${LOG_TAG} Upsell 1 part 2 saved to funnel JSONB (cross-promo embedded)`);

  // Log RAG metrics
  await logRagForBatchedGen(funnelId, funnel, 'upsell1-part2', ragMetrics);

  return { chapter4, chapter5, chapter6 };
}

// Task 8: Upsell 2 Part 1 (Cover + First Half)
export async function generateUpsell2Part1(funnelId) {
  console.log(`📝 ${LOG_TAG} Generating upsell 2 part 1`);

  const funnel = await getFunnelData(funnelId);
  const { upsell2, profile } = funnel;

  const { context: knowledge, metrics: ragMetrics } = await searchKnowledgeWithMetrics(`${upsell2.name} ${upsell2.description}`, {
    limit: 40,
    threshold: 0.3,
    sourceFunction: 'batched-generators'
  });

  // Get format instructions for content structure
  const formatInstructions = getFormatInstructions(upsell2?.format);

  const prompt = `${knowledge}

Generate COVER and FIRST 3 CHAPTERS for this upsell product.

PRODUCT: ${upsell2.name} ($${upsell2.price})
FORMAT: ${upsell2?.format || 'General'}

FORMAT INSTRUCTIONS (CRITICAL - FOLLOW EXACTLY):
${formatInstructions}

**CRITICAL OUTPUT FORMAT:**
You MUST output exactly 4 JSON sections separated by the EXACT text: ===SECTION_BREAK===

Your response MUST follow this EXACT structure:

{"type":"cover","title":"...","subtitle":"...","author":"...","price":"..."}
===SECTION_BREAK===
{"type":"chapter","number":1,"title":"Chapter 1: ...","content":"..."}
===SECTION_BREAK===
{"type":"chapter","number":2,"title":"Chapter 2: ...","content":"..."}
===SECTION_BREAK===
{"type":"chapter","number":3,"title":"Chapter 3: ...","content":"..."}

Each chapter content should be 600-800 words following the FORMAT INSTRUCTIONS above.
Do NOT wrap in markdown code blocks. Output raw JSON with ===SECTION_BREAK=== between each.${getLanguagePromptSuffix(funnel.language)}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    system: `You are a content generator. You MUST output exactly 4 JSON objects separated by ===SECTION_BREAK===. Do NOT use markdown formatting. Output raw JSON with the exact separator between sections.${getLanguagePromptSuffix(funnel.language)}`,
    messages: [{ role: 'user', content: prompt }]
  });

  // Use safe section parsing with validation
  const sections = safeParseSections(response.content[0].text, 4, 'Upsell2Part1');
  const cover = parseClaudeJSON(sections[0]);
  const chapters = [parseClaudeJSON(sections[1]), parseClaudeJSON(sections[2]), parseClaudeJSON(sections[3])];

  // Store content in funnel's JSONB column (upsell_2 is JSONB, not a separate table)
  const updatedUpsell2 = {
    ...funnel.upsell_2,
    cover_data: cover,
    chapters: chapters
  };

  await supabase.from('funnels').update({
    upsell_2: updatedUpsell2,
    updated_at: new Date().toISOString()
  }).eq('id', funnelId);

  console.log(`✅ ${LOG_TAG} Upsell 2 part 1 saved to funnel JSONB`);

  // Log RAG metrics
  await logRagForBatchedGen(funnelId, funnel, 'upsell2-part1', ragMetrics);

  return { cover, chapters };
}

// Task 9: Upsell 2 Part 2 (Second Half with embedded cross-promo promoting Main Product)
export async function generateUpsell2Part2(funnelId) {
  console.log(`📝 ${LOG_TAG} Generating upsell 2 part 2 (with embedded cross-promo)`);

  const funnel = await getFunnelData(funnelId);
  const { upsell2, main_product } = funnel;

  // Read previous chapters from funnel's JSONB column (saved by Part 1)
  const previousChapters = funnel.upsell_2?.chapters || [];

  const { context: knowledge, metrics: ragMetrics } = await searchKnowledgeWithMetrics(`${upsell2.name} final chapters conclusion`, {
    limit: 40,
    threshold: 0.3,
    sourceFunction: 'batched-generators'
  });

  // Cross-promo promotes Main Product (user's flagship product)
  const mentionPrice = main_product?.mention_price || false;
  const crossPromo = buildCrossPromoParagraph(main_product, mentionPrice);
  const promoProductName = main_product?.name || 'our premium offering';

  // Get format instructions for content structure
  const formatInstructions = getFormatInstructions(upsell2?.format);

  const prompt = `${knowledge}

Generate FINAL 3 CHAPTERS for final upsell.

PRODUCT: ${upsell2.name}
FORMAT: ${upsell2?.format || 'General'}
PREVIOUS CHAPTERS: ${previousChapters.map(c => c.title).join(', ')}
CROSS-PROMO TARGET: ${promoProductName}${main_product?.tldr ? ` - ${main_product.tldr}` : ''}

FORMAT INSTRUCTIONS (CRITICAL - FOLLOW EXACTLY):
${formatInstructions}

The content structure MUST match the format above. If the format is "Checklist", output checkbox items, NOT paragraphs. If the format is "Swipe File", output ready-to-use templates, NOT essays.

IMPORTANT: Chapter 6 (the final chapter) MUST end with a natural cross-promotion paragraph promoting "${promoProductName}".
This is the final product in the funnel, so the cross-promo should feel like a "complete your journey" recommendation.

Generate 3 sections separated by: ${SECTION_SEPARATOR}

Section 1 - CHAPTER 4 (JSON):
{
  "type": "chapter",
  "number": 4,
  "title": "Chapter 4: [Title]",
  "content": "[600-800 words following FORMAT INSTRUCTIONS]"
}

${SECTION_SEPARATOR}

Section 2 - CHAPTER 5 (JSON):
{
  "type": "chapter",
  "number": 5,
  "title": "Chapter 5: [Title]",
  "content": "[600-800 words following FORMAT INSTRUCTIONS]"
}

${SECTION_SEPARATOR}

Section 3 - CHAPTER 6 (JSON):
{
  "type": "chapter",
  "number": 6,
  "title": "Chapter 6: [Title]",
  "content": "[600-800 words following FORMAT INSTRUCTIONS - conclusion AND include cross-promo paragraph at the end promoting ${promoProductName}]"
}

Return valid JSON. CRITICAL: Follow FORMAT INSTRUCTIONS.${getLanguagePromptSuffix(funnel.language)}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 14000,
    messages: [{ role: 'user', content: prompt }]
  });

  // Use safe section parsing with validation
  const sections = safeParseSections(response.content[0].text, 3, 'Upsell2Part2');
  const chapter4 = parseClaudeJSON(sections[0]);
  const chapter5 = parseClaudeJSON(sections[1]);
  const chapter6 = parseClaudeJSON(sections[2]);

  // Ensure cross-promo is embedded if AI didn't include it
  if (chapter6.content && main_product && !chapter6.content.toLowerCase().includes(main_product.name.toLowerCase())) {
    chapter6.content += crossPromo;
  }

  // Store content in funnel's JSONB column (upsell_2 is JSONB, not a separate table)
  const updatedUpsell2 = {
    ...funnel.upsell_2,
    chapters: [...previousChapters, chapter4, chapter5, chapter6]
  };

  await supabase.from('funnels').update({
    upsell_2: updatedUpsell2,
    updated_at: new Date().toISOString()
  }).eq('id', funnelId);

  console.log(`✅ ${LOG_TAG} Upsell 2 part 2 saved to funnel JSONB (cross-promo embedded)`);

  // Log RAG metrics
  await logRagForBatchedGen(funnelId, funnel, 'upsell2-part2', ragMetrics);

  return { chapter4, chapter5, chapter6 };
}

// ============================================================================
// MARKETING MATERIALS GENERATORS (Tasks 10-14)
// ============================================================================

// Task 10: All TLDRs (5 products)
export async function generateAllTldrs(funnelId) {
  console.log(`📝 ${LOG_TAG} Task 10: Generating all 5 TLDRs in 1 batched call`);

  const funnel = await getFunnelData(funnelId);
  const { lead_magnet, frontend, bump, upsell1, upsell2 } = funnel;
  const { context: knowledge, metrics: ragMetrics } = await searchKnowledgeWithMetrics(`${funnel.audience} products summary`, {
    limit: 40,
    threshold: 0.3,
    sourceFunction: 'batched-generators'
  });

  const prompt = `${knowledge}

Generate STRUCTURED SUMMARIES (TLDRs) for ALL 5 products.

PRODUCTS:
1. Lead Magnet: "${lead_magnet?.name || 'Lead Magnet'}"
2. Front-End: "${frontend?.name || 'Front-End'}"
3. Bump: "${bump?.name || 'Bump'}"
4. Upsell 1: "${upsell1?.name || 'Upsell 1'}"
5. Upsell 2: "${upsell2?.name || 'Upsell 2'}"

Generate 5 sections separated by: ${SECTION_SEPARATOR}

For EACH product, output a JSON object with these fields:
- what_it_is: One compelling sentence describing what this product is
- who_its_for: One sentence describing the ideal customer
- problem_solved: The main pain point or problem this solves
- whats_inside: Array of 3-5 key deliverables/components
- key_benefits: Array of 3-5 transformation benefits
- cta: A compelling call-to-action phrase

Output 5 JSON objects separated by ===SECTION_BREAK=== (no markdown headers, raw JSON only):

{"what_it_is":"...","who_its_for":"...","problem_solved":"...","whats_inside":["...","...","..."],"key_benefits":["...","...","..."],"cta":"..."}
===SECTION_BREAK===
{"what_it_is":"...","who_its_for":"...","problem_solved":"...","whats_inside":["...","...","..."],"key_benefits":["...","...","..."],"cta":"..."}
===SECTION_BREAK===
{"what_it_is":"...","who_its_for":"...","problem_solved":"...","whats_inside":["...","...","..."],"key_benefits":["...","...","..."],"cta":"..."}
===SECTION_BREAK===
{"what_it_is":"...","who_its_for":"...","problem_solved":"...","whats_inside":["...","...","..."],"key_benefits":["...","...","..."],"cta":"..."}
===SECTION_BREAK===
{"what_it_is":"...","who_its_for":"...","problem_solved":"...","whats_inside":["...","...","..."],"key_benefits":["...","...","..."],"cta":"..."}${getLanguagePromptSuffix(funnel.language)}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    system: `Output exactly 5 JSON objects separated by ===SECTION_BREAK===. No markdown. Raw JSON only.${getLanguagePromptSuffix(funnel.language)}`,
    messages: [{ role: 'user', content: prompt }]
  });

  // Use safe section parsing with validation
  const sections = safeParseSections(response.content[0].text, 5, 'AllTldrs');
  const tldrs = sections.map(s => parseClaudeJSON(s));

  // Save TLDRs to lead_magnets table if it exists
  // Now saves the FULL structured object (what_it_is, who_its_for, etc.)
  if (lead_magnet?.id) {
    await supabase.from('lead_magnets').update({ tldr: tldrs[0] }).eq('id', lead_magnet.id);
  }

  // Save TLDRs to TOP-LEVEL columns (frontend reads from front_end_tldr, not front_end.tldr)
  // FIX: Was saving nested, but frontend expects top-level columns
  await supabase.from('funnels').update({
    front_end_tldr: tldrs[1],
    bump_tldr: tldrs[2],
    upsell_1_tldr: tldrs[3],
    upsell_2_tldr: tldrs[4],
    updated_at: new Date().toISOString()
  }).eq('id', funnelId);

  console.log(`✅ ${LOG_TAG} All 5 TLDRs saved to top-level columns`);

  // Log RAG metrics
  await logRagForBatchedGen(funnelId, funnel, 'all-tldrs', ragMetrics);

  return tldrs;
}

// Task 11: Marketplace Batch 1 (Lead Magnet + Front-End + Bump)
// Uses 7-section framework with Unicode bold for Etsy/Gumroad
export async function generateMarketplaceBatch1(funnelId) {
  console.log(`📝 ${LOG_TAG} Task 11: Generating marketplace listings for Lead Magnet + Front-End + Bump`);

  const funnel = await getFunnelData(funnelId);
  const { lead_magnet, frontend, bump } = funnel;

  // Get TLDRs for product context (framework uses TLDR as source of truth)
  const { data: tldrData } = await supabase
    .from('funnels')
    .select('front_end_tldr, bump_tldr')
    .eq('id', funnelId)
    .single();

  // Get lead magnet TLDR if exists
  let leadMagnetTldr = null;
  if (lead_magnet?.id) {
    const { data: lmData } = await supabase
      .from('lead_magnets')
      .select('tldr')
      .eq('id', lead_magnet.id)
      .single();
    leadMagnetTldr = lmData?.tldr;
  }

  const { context: knowledge, metrics: ragMetrics } = await searchKnowledgeWithMetrics(`${funnel.audience} marketplace product listings`, {
    limit: 40,
    threshold: 0.3,
    sourceFunction: 'batched-generators'
  });

  const prompt = `${knowledge}

Generate MARKETPLACE LISTINGS for 3 products using the 7-SECTION FRAMEWORK.

TARGET AUDIENCE: ${funnel.audience}
NICHE: ${funnel.niche}

== PRODUCT 1: LEAD MAGNET (FREE) ==
Name: "${lead_magnet?.name || 'Lead Magnet'}"
Format: ${lead_magnet?.format || 'PDF guide'}
TLDR (use as source of truth):
${JSON.stringify(leadMagnetTldr, null, 2) || 'No TLDR available - generate based on name/format'}

== PRODUCT 2: FRONT-END ($${frontend?.price || '17'}) ==
Name: "${frontend?.name}"
Format: ${frontend?.format || 'Digital product'}
TLDR (use as source of truth):
${JSON.stringify(tldrData?.front_end_tldr, null, 2) || 'No TLDR available'}

== PRODUCT 3: BUMP ($${bump?.price || '9'}) ==
Name: "${bump?.name}"
Format: ${bump?.format || 'Quick-win resource'}
TLDR (use as source of truth):
${JSON.stringify(tldrData?.bump_tldr, null, 2) || 'No TLDR available'}

== MANIFESTABLE DESCRIPTION FRAMEWORK FOR marketplace_description ==

For EACH product, create a description with these 6 sections:

[SECTION 1: EMOTIONAL HOOK - 2 paragraphs]
Open with a question about their pain point (use TLDR "problem_solved" field).
Acknowledge their struggle with empathy ("It's not your fault").
Position this product as the solution designed specifically for them.

━━━━━━━━━━

[SECTION 2: WHY YOU'LL LOVE THIS - 5 bullets]
𝗪𝗵𝘆 𝗬𝗼𝘂'𝗹𝗹 𝗟𝗼𝘃𝗲 𝗧𝗵𝗶𝘀 [Product Name]:

✓ [Transformation statement - use TLDR benefits]
✓ [Outcome-focused benefit]
✓ [Outcome-focused benefit]
✓ [Outcome-focused benefit]
✓ [Outcome-focused benefit]

━━━━━━━━━━

[SECTION 3: WHAT'S INSIDE - 6-8 bullets]
𝗪𝗵𝗮𝘁'𝘀 𝗜𝗻𝘀𝗶𝗱𝗲:

✓ [Specific feature from TLDR with brief explanation]
✓ [Feature with brief explanation]
✓ [Feature with brief explanation]
✓ [Feature with brief explanation]
✓ [Feature with brief explanation]
✓ [Feature with brief explanation]
✓ Instant digital download

━━━━━━━━━━

[SECTION 4: WHO THIS IS FOR - 1 paragraph]
𝗣𝗲𝗿𝗳𝗲𝗰𝘁 𝗳𝗼𝗿 [use TLDR "who_its_for" field with specific situations].

━━━━━━━━━━

[SECTION 5: WHAT YOU'LL RECEIVE]
𝗪𝗛𝗔𝗧 𝗬𝗢𝗨'𝗟𝗟 𝗥𝗘𝗖𝗘𝗜𝗩𝗘:

✓ 1 PDF [Product Name]

━━━━━━━━━━

[SECTION 6: LEGAL/TERMS]
𝗣𝗟𝗘𝗔𝗦𝗘 𝗡𝗢𝗧𝗘: This is a digital product. No physical items will be shipped.
𝗧𝗘𝗥𝗠𝗦 𝗢𝗙 𝗦𝗘𝗥𝗩𝗜𝗖𝗘: Due to the digital nature of this product, all sales are final.
This product is for PERSONAL USE ONLY.
Copyright 2026. All rights reserved.

== CRITICAL FORMATTING RULES ==

1. Use Unicode bold characters (𝗔-𝗭, 𝗮-𝘇, 𝟬-𝟵) for section headers only

2. Use ━━━━━━━━━━ as section dividers

3. NO markdown ** symbols - they show as raw text on Etsy/Gumroad

4. Use ✓ checkmarks for all bullet points

5. CRITICAL - BULLET POINT FORMATTING:
   Each bullet point MUST be on its own line with a newline character between them.
   WRONG: "✓ Item 1 ✓ Item 2 ✓ Item 3" (all on one line)
   CORRECT:
   "✓ Item 1
   ✓ Item 2
   ✓ Item 3"

6. CRITICAL - SECTION HEADER FORMATTING:
   After each section header, use TWO newlines before bullets (for proper UI rendering).
   WRONG: "𝗪𝗵𝗮𝘁'𝘀 𝗜𝗻𝘀𝗶𝗱𝗲:\n✓ Item 1" (single newline)
   CORRECT: "𝗪𝗵𝗮𝘁'𝘀 𝗜𝗻𝘀𝗶𝗱𝗲:\n\n✓ Item 1" (double newline)

== OUTPUT FORMAT ==

marketplace_title: SEO keyword-stuffed title (MAX 140 characters)
Fill ALL 140 characters with searchable keyword phrases separated by |

KEYWORD STRATEGY:
1. Lead with the product's core topic as a searchable phrase
2. Add synonyms and topic variations people search for
3. Add format-adjacent search terms (Guide, Planner, Template, Tracker)
4. Add audience/niche keywords (Small Business, Entrepreneur, Coach)

RULES:
- NEVER use "Digital Download"
- NEVER use generic labels like "Checklist" or "Swipe File" alone
- Every phrase must be something a buyer would search on Etsy

EXAMPLE: "Facebook Group Marketing | Lead Generation Guide | FB Group Growth | Social Media Strategy | Online Business | Community Building Tips"

marketplace_bullets: Array of 4-6 short items for display card
- Format: ["Deliverable 1", "Deliverable 2", ...]
- No benefits here, just scannable items

marketplace_tags: Array of EXACTLY 13 tags (each MAX 20 chars)

MANDATORY TAG STRUCTURE:
1. "digital download" (REQUIRED - always include this exact tag)
2. "instant pdf" OR "pdf template" OR "printable" (REQUIRED - pick one)
3-5. Three FORMAT tags (checklist, worksheet, template, guide, etc.)
6-8. Three NICHE tags (online business, marketing, social media, etc.)
9-11. Three BENEFIT tags (lead generation, passive income, etc.)
12-13. Two AUDIENCE tags (coach, consultant, entrepreneur, etc.)

EXAMPLE: ["digital download", "instant pdf", "marketing checklist", "business checklist", "checklist template", "online business", "entrepreneur", "small business", "lead generation", "sales funnel", "marketing tips", "coach", "consultant"]

CRITICAL:
- Tag #1 MUST be "digital download"
- Tag #2 MUST be a platform tag
- All 13 slots filled, each ≤20 chars, no duplicates

Output 3 JSON objects separated by ${SECTION_SEPARATOR}:
{"marketplace_title":"...","marketplace_description":"...","marketplace_bullets":[...],"marketplace_tags":[...]}
${SECTION_SEPARATOR}
{"marketplace_title":"...","marketplace_description":"...","marketplace_bullets":[...],"marketplace_tags":[...]}
${SECTION_SEPARATOR}
{"marketplace_title":"...","marketplace_description":"...","marketplace_bullets":[...],"marketplace_tags":[...]}${getLanguagePromptSuffix(funnel.language)}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    system: MARKETPLACE_SYSTEM + `\n\nOutput exactly 3 JSON objects separated by ===SECTION_BREAK===. Raw JSON only, no markdown code blocks.${getLanguagePromptSuffix(funnel.language)}`,
    messages: [{ role: 'user', content: prompt }]
  });

  // Use safe section parsing with validation
  const sections = safeParseSections(response.content[0].text, 3, 'MarketplaceBatch1');
  const listings = sections.map(s => {
    const parsed = parseClaudeJSON(s);
    // Fix bullet newlines in marketplace_description
    if (parsed.marketplace_description) {
      parsed.marketplace_description = fixBulletNewlines(parsed.marketplace_description);
    }
    return parsed;
  });

  // Save marketplace listing to lead_magnets table if it exists
  if (lead_magnet?.id) {
    await supabase.from('lead_magnets').update({
      marketplace_listing: listings[0]
    }).eq('id', lead_magnet.id);
  }

  // Save marketplace listings to funnel's JSONB columns
  await supabase.from('funnels').update({
    front_end: { ...funnel.front_end, marketplace_listing: listings[1] },
    bump: { ...funnel.bump, marketplace_listing: listings[2] },
    updated_at: new Date().toISOString()
  }).eq('id', funnelId);

  console.log(`✅ ${LOG_TAG} Marketplace batch 1 saved to funnel JSONB (3 listings)`);

  // Log RAG metrics
  await logRagForBatchedGen(funnelId, funnel, 'marketplace-batch1', ragMetrics);

  return listings;
}

// Task 12: Marketplace Batch 2 (Upsell 1 + Upsell 2)
// Uses 7-section framework with Unicode bold for Etsy/Gumroad
export async function generateMarketplaceBatch2(funnelId) {
  console.log(`📝 ${LOG_TAG} Task 12: Generating marketplace listings for Upsell 1 + Upsell 2`);

  const funnel = await getFunnelData(funnelId);
  const { upsell1, upsell2 } = funnel;

  // Get TLDRs for product context (framework uses TLDR as source of truth)
  const { data: tldrData } = await supabase
    .from('funnels')
    .select('upsell_1_tldr, upsell_2_tldr')
    .eq('id', funnelId)
    .single();

  const { context: knowledge, metrics: ragMetrics } = await searchKnowledgeWithMetrics(`${funnel.audience} premium upsell products`, {
    limit: 40,
    threshold: 0.3,
    sourceFunction: 'batched-generators'
  });

  const prompt = `${knowledge}

Generate MARKETPLACE LISTINGS for 2 PREMIUM UPSELL products using the 7-SECTION FRAMEWORK.

TARGET AUDIENCE: ${funnel.audience}
NICHE: ${funnel.niche}

== PRODUCT 1: UPSELL 1 ($${upsell1?.price || '47'}) ==
Name: "${upsell1?.name}"
Format: ${upsell1?.format || 'Comprehensive system'}
TLDR (use as source of truth):
${JSON.stringify(tldrData?.upsell_1_tldr, null, 2) || 'No TLDR available'}

== PRODUCT 2: UPSELL 2 ($${upsell2?.price || '97'}) ==
Name: "${upsell2?.name}"
Format: ${upsell2?.format || 'Complete automation'}
TLDR (use as source of truth):
${JSON.stringify(tldrData?.upsell_2_tldr, null, 2) || 'No TLDR available'}

== MANIFESTABLE DESCRIPTION FRAMEWORK FOR marketplace_description ==

For EACH PREMIUM product, create a description with these 6 sections:

[SECTION 1: EMOTIONAL HOOK - 2 paragraphs]
Open with a question about their pain point (use TLDR "problem_solved" field).
Acknowledge their struggle with empathy ("It's not your fault").
Position this PREMIUM product as the complete solution designed specifically for them.
Emphasize the comprehensive/premium nature of this higher-ticket product.

━━━━━━━━━━

[SECTION 2: WHY YOU'LL LOVE THIS - 5 bullets]
𝗪𝗵𝘆 𝗬𝗼𝘂'𝗹𝗹 𝗟𝗼𝘃𝗲 𝗧𝗵𝗶𝘀 [Product Name]:

✓ [Transformation statement - use TLDR benefits, emphasize premium value]
✓ [Outcome-focused benefit]
✓ [Outcome-focused benefit]
✓ [Outcome-focused benefit]
✓ [Outcome-focused benefit]

━━━━━━━━━━

[SECTION 3: WHAT'S INSIDE - 6-8 bullets]
𝗪𝗵𝗮𝘁'𝘀 𝗜𝗻𝘀𝗶𝗱𝗲:

✓ [Specific feature from TLDR with brief explanation]
✓ [Feature with brief explanation]
✓ [Feature with brief explanation]
✓ [Feature with brief explanation]
✓ [Feature with brief explanation]
✓ [Feature with brief explanation]
✓ Instant digital download

━━━━━━━━━━

[SECTION 4: WHO THIS IS FOR - 1 paragraph]
𝗣𝗲𝗿𝗳𝗲𝗰𝘁 𝗳𝗼𝗿 [use TLDR "who_its_for" field - emphasize those ready for a complete/premium solution].

━━━━━━━━━━

[SECTION 5: WHAT YOU'LL RECEIVE]
𝗪𝗛𝗔𝗧 𝗬𝗢𝗨'𝗟𝗟 𝗥𝗘𝗖𝗘𝗜𝗩𝗘:

✓ 1 PDF [Product Name]

━━━━━━━━━━

[SECTION 6: LEGAL/TERMS]
𝗣𝗟𝗘𝗔𝗦𝗘 𝗡𝗢𝗧𝗘: This is a digital product. No physical items will be shipped.
𝗧𝗘𝗥𝗠𝗦 𝗢𝗙 𝗦𝗘𝗥𝗩𝗜𝗖𝗘: Due to the digital nature of this product, all sales are final.
This product is for PERSONAL USE ONLY.
Copyright 2026. All rights reserved.

== CRITICAL FORMATTING RULES ==

1. Use Unicode bold characters (𝗔-𝗭, 𝗮-𝘇, 𝟬-𝟵) for section headers only

2. Use ━━━━━━━━━━ as section dividers

3. NO markdown ** symbols - they show as raw text on Etsy/Gumroad

4. Use ✓ checkmarks for all bullet points

5. CRITICAL - BULLET POINT FORMATTING:
   Each bullet point MUST be on its own line with a newline character between them.
   WRONG: "✓ Item 1 ✓ Item 2 ✓ Item 3" (all on one line)
   CORRECT:
   "✓ Item 1
   ✓ Item 2
   ✓ Item 3"

6. CRITICAL - SECTION HEADER FORMATTING:
   After each section header, use TWO newlines before bullets (for proper UI rendering).
   WRONG: "𝗪𝗵𝗮𝘁'𝘀 𝗜𝗻𝘀𝗶𝗱𝗲:\n✓ Item 1" (single newline)
   CORRECT: "𝗪𝗵𝗮𝘁'𝘀 𝗜𝗻𝘀𝗶𝗱𝗲:\n\n✓ Item 1" (double newline)

7. Emphasize PREMIUM value - these are higher-ticket products

== OUTPUT FORMAT ==

marketplace_title: SEO keyword-stuffed title (MAX 140 characters)
Fill ALL 140 characters with searchable keyword phrases separated by |

KEYWORD STRATEGY (for premium/upsell products):
1. Lead with the product's core topic as a searchable phrase
2. Add synonyms and topic variations people search for
3. Add premium format terms (Complete Guide, Strategy System, Master Class, Toolkit)
4. Add audience/niche keywords (Small Business, Entrepreneur, Coach)

RULES:
- NEVER use "Digital Download"
- NEVER use generic labels alone
- Every phrase must be something a buyer would search on Etsy

EXAMPLE: "Content Marketing System | Social Media Strategy Guide | Business Growth Toolkit | Entrepreneur Resources | Online Marketing | Sales Funnel"

marketplace_bullets: Array of 4-6 short items for display card
- Format: ["Deliverable 1", "Deliverable 2", ...]
- Emphasize completeness and premium value
- No benefits here, just scannable items

marketplace_tags: Array of EXACTLY 13 tags (each MAX 20 chars)

MANDATORY TAG STRUCTURE:
1. "digital download" (REQUIRED - always include this exact tag)
2. "instant pdf" OR "pdf template" OR "printable" (REQUIRED - pick one)
3-5. Three FORMAT tags (complete system, blueprint, master guide, etc.)
6-8. Three NICHE tags (online business, marketing, social media, etc.)
9-11. Three BENEFIT tags (business growth, revenue system, etc.)
12-13. Two AUDIENCE tags (coach, consultant, entrepreneur, etc.)

EXAMPLE: ["digital download", "instant pdf", "complete system", "business blueprint", "strategy guide", "online business", "entrepreneur", "marketing", "business growth", "revenue system", "passive income", "coach", "consultant"]

CRITICAL:
- Tag #1 MUST be "digital download"
- Tag #2 MUST be a platform tag
- All 13 slots filled, each ≤20 chars, no duplicates

Output 2 JSON objects separated by ${SECTION_SEPARATOR}:
{"marketplace_title":"...","marketplace_description":"...","marketplace_bullets":[...],"marketplace_tags":[...]}
${SECTION_SEPARATOR}
{"marketplace_title":"...","marketplace_description":"...","marketplace_bullets":[...],"marketplace_tags":[...]}${getLanguagePromptSuffix(funnel.language)}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 12000,
    system: MARKETPLACE_SYSTEM + `\n\nOutput exactly 2 JSON objects separated by ===SECTION_BREAK===. Raw JSON only, no markdown code blocks.${getLanguagePromptSuffix(funnel.language)}`,
    messages: [{ role: 'user', content: prompt }]
  });

  // Use safe section parsing with validation
  const sections = safeParseSections(response.content[0].text, 2, 'MarketplaceBatch2');
  const listings = sections.map(s => {
    const parsed = parseClaudeJSON(s);
    // Fix bullet newlines in marketplace_description
    if (parsed.marketplace_description) {
      parsed.marketplace_description = fixBulletNewlines(parsed.marketplace_description);
    }
    return parsed;
  });

  // Save marketplace listings to funnel's JSONB columns
  await supabase.from('funnels').update({
    upsell_1: { ...funnel.upsell_1, marketplace_listing: listings[0] },
    upsell_2: { ...funnel.upsell_2, marketplace_listing: listings[1] },
    updated_at: new Date().toISOString()
  }).eq('id', funnelId);

  console.log(`✅ ${LOG_TAG} Marketplace batch 2 saved to funnel JSONB (2 listings)`);

  // Log RAG metrics
  await logRagForBatchedGen(funnelId, funnel, 'marketplace-batch2', ragMetrics);

  return listings;
}

// Task 13: All Emails (6 total)
export async function generateAllEmails(funnelId) {
  console.log(`📝 ${LOG_TAG} Task 13: Generating all 6 emails in 1 batched call`);

  const funnel = await getFunnelData(funnelId);
  const { lead_magnet, frontend, profile } = funnel;

  // Extract first name from profile (first word of name)
  const creatorFirstName = profile?.name?.split(' ')[0] || 'Your Friend';
  console.log(`📝 ${LOG_TAG} Creator first name for emails: ${creatorFirstName}`);

  const { context: knowledge, metrics: ragMetrics } = await searchKnowledgeWithMetrics(`${funnel.audience} email sequences nurture sales`, {
    limit: 40,
    threshold: 0.3,
    sourceFunction: 'batched-generators'
  });

  const prompt = `${knowledge}

Generate EMAIL SEQUENCES for lead magnet nurture + front-end sales.

CREATOR NAME: ${creatorFirstName}
AUDIENCE: ${funnel.audience}
NICHE: ${funnel.niche}

LEAD MAGNET: "${lead_magnet?.name || 'Lead Magnet'}"
FRONT-END PRODUCT: "${frontend?.name || 'Front-End Product'}"
FRONT-END PRODUCT URL: ${funnel.front_end_link || '[PRODUCT_URL]'}

Generate 6 sections separated by: ${SECTION_SEPARATOR}

LEAD MAGNET SEQUENCE (3 emails):
- Email 1: Welcome + deliver lead magnet (warm, helpful)
- Email 2: Value-add content + build trust (share insights)
- Email 3: Bridge to front-end offer (soft pitch)

FRONT-END SEQUENCE (3 emails):
- Email 4: Introduce front-end product (benefits focus)
- Email 5: Handle objections + social proof (overcome resistance)
- Email 6: Urgency + final CTA (close the sale)

IMPORTANT: Sign off all emails with the creator's name: "${creatorFirstName}"
Do NOT use placeholder names like "Maria" or generic sign-offs. Use the CREATOR NAME provided above.

IMPORTANT: When including links to the front-end product, use the ACTUAL URL provided above: ${funnel.front_end_link || '[PRODUCT_URL]'}
Do NOT use placeholder text like "[LINK]" or "[CLICK HERE]". Use the actual URL.

Each email JSON:
{
  "subject": "Compelling subject line",
  "preview_text": "Email preview text...",
  "body": "Full email body with clear structure and CTA..."
}

Output 6 JSON objects separated by ===SECTION_BREAK=== (no markdown, no headers, raw JSON only):

{"subject":"...","preview_text":"...","body":"..."}
===SECTION_BREAK===
{"subject":"...","preview_text":"...","body":"..."}
===SECTION_BREAK===
{"subject":"...","preview_text":"...","body":"..."}
===SECTION_BREAK===
{"subject":"...","preview_text":"...","body":"..."}
===SECTION_BREAK===
{"subject":"...","preview_text":"...","body":"..."}
===SECTION_BREAK===
{"subject":"...","preview_text":"...","body":"..."}${getLanguagePromptSuffix(funnel.language)}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    system: `Output exactly 6 JSON objects separated by ===SECTION_BREAK===. No markdown formatting. Raw JSON only.${getLanguagePromptSuffix(funnel.language)}`,
    messages: [{ role: 'user', content: prompt }]
  });

  // Use safe section parsing with validation
  const sections = safeParseSections(response.content[0].text, 6, 'AllEmails');

  // Get the product URL for placeholder replacement (front_end_link is a top-level column)
  const productUrl = funnel.front_end_link || '';

  const emails = sections.map(s => {
    const parsed = parseClaudeJSON(s);
    // Replace any remaining [LINK] or [PRODUCT_URL] placeholders with actual URL
    if (parsed.body && productUrl) {
      parsed.body = parsed.body
        .replace(/\[LINK\]/gi, productUrl)
        .replace(/\[PRODUCT_URL\]/gi, productUrl)
        .replace(/\[CLICK HERE\]/gi, productUrl)
        .replace(/\[URL\]/gi, productUrl);
    }
    return parsed;
  });

  // Save lead magnet emails to lead_magnets table if it exists
  if (lead_magnet?.id) {
    await supabase.from('lead_magnets').update({
      email_sequence: emails.slice(0, 3)
    }).eq('id', lead_magnet.id);
  }

  // Save front-end emails to funnel's JSONB column
  await supabase.from('funnels').update({
    front_end: { ...funnel.front_end, email_sequence: emails.slice(3, 6) },
    updated_at: new Date().toISOString()
  }).eq('id', funnelId);

  console.log(`✅ ${LOG_TAG} All 6 emails saved to funnel JSONB`);

  // Log RAG metrics
  await logRagForBatchedGen(funnelId, funnel, 'all-emails', ragMetrics);

  return emails;
}

// Task 14: Bundle Listing
// Uses enhanced framework with 7 sections for high-converting Etsy/Gumroad descriptions
export async function generateBundleListing(funnelId) {
  console.log(`📝 ${LOG_TAG} Task 14: Generating bundle listing for complete funnel`);

  const funnel = await getFunnelData(funnelId);
  const { lead_magnet, frontend, bump, upsell1, upsell2 } = funnel;
  const { context: knowledge, metrics: ragMetrics } = await searchKnowledgeWithMetrics(`${funnel.audience} complete bundle package`, {
    limit: 40,
    threshold: 0.3,
    sourceFunction: 'batched-generators'
  });

  // Get TLDRs for product context
  const { data: tldrData } = await supabase
    .from('funnels')
    .select('front_end_tldr, bump_tldr, upsell_1_tldr, upsell_2_tldr')
    .eq('id', funnelId)
    .single();

  const prompt = `${knowledge}

Generate an ENHANCED BUNDLE LISTING following this exact structure.

TARGET AUDIENCE: ${funnel.audience}
NICHE: ${funnel.niche}

THE 4 PAID PRODUCTS IN THIS BUNDLE (Lead Magnet is FREE, not included in bundle):

1. FRONT-END: "${frontend?.name || 'Front-End'}" ($${frontend?.price || 17})
   - Format: ${frontend?.format || 'Digital product'}
   - TLDR: ${JSON.stringify(tldrData?.front_end_tldr) || 'Entry-level product'}

2. BUMP: "${bump?.name || 'Bump'}" ($${bump?.price || 9})
   - Format: ${bump?.format || 'Quick-win resource'}
   - TLDR: ${JSON.stringify(tldrData?.bump_tldr) || 'Complementary add-on'}

3. UPSELL 1: "${upsell1?.name || 'Upsell 1'}" ($${upsell1?.price || 47})
   - Format: ${upsell1?.format || 'Comprehensive system'}
   - TLDR: ${JSON.stringify(tldrData?.upsell_1_tldr) || 'Premium upgrade'}

4. UPSELL 2: "${upsell2?.name || 'Upsell 2'}" ($${upsell2?.price || 97})
   - Format: ${upsell2?.format || 'Complete automation'}
   - TLDR: ${JSON.stringify(tldrData?.upsell_2_tldr) || 'Ultimate solution'}

== BUNDLE DESCRIPTION FRAMEWORK ==

Generate a description with ALL 7 SECTIONS (use line breaks between sections):

== UNICODE BOLD CHARACTERS (REQUIRED FOR PRODUCT NAMES AND HEADERS) ==
You MUST use Unicode bold for section headers and product names. This is how bold displays on Etsy/Gumroad.
Unicode bold alphabet: 𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭 𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇 𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵
DO NOT use markdown ** symbols - they show as raw text on marketplaces.

𝗦𝗘𝗖𝗧𝗜𝗢𝗡 𝟭 - 𝗪𝗛𝗔𝗧 𝗜𝗧 𝗜𝗦: (1 sentence)
Synthesize all 4 products into ONE combined outcome. Focus on the END RESULT.
Example: "The complete content-to-cash system that turns small audiences into consistent $100+ daily revenue..."

𝗦𝗘𝗖𝗧𝗜𝗢𝗡 𝟮 - 𝗪𝗛𝗢 𝗜𝗧'𝗦 𝗙𝗢𝗥: (1-2 sentences)
Specific person with situation + frustration + readiness for complete solution.

𝗦𝗘𝗖𝗧𝗜𝗢𝗡 𝟯 - 𝗣𝗥𝗢𝗕𝗟𝗘𝗠 𝗦𝗢𝗟𝗩𝗘𝗗: (1 sentence)
The ROOT emotional problem - describe the frustrating CYCLE they're stuck in.

𝗦𝗘𝗖𝗧𝗜𝗢𝗡 𝟰 - 𝗞𝗘𝗬 𝗕𝗘𝗡𝗘𝗙𝗜𝗧𝗦: (5-7 bullet points)
Transformation statements. Progress from awareness → action → results → freedom.
Format each on its own line:
• Transformation benefit 1
• Transformation benefit 2
• Transformation benefit 3

𝗦𝗘𝗖𝗧𝗜𝗢𝗡 𝟱 - 𝗪𝗛𝗔𝗧'𝗦 𝗜𝗡𝗦𝗜𝗗𝗘: (one block per product)
For EACH of the 4 products, use this structure:

𝗣𝗿𝗼𝗱𝘂𝗰𝘁 𝗡𝗮𝗺𝗲 (USE UNICODE BOLD FOR THE ACTUAL PRODUCT NAME)

[Unique problem framing - USE DIFFERENT ONE FOR EACH:]
- Product 1: "The wall every [audience] eventually hits: [problem]"
- Product 2: "Fixes the problem X% of [audience] have: [problem]"
- Product 3: "The thing nobody tells you when you start: [problem]"
- Product 4: "The trap you only discover after [time]: [problem]"

Then 3-4 deliverable bullets (each on its own line):
• 𝗗𝗲𝗹𝗶𝘃𝗲𝗿𝗮𝗯𝗹𝗲 so you can [benefit]
• 𝗗𝗲𝗹𝗶𝘃𝗲𝗿𝗮𝗯𝗹𝗲 so you can [benefit]

Use a line divider (--- or ━━━━━━━━━━) between products.

IMPORTANT: After the LAST product section, add a line divider (---) before Section 6.

𝗦𝗘𝗖𝗧𝗜𝗢𝗡 𝟲 - 𝗪𝗛𝗔𝗧 𝗬𝗢𝗨'𝗟𝗟 𝗕𝗘 𝗔𝗕𝗟𝗘 𝗧𝗢 𝗗𝗢 𝗔𝗙𝗧𝗘𝗥 𝗚𝗘𝗧𝗧𝗜𝗡𝗚 𝗧𝗛𝗜𝗦: (5-7 bullet points)
THIS SECTION IS REQUIRED - DO NOT SKIP IT.
Add line divider (---) before this section header, then the header, then the bullets.
Transformation statements showing life on the other side. Each on its own line:
• 𝗔𝗰𝘁𝗶𝗼𝗻 𝘁𝗵𝗲𝘆 𝗰𝗮𝗻 𝘁𝗮𝗸𝗲 result they'll achieve
• 𝗔𝗰𝘁𝗶𝗼𝗻 𝘁𝗵𝗲𝘆 𝗰𝗮𝗻 𝘁𝗮𝗸𝗲 result they'll achieve
• 𝗔𝗰𝘁𝗶𝗼𝗻 𝘁𝗵𝗲𝘆 𝗰𝗮𝗻 𝘁𝗮𝗸𝗲 result they'll achieve

𝗦𝗘𝗖𝗧𝗜𝗢𝗡 𝟳 - 𝗖𝗧𝗔: (1 line)
Short, action-oriented. Example: "Get the complete content-to-cash system"

== OUTPUT FORMAT ==

Return valid JSON:
{
  "bundle_title": "SEO-optimized title (max 140 chars)",
  "bundle_subtitle": "Short tagline",
  "bundle_description": "[The full 7-section description with proper line breaks - MUST include all 7 sections]",
  "bundle_bullets": ["Short what's included 1", "Short what's included 2", ...10-12 items],
  "bundle_tags": ["tag1", "tag2", ...5-7 SEO tags],
  "value_proposition": "2-3 sentences on why bundle > buying separately"
}

CRITICAL FORMATTING:
- Use Unicode bold (𝗔-𝗭) for product names and section headers - NO markdown ** symbols
- Each bullet point MUST be on its own line
- Include ALL 7 sections, especially Section 6 (What You'll Be Able To Do)${getLanguagePromptSuffix(funnel.language)}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 12000,
    system: `You are an expert Etsy/Gumroad marketplace copywriter. Output valid JSON only, no markdown code blocks.${getLanguagePromptSuffix(funnel.language)}`,
    messages: [{ role: 'user', content: prompt }]
  });

  const rawBundle = parseClaudeJSON(response.content[0].text);

  // Fix bullet newlines in bundle description
  if (rawBundle.bundle_description) {
    rawBundle.bundle_description = fixBulletNewlines(rawBundle.bundle_description);
  }

  // Calculate pricing from product prices
  const fePrice = parseFloat(frontend?.price) || 17;
  const bumpPrice = parseFloat(bump?.price) || 9;
  const u1Price = parseFloat(upsell1?.price) || 47;
  const u2Price = parseFloat(upsell2?.price) || 97;
  const totalPrice = fePrice + bumpPrice + u1Price + u2Price;
  const bundlePrice = Math.round(totalPrice * 0.45); // 55% discount
  const savings = totalPrice - bundlePrice;

  // Transform to match frontend expectations (BundlePreview.jsx)
  // Frontend expects: title, etsy_description, normal_description, tags (string), bundle_price, etc.
  const bundleListing = {
    title: rawBundle.bundle_title || '',
    etsy_description: rawBundle.bundle_description || '',
    normal_description: rawBundle.bundle_description || '',
    tags: Array.isArray(rawBundle.bundle_tags) ? rawBundle.bundle_tags.join(', ') : '',
    bundle_price: bundlePrice,
    total_individual_price: totalPrice,
    savings: savings,
    // Keep original fields for reference
    bundle_subtitle: rawBundle.bundle_subtitle || '',
    bundle_bullets: rawBundle.bundle_bullets || [],
    value_proposition: rawBundle.value_proposition || ''
  };

  // Save bundle listing to funnel with correct field names
  await supabase.from('funnels').update({
    bundle_listing: bundleListing,
    updated_at: new Date().toISOString()
  }).eq('id', funnelId);

  console.log(`✅ ${LOG_TAG} Bundle listing saved with pricing: $${bundlePrice} (was $${totalPrice}, save $${savings})`);

  // Log RAG metrics
  await logRagForBatchedGen(funnelId, funnel, 'bundle-listing', ragMetrics);

  return bundleListing;
}

// Export all generators as a map for orchestrator
export const generators = {
  lead_magnet_part_1: (funnelId) => generateLeadMagnetPart1(funnelId),
  lead_magnet_part_2: (funnelId) => generateLeadMagnetPart2(funnelId),
  frontend_part_1: (funnelId) => generateFrontendPart1(funnelId),
  frontend_part_2: (funnelId) => generateFrontendPart2(funnelId),
  bump_full: (funnelId) => generateBumpFull(funnelId),
  upsell1_part_1: (funnelId) => generateUpsell1Part1(funnelId),
  upsell1_part_2: (funnelId) => generateUpsell1Part2(funnelId),
  upsell2_part_1: (funnelId) => generateUpsell2Part1(funnelId),
  upsell2_part_2: (funnelId) => generateUpsell2Part2(funnelId),
  all_tldrs: (funnelId) => generateAllTldrs(funnelId),
  marketplace_batch_1: (funnelId) => generateMarketplaceBatch1(funnelId),
  marketplace_batch_2: (funnelId) => generateMarketplaceBatch2(funnelId),
  all_emails: (funnelId) => generateAllEmails(funnelId),
  bundle_listing: (funnelId) => generateBundleListing(funnelId)
};
