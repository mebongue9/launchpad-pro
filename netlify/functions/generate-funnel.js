// /netlify/functions/generate-funnel.js
// Generates funnel architecture using Claude API
// Accepts profile, audience, and optional existing product
// Integrates with knowledge_chunks vector database for context
// Logs RAG retrieval metrics to rag_retrieval_logs table for audit
// RELEVANT FILES: src/prompts/funnel-strategist.js, src/pages/FunnelBuilder.jsx

import Anthropic from '@anthropic-ai/sdk';
import { parseClaudeJSON } from './utils/sanitize-json.js';
import {
  searchKnowledgeWithMetrics,
  logRagRetrieval,
  getPreviousFunnelNamesWithMetrics
} from './lib/knowledge-search.js';

// Maria Wendt Format Performance Data (by average comments from 1,153 posts)
const FORMAT_PERFORMANCE = `
## FORMAT PERFORMANCE (by average engagement - PROVEN DATA)
1. Strategy/System: 1,729 avg - "my exact strategy for..."
2. ChatGPT Prompt: 1,429 avg - specific prompts for outcomes
3. Google Doc: 946 avg - collections, lists, resources
4. Checklist/Steps: 808 avg - X steps to achieve Y
5. Cheat Sheet: Quick reference one-pager
6. Swipe File: Ready-to-use templates
`;

const FUNNEL_STRATEGIST_PROMPT = `
You are an elite funnel strategist specializing in digital products for coaches and course creators. Your recommendations are based on PROVEN data from high-performing digital products and the Maria Wendt naming methodology.

## YOUR MISSION

Create a complete product funnel that:
1. Starts with an accessible entry point
2. Each product naturally leads to the next
3. No product cannibalizes another
4. Maximizes lifetime customer value
5. Uses SPECIFIC, COMPELLING product names that convert

${FORMAT_PERFORMANCE}

## PRODUCT NAMING - CRITICAL (Maria Wendt Methodology)

### SPECIFICITY FORMULA (REQUIRED FOR ALL PRODUCT NAMES)
[NUMBER] + [FORMAT] + [DESIRED OUTCOME] + [TIME/EFFORT QUALIFIER]

### GOOD Product Name Examples:
- "7 Welcome Sequences That Convert Cold Members to Buyers"
- "The 5-Minute Client Attraction Script"
- "12 High-Converting Email Templates for Course Launches"
- "The 3-Step Framework to $10K Months"
- "21 DM Scripts That Book Discovery Calls"
- "The 1-Page Content Calendar That Fills Your Pipeline"

### BAD Product Name Examples (NEVER USE THESE PATTERNS):
- "The Checklist That Works Well" - TOO VAGUE
- "Complete Marketing Guide" - NO SPECIFICITY
- "Business Growth System" - GENERIC
- "The Ultimate Toolkit" - NO OUTCOME
- "Success Blueprint" - MEANINGLESS

### NUMBER RULES:
- Use ODD numbers (3, 5, 7, 21) - they convert better
- Include timeframes when possible ("in 30 days", "5-minute")
- Specific outcomes beat vague promises ("$10K months" vs "more money")

## ANTI-CANNIBALIZATION PRINCIPLE

Critical: Each level must create desire for the next, not satisfy it.

- Front-end: SOLVE AN IMMEDIATE NEED (but incompletely)
- Bump: Make the front-end FASTER or EASIER
- Upsell 1: GO DEEPER on implementation
- Upsell 2: DONE-FOR-YOU or PREMIUM elements
- Upsell 3: TRANSFORMATION (coaching, community, or advanced system)

## PRICING GUIDELINES

- Front-End: $7-17 (impulse buy)
- Bump: $7-17 (no-brainer add-on)
- Upsell 1: $27-47 (invested buyer)
- Upsell 2: $47-97 (committed buyer)
- Upsell 3: $97-297 (serious buyer)

## PDF-ONLY FORMATS (Use these)
- Checklist (X Simple Steps to...)
- Cheat Sheet (The 1-Page Cheat Sheet)
- Blueprint (The Simple Blueprint)
- Swipe File (X Ready-to-Use Templates)
- Planner (The X-Day/Week Planner)
- Workbook (The X-Step Workbook)

## OUTPUT FORMAT

Respond with ONLY valid JSON in this exact structure:

{
  "funnel_name": "Descriptive name for this funnel",
  "front_end": {
    "name": "Product name using SPECIFICITY FORMULA",
    "format": "checklist|cheat sheet|blueprint|swipe file|planner|workbook",
    "price": 17,
    "description": "One sentence what they get",
    "bridges_to": "How this creates desire for the bump"
  },
  "bump": {
    "name": "Product name using SPECIFICITY FORMULA",
    "format": "format type",
    "price": 9,
    "description": "One sentence what they get",
    "bridges_to": "How this creates desire for upsell 1"
  },
  "upsell_1": {
    "name": "Product name using SPECIFICITY FORMULA",
    "format": "format type",
    "price": 47,
    "description": "One sentence what they get",
    "bridges_to": "How this creates desire for upsell 2"
  },
  "upsell_2": {
    "name": "Product name using SPECIFICITY FORMULA",
    "format": "format type",
    "price": 97,
    "description": "One sentence what they get",
    "bridges_to": "How this creates desire for upsell 3"
  },
  "upsell_3": {
    "name": "Product name using SPECIFICITY FORMULA OR existing product name",
    "format": "format type",
    "price": 197,
    "description": "One sentence what they get",
    "is_existing_product": false
  }
}

## RULES

1. ALL product names MUST use the SPECIFICITY FORMULA - no exceptions
2. Include NUMBERS in every product name (3, 5, 7, 21, etc.)
3. Include SPECIFIC OUTCOMES (not vague benefits)
4. Each product must logically lead to the next
5. If an existing product is provided, reverse-engineer the funnel to lead into it
6. Match the vibe/tone to the profile
7. Focus on the audience's specific pain points
8. ONLY output JSON, no other text
`;

