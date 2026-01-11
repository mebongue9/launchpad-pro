// /netlify/functions/generate-lead-magnet-ideas.js
// Generates 3 lead magnet ideas using Claude API with vector grounding
// Uses Maria Wendt format performance data and PDF-only formats
// RELEVANT FILES: src/prompts/product-prompts.js, src/pages/LeadMagnetBuilder.jsx, vector-search.js
// RAG FIX: Now using shared searchKnowledgeWithMetrics from ./lib/knowledge-search.js
// Threshold: 0.3, Limit: 20 chunks - consistent with all other generation functions

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { parseClaudeJSON } from './utils/sanitize-json.js';
import { searchKnowledgeWithMetrics, logRagRetrieval } from './lib/knowledge-search.js';

const LOG_TAG = '[LEAD-MAGNET-IDEAS]';

// Fetch previous lead magnet titles to ensure freshness (no duplicate ideas)
async function getPreviousLeadMagnetTitles(userId, limit = 10) {
  console.log(`🔄 ${LOG_TAG} Fetching previous lead magnet titles for user:`, userId);

  if (!userId) {
    console.log(`⚠️ ${LOG_TAG} No user_id provided, skipping freshness check`);
    return [];
  }

  try {
    const { data: leadMagnets, error } = await supabase
      .from('lead_magnets')
      .select('title, topic')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error(`❌ ${LOG_TAG} Error fetching previous lead magnets:`, error.message);
      return [];
    }

    if (!leadMagnets || leadMagnets.length === 0) {
      console.log(`ℹ️ ${LOG_TAG} No previous lead magnets found`);
      return [];
    }

    // Extract titles and topics from previous lead magnets
    const previousTitles = [];
    leadMagnets.forEach(lm => {
      if (lm.title) previousTitles.push(lm.title);
      if (lm.topic) previousTitles.push(lm.topic);
    });

    // Remove duplicates
    const uniqueTitles = [...new Set(previousTitles)];
    console.log(`✅ ${LOG_TAG} Found`, uniqueTitles.length, 'previous titles to avoid');

    return uniqueTitles;
  } catch (err) {
    console.error(`❌ ${LOG_TAG} getPreviousLeadMagnetTitles error:`, err.message);
    return [];
  }
}

// Initialize clients
console.log(`🔧 ${LOG_TAG} Initializing API clients...`);
console.log(`🔧 ${LOG_TAG} Environment check:`, {
  ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
  OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
  SUPABASE_URL: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
  SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// THE 6 APPROVED FORMATS - Data-proven from Maria Wendt's research
// These are the ONLY formats allowed. No others.
const APPROVED_FORMATS_TEXT = `
## APPROVED FORMATS (use ONLY these 6 - data-proven, no exceptions)
- Checklist: Step-by-step items to check off (X steps to achieve Y)
- Worksheet: Fill-in-the-blank exercises and reflection prompts
- Planner: Time-based organization (daily/weekly/monthly schedules)
- Swipe File: Ready-to-use templates and copy (emails, scripts, captions)
- Blueprint: Visual process/flowchart (phases and steps)
- Cheat Sheet: Quick reference, dense information (one-pager)

The lead magnet MUST use one of these 6 formats. Do NOT invent new formats.
Do NOT use: Strategy, System, Guide, Workbook, or any other format not listed above.
`;

// PDF-Only Lead Magnet Strategist Prompt - SMALL = FAST RESULTS philosophy
const LEAD_MAGNET_STRATEGIST_PROMPT = `
You are an elite lead magnet strategist. Your recommendations are based on PROVEN data from 1,153 high-performing Instagram posts (Maria Wendt analysis).

## CORE PHILOSOPHY: SMALL = FAST RESULTS
People don't want to read 40+ pages. They want QUICK WINS.
- A 1-page guide is MORE appealing than a 50-page guide
- "Get results in 3 simple steps" beats "comprehensive 100-page manual"
- Short = Easy to consume = Higher completion rate = More desire for paid product

${APPROVED_FORMATS_TEXT}

## LEAD MAGNET LENGTH (CRITICAL - FOLLOW EXACTLY)
Lead magnets MUST be SHORT and QUICK to consume:
- 1-5 pages MAXIMUM
- 3-7 steps/items MAXIMUM
- Can be consumed in 5-10 minutes

## PDF-ONLY FORMATS (Use ONLY these 6 - no exceptions)
- Checklist (X Simple Steps to...)
- Worksheet (Fill-in-the-blank exercises)
- Planner (The X-Day/Week Planner)
- Swipe File (X Ready-to-Use Templates)
- Blueprint (The Simple Blueprint)
- Cheat Sheet (The 1-Page Cheat Sheet)

## FORBIDDEN (NEVER suggest):
- Video courses, mini-courses, training modules
- Multi-page guides over 5 pages for a lead magnet
- "Comprehensive" or "Complete" guides - sounds like work
- Big numbers for LONG items (e.g., "50-Page Guide", "88 Full Templates")

## SPECIFICITY FORMULA (REQUIRED)
[NUMBER] + [FORMAT] + [DESIRED OUTCOME] + [TIME/EFFORT QUALIFIER]

## CRITICAL: NUMBER × ITEM LENGTH RULE
The number depends on what type of item it is:

**SHORT ITEMS (one-liners, few words each) = BIG numbers OK:**
- "100 Instagram Reel Ideas" ✓ (just 100 short lines - easy to scan)
- "50 Email Subject Lines" ✓ (50 short lines)
- "75 DM One-Liners That Get Replies" ✓ (75 short phrases)
- "100 Hooks for Your Content" ✓ (100 short hooks)
- "50 ChatGPT Prompts for Coaches" ✓ (each prompt is 1-2 lines)
- "365 Content Ideas" ✓ (just a list of short ideas)

**LONG ITEMS (pages, paragraphs, detailed content) = SMALL numbers only:**
- "The 3-Page Blueprint to Premium Pricing" ✓ (only 3 pages)
- "5 Email Templates That Convert" ✓ (5 detailed templates)
- "7 Scripts for Discovery Calls" ✓ (7 scripts)
- "The 1-Page Cheat Sheet" ✓ (single page)

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
`;

export async function handler(event) {
  console.log(`🚀 ${LOG_TAG} Function invoked`);
  console.log(`📥 ${LOG_TAG} HTTP method:`, event.httpMethod);

  if (event.httpMethod !== 'POST') {
    console.log(`❌ ${LOG_TAG} Method not allowed:`, event.httpMethod);
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    console.log(`📥 ${LOG_TAG} Parsing request body...`);
    const { profile, audience, front_end_product, excluded_topics, user_id, rag_limit } = JSON.parse(event.body);

    console.log(`📥 ${LOG_TAG} Received parameters:`, {
      profile: profile ? { id: profile.id, name: profile.name, niche: profile.niche } : null,
      audience: audience ? { name: audience.name } : null,
      front_end_product: front_end_product ? { name: front_end_product.name, price: front_end_product.price } : null,
      excluded_topics: excluded_topics || [],
      userId: user_id || 'not provided'
    });

    if (!profile || !front_end_product) {
      console.log(`❌ ${LOG_TAG} Missing required fields - profile:`, !!profile, 'front_end_product:', !!front_end_product);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Profile and target product are required' })
      };
    }

    // RAG FIX: Use shared searchKnowledgeWithMetrics with threshold 0.3 and limit 20
    console.log(`🔄 ${LOG_TAG} Fetching knowledge from vector database via shared RAG utility...`);
    const knowledgeQuery = `${profile.niche || ''} ${audience?.name || ''} lead magnet topics strategies teachings`;

    // rag_limit allows testing different chunk counts (default 40)
    const chunkLimit = rag_limit || 40;
    const { context: knowledgeContext, metrics: ragMetrics } = await searchKnowledgeWithMetrics(knowledgeQuery, {
      threshold: 0.3,
      limit: chunkLimit,
      sourceFunction: `generate-lead-magnet-ideas-${chunkLimit}chunks`
    });

    console.log(`✅ ${LOG_TAG} RAG search complete: ${ragMetrics.chunksRetrieved} chunks retrieved`);

    // Build knowledge section for prompt
    let knowledgeSection = '';
    if (knowledgeContext && ragMetrics.chunksRetrieved > 0) {
      knowledgeSection = `
## AVAILABLE KNOWLEDGE (Ground ideas in this - we have content to write about these topics)
${knowledgeContext}

IMPORTANT: Only suggest lead magnets on topics related to the knowledge above. We need actual content to write about.
`;
    } else {
      knowledgeSection = `
## KNOWLEDGE BASE
No specific knowledge chunks found. Generate ideas based on the profile's niche and audience needs.
`;
    }

    // Freshness check: Get previous lead magnet titles to avoid duplicates
    const previousTitles = await getPreviousLeadMagnetTitles(user_id, 10);
    const freshnessContext = previousTitles.length > 0
      ? `\n\n## AVOID DUPLICATE TITLES\nThe user has already created lead magnets with these titles. Use DIFFERENT TITLES but STAY WITHIN THE SAME NICHE (${profile.niche || 'as specified in the profile'}):\n- ${previousTitles.join('\n- ')}\n\nUse fresh, unique titles while still serving the same audience and niche.`
      : '';

    const userMessage = `
## PROFILE
Name: ${profile.name}
Business: ${profile.business_name || 'Not specified'}
Niche: ${profile.niche || 'Not specified'}

## AUDIENCE
${audience ? `Name: ${audience.name}
Pain Points: ${(audience.pain_points || []).join(', ') || 'Not specified'}
Desires: ${(audience.desires || []).join(', ') || 'Not specified'}` : 'General audience'}

## TARGET PRODUCT (Lead magnet should create desire for this)
Name: ${front_end_product.name}
Price: $${front_end_product.price}
Description: ${front_end_product.description || 'Not specified'}

## EXCLUDED TOPICS (Do NOT suggest these)
${(excluded_topics || []).join(', ') || 'None'}

${knowledgeSection}
${freshnessContext}

Generate 3 lead magnet ideas now. Remember:
- PDF ONLY formats (no video, no courses, no "hours")
- Use the specificity formula with numbers
- Ground ideas in available knowledge
- Each idea bridges to the target product
`;

    console.log(`🔄 ${LOG_TAG} Calling Claude API to generate ideas...`);
    console.log(`🔄 ${LOG_TAG} Using model: claude-sonnet-4-20250514`);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: LEAD_MAGNET_STRATEGIST_PROMPT,
      messages: [{ role: 'user', content: userMessage }]
    });

    console.log(`✅ ${LOG_TAG} Claude API response received`);
    console.log(`📊 ${LOG_TAG} Response usage:`, {
      input_tokens: response.usage?.input_tokens,
      output_tokens: response.usage?.output_tokens
    });

    console.log(`🔄 ${LOG_TAG} Parsing Claude response as JSON...`);
    const ideas = parseClaudeJSON(response.content[0].text);
    console.log(`✅ ${LOG_TAG} JSON parsed successfully, got ${ideas.ideas?.length || 0} ideas`);

    // Validate that all formats are from the 6 approved formats
    const approvedFormats = [
      'Checklist', 'Worksheet', 'Planner', 'Swipe File', 'Blueprint', 'Cheat Sheet'
    ];

    if (ideas.ideas) {
      console.log(`🔄 ${LOG_TAG} Validating formats for ${ideas.ideas.length} ideas...`);
      ideas.ideas = ideas.ideas.map((idea, index) => {
        // Warn if format doesn't match one of the 6 approved formats
        const formatLower = (idea.format || '').toLowerCase();
        const isValidFormat = approvedFormats.some(f => formatLower.includes(f.toLowerCase()));

        if (!isValidFormat) {
          console.warn(`⚠️ ${LOG_TAG} Idea ${index + 1}: Format "${idea.format}" is not an approved format`);
        } else {
          console.log(`✅ ${LOG_TAG} Idea ${index + 1}: "${idea.title}" - format valid`);
        }

        return idea;
      });
    }

    // RAG FIX: Log RAG retrieval metrics
    await logRagRetrieval({
      userId: user_id || null,
      profileId: profile?.id || null,
      audienceId: audience?.id || null,
      funnelId: null,
      leadMagnetId: null,
      sourceFunction: 'generate-lead-magnet-ideas',
      generationType: 'lead-magnet-ideas',
      metrics: ragMetrics,
      freshnessCheck: { performed: previousTitles.length > 0, count: previousTitles.length, names: previousTitles },
      generationSuccessful: true,
      errorMessage: null
    });

    console.log(`✅ ${LOG_TAG} Function completed successfully`);
    console.log(`📤 ${LOG_TAG} Returning ${ideas.ideas?.length || 0} lead magnet ideas`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ideas)
    };
  } catch (error) {
    console.error(`❌ ${LOG_TAG} Error occurred:`, error.message);
    console.error(`❌ ${LOG_TAG} Error stack:`, error.stack);
    console.error(`❌ ${LOG_TAG} Full error object:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
}