export async function handler(event) {
  const LOG_TAG = '[GENERATE-FUNNEL]';
  console.log(LOG_TAG + ' Function invoked', { method: event.httpMethod });

  if (event.httpMethod !== 'POST') {
    console.log(LOG_TAG + ' Method not allowed:', event.httpMethod);
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Track metrics for RAG logging
  let ragMetrics = null;
  let freshnessCheck = { performed: false, count: 0, names: [] };
  let generationSuccessful = false;
  let errorMessage = null;

  try {
    const { profile, audience, existing_product, user_id } = JSON.parse(event.body);

    console.log(LOG_TAG + ' Received parameters:', {
      profile: profile?.name,
      profileBusiness: profile?.business_name,
      profileNiche: profile?.niche,
      audience: audience?.name,
      audiencePainPoints: audience?.pain_points?.length || 0,
      existingProduct: existing_product?.name || 'none',
      userId: user_id || 'not provided'
    });

    console.log(LOG_TAG + ' Environment check:', {
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });

    if (!profile || !audience) {
      console.log(LOG_TAG + ' Missing required fields: profile or audience');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Profile and audience are required' })
      };
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Freshness check: Get previous funnel product names (with metrics)
    freshnessCheck = await getPreviousFunnelNamesWithMetrics(user_id, 10);
    const freshnessContext = freshnessCheck.count > 0
      ? '\n\n## AVOID DUPLICATE NAMES\nThe user has already used these product names in previous funnels. Use DIFFERENT NAMES for the new products, but STAY WITHIN THE SAME NICHE (' + (profile.niche || 'as specified in the profile') + '):\n- ' + freshnessCheck.names.join('\n- ') + '\n\nUse fresh, unique product names while still serving the same audience and niche.'
      : '';

    // Search knowledge base for relevant content (with metrics)
    const searchQuery = (profile.niche || '') + ' ' + audience.name + ' ' + (audience.pain_points || []).join(' ') + ' funnel products digital';
    console.log(LOG_TAG + ' Searching knowledge base with query:', searchQuery.substring(0, 100) + '...');
    
    const { context: knowledgeContext, metrics } = await searchKnowledgeWithMetrics(searchQuery, {
      limit: 40,
      threshold: 0.3,
      sourceFunction: 'generate-funnel'
    });
    ragMetrics = metrics;
    
    console.log(LOG_TAG + ' Knowledge search complete:', {
      chunksRetrieved: metrics.chunksRetrieved,
      contextLength: metrics.knowledgeContextLength,
      contextPassed: metrics.knowledgeContextPassed,
      totalTimeMs: metrics.totalTimeMs
    });

    const userMessage = `
## PROFILE
Name: ${profile.name}
Business: ${profile.business_name || 'Not specified'}
Niche: ${profile.niche || 'Not specified'}
Income Method: ${profile.income_method || 'Not specified'}
Vibe: ${profile.vibe || 'Professional and approachable'}

## AUDIENCE
Name: ${audience.name}
Description: ${audience.description || 'Not specified'}
Pain Points: ${(audience.pain_points || []).join(', ') || 'Not specified'}
Desires: ${(audience.desires || []).join(', ') || 'Not specified'}

${existing_product ? `
## EXISTING PRODUCT (Final Upsell Destination)
Name: ${existing_product.name}
Price: $${existing_product.price}
Description: ${existing_product.description}
` : '## NO EXISTING PRODUCT - Create complete standalone funnel'}
${freshnessContext}
${knowledgeContext}

Generate the funnel architecture now. Remember:
- Use the SPECIFICITY FORMULA for ALL product names: [NUMBER] + [FORMAT] + [DESIRED OUTCOME]
- Include specific numbers (3, 5, 7, 21) in every product name
- NO generic names like "The Checklist That Works" - use specific outcomes
- Ground product ideas in the knowledge context above when available
`;

    console.log(LOG_TAG + ' Calling Claude API (claude-sonnet-4-20250514)...');
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: FUNNEL_STRATEGIST_PROMPT,
      messages: [{ role: 'user', content: userMessage }]
    });
    console.log(LOG_TAG + ' Claude API response received, tokens used:', response.usage?.output_tokens || 'unknown');

    console.log(LOG_TAG + ' Parsing Claude response...');
    const funnel = parseClaudeJSON(response.content[0].text);
    console.log(LOG_TAG + ' Funnel parsed successfully:', {
      funnelName: funnel.funnel_name,
      frontEnd: funnel.front_end?.name,
      bump: funnel.bump?.name,
      upsell1: funnel.upsell_1?.name,
      upsell2: funnel.upsell_2?.name,
      upsell3: funnel.upsell_3?.name || 'none'
    });

    generationSuccessful = true;

    // Log RAG retrieval to database for audit
    if (ragMetrics) {
      await logRagRetrieval({
        userId: user_id,
        profileId: profile?.id || null,
        audienceId: audience?.id || null,
        funnelId: null, // Funnel not saved yet at this point
        leadMagnetId: null,
        sourceFunction: 'generate-funnel',
        generationType: 'funnel',
        metrics: ragMetrics,
        freshnessCheck,
        generationSuccessful: true,
        errorMessage: null
      });
    }

    console.log(LOG_TAG + ' Function completed successfully');
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(funnel)
    };
  } catch (error) {
    console.error(LOG_TAG + ' Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      status: error.status || 'N/A'
    });

    errorMessage = error.message;

    // Log failed RAG retrieval for debugging
    if (ragMetrics) {
      await logRagRetrieval({
        userId: null,
        profileId: null,
        audienceId: null,
        funnelId: null,
        leadMagnetId: null,
        sourceFunction: 'generate-funnel',
        generationType: 'funnel',
        metrics: ragMetrics,
        freshnessCheck,
        generationSuccessful: false,
        errorMessage: error.message
      });
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
}
