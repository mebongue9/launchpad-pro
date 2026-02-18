// netlify/functions/process-funnel-idea-task-background.js
// Background function that processes funnel idea generation tasks
// Runs for up to 15 minutes, no timeout issues
// PART OF: Background funnel idea generation system
// RELEVANT FILES: create-funnel-idea-task.js, get-funnel-idea-task.js, generate-funnel.js

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { parseClaudeJSON } from './utils/sanitize-json.js';
import {
  searchKnowledgeWithMetrics,
  logRagRetrieval,
  getPreviousFunnelNamesWithMetrics
} from './lib/knowledge-search.js';
import { validateGeneratedTitles } from './utils/title-validator.js';

const LOG_TAG = '[PROCESS-FUNNEL-IDEA-TASK]';

// ============================================================
// PROMPTS (COPIED FROM generate-funnel.js - DO NOT MODIFY)
// ============================================================

const APPROVED_FORMATS_TEXT = `
## APPROVED FORMATS (use ONLY these 6 - data-proven, no exceptions)
- Checklist: Step-by-step items to check off (X steps to achieve Y)
- Worksheet: Fill-in-the-blank exercises and reflection prompts
- Planner: Time-based organization (daily/weekly/monthly schedules)
- Swipe File: Ready-to-use templates and copy (emails, scripts, captions)
- Blueprint: Visual process/flowchart (phases and steps)
- Cheat Sheet: Quick reference, dense information (one-pager)

Each product in the funnel MUST use one of these 6 formats. Do NOT invent new formats.
Do NOT use: Strategy, System, Guide, Workbook, or any other format not listed above.
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

${APPROVED_FORMATS_TEXT}

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

## PRICING GUIDELINES

- Front-End: $9.99 (impulse buy)
- Bump: $6.99 (no-brainer add-on)
- Upsell 1: $12.99 (invested buyer)
- Upsell 2: $19.99 (committed buyer)

## PDF-ONLY FORMATS (Use ONLY these 6 - no exceptions)
- Checklist (X Simple Steps to...)
- Worksheet (Fill-in-the-blank exercises)
- Planner (The X-Day/Week Planner)
- Swipe File (X Ready-to-Use Templates)
- Blueprint (The Simple Blueprint)
- Cheat Sheet (The 1-Page Cheat Sheet)

## OUTPUT FORMAT

Respond with ONLY valid JSON in this exact structure:

{
  "funnel_name": "Descriptive name for this funnel",
  "front_end": {
    "name": "Product name using SPECIFICITY FORMULA",
    "format": "Checklist|Worksheet|Planner|Swipe File|Blueprint|Cheat Sheet",
    "price": 9.99,
    "description": "One sentence what they get",
    "bridges_to": "How this creates desire for the bump"
  },
  "bump": {
    "name": "Product name using SPECIFICITY FORMULA",
    "format": "format type",
    "price": 6.99,
    "description": "One sentence what they get",
    "bridges_to": "How this creates desire for upsell 1"
  },
  "upsell_1": {
    "name": "Product name using SPECIFICITY FORMULA",
    "format": "format type",
    "price": 12.99,
    "description": "One sentence what they get",
    "bridges_to": "How this creates desire for upsell 2"
  },
  "upsell_2": {
    "name": "Product name using SPECIFICITY FORMULA",
    "format": "format type",
    "price": 19.99,
    "description": "One sentence what they get"
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

// ============================================================
// MAIN HANDLER
// ============================================================

export async function handler(event) {
  console.log(`${LOG_TAG} Background function invoked`);

  let taskId = null;
  let supabase = null;

  try {
    const body = JSON.parse(event.body || '{}');
    taskId = body.task_id;

    if (!taskId) {
      console.error(`${LOG_TAG} No task_id provided`);
      return { statusCode: 400, body: 'Missing task_id' };
    }

    console.log(`${LOG_TAG} Processing task: ${taskId}`);

    // Initialize Supabase
    supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Fetch the task
    const { data: task, error: fetchError } = await supabase
      .from('funnel_idea_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (fetchError || !task) {
      console.error(`${LOG_TAG} Task not found: ${taskId}`, fetchError);
      return { statusCode: 404, body: 'Task not found' };
    }

    console.log(`${LOG_TAG} Task fetched, status: ${task.status}`);

    // 2. Mark as processing
    await supabase
      .from('funnel_idea_tasks')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
        attempt_count: (task.attempt_count || 0) + 1,
        last_attempt_at: new Date().toISOString()
      })
      .eq('id', taskId);

    console.log(`${LOG_TAG} Task marked as processing`);

    // 3. Extract input data
    const { profile, audience, existing_product, user_id } = task.input_data;

    console.log(`${LOG_TAG} Input data:`, {
      profile: profile?.name,
      audience: audience?.name,
      existingProduct: existing_product?.name || 'none',
      userId: user_id || 'not provided'
    });

    // ============================================================
    // GENERATION LOGIC (COPIED FROM generate-funnel.js)
    // ============================================================

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Track metrics for RAG logging
    let ragMetrics = null;
    let freshnessCheck = { performed: false, count: 0, names: [] };

    // Freshness check: Get previous funnel product names
    freshnessCheck = await getPreviousFunnelNamesWithMetrics(user_id, 10);
    const freshnessContext = freshnessCheck.count > 0
      ? '\n\n## AVOID DUPLICATE NAMES\nThe user has already used these product names in previous funnels. Use DIFFERENT NAMES for the new products, but STAY WITHIN THE SAME NICHE (' + (profile.niche || 'as specified in the profile') + '):\n- ' + freshnessCheck.names.join('\n- ') + '\n\nUse fresh, unique product names while still serving the same audience and niche.'
      : '';

    console.log(`${LOG_TAG} Freshness check: ${freshnessCheck.count} previous names found`);

    // Search knowledge base for relevant content
    const searchQuery = (profile.niche || '') + ' ' + audience.name + ' ' + (audience.pain_points || []).join(' ') + ' funnel products digital';
    console.log(`${LOG_TAG} Searching knowledge base...`);

    const { context: knowledgeContext, metrics } = await searchKnowledgeWithMetrics(searchQuery, {
      limit: 40,
      threshold: 0.3,
      sourceFunction: 'process-funnel-idea-task-background'
    });
    ragMetrics = metrics;

    console.log(`${LOG_TAG} Knowledge search complete: ${metrics.chunksRetrieved} chunks`);

    // Build user message
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

    // Call Claude API
    console.log(`${LOG_TAG} Calling Claude API...`);
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: FUNNEL_STRATEGIST_PROMPT,
      messages: [{ role: 'user', content: userMessage }]
    });
    console.log(`${LOG_TAG} Claude API response received`);

    // Parse response
    const funnel = parseClaudeJSON(response.content[0].text);
    console.log(`${LOG_TAG} Funnel parsed: ${funnel.funnel_name}`);

    // DETERMINISTIC PRICE OVERRIDE — AI does not decide prices
    let pricingDefaults = { front_end: 9.99, bump: 6.99, upsell_1: 12.99, upsell_2: 19.99 };
    try {
      const { data: priceSettings } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', [
          'default_price_front_end',
          'default_price_bump',
          'default_price_upsell_1',
          'default_price_upsell_2'
        ]);
      if (priceSettings?.length > 0) {
        for (const row of priceSettings) {
          if (row.key === 'default_price_front_end') pricingDefaults.front_end = parseFloat(row.value) || 9.99;
          if (row.key === 'default_price_bump') pricingDefaults.bump = parseFloat(row.value) || 6.99;
          if (row.key === 'default_price_upsell_1') pricingDefaults.upsell_1 = parseFloat(row.value) || 12.99;
          if (row.key === 'default_price_upsell_2') pricingDefaults.upsell_2 = parseFloat(row.value) || 19.99;
        }
      }
    } catch (err) {
      console.error(`${LOG_TAG} Failed to load pricing defaults, using hardcoded fallbacks:`, err.message);
    }

    if (funnel.front_end) funnel.front_end.price = pricingDefaults.front_end;
    if (funnel.bump) funnel.bump.price = pricingDefaults.bump;
    if (funnel.upsell_1) funnel.upsell_1.price = pricingDefaults.upsell_1;
    if (funnel.upsell_2) funnel.upsell_2.price = pricingDefaults.upsell_2;

    console.log(`${LOG_TAG} Prices enforced from app_settings:`, pricingDefaults);

    // ============================================================
    // TITLE VALIDATION (NOW WE HAVE TIME!)
    // ============================================================

    console.log(`${LOG_TAG} Running title validation...`);

    // Extract all product titles
    const productTitles = [
      funnel.front_end?.name,
      funnel.bump?.name,
      funnel.upsell_1?.name,
      funnel.upsell_2?.name,
      funnel.upsell_3?.name
    ].filter(Boolean);

    // Validate titles against Maria Wendt formula and vector DB
    const validationResults = await validateGeneratedTitles(productTitles);

    console.log(`${LOG_TAG} Validation complete:`, validationResults.summary);

    // ============================================================
    // SAVE RESULTS
    // ============================================================

    // Log RAG retrieval for audit
    if (ragMetrics) {
      await logRagRetrieval({
        userId: user_id,
        profileId: profile?.id || null,
        audienceId: audience?.id || null,
        funnelId: null,
        leadMagnetId: null,
        sourceFunction: 'process-funnel-idea-task-background',
        generationType: 'funnel',
        metrics: ragMetrics,
        freshnessCheck,
        generationSuccessful: true,
        errorMessage: null
      });
    }

    // Update task with results
    await supabase
      .from('funnel_idea_tasks')
      .update({
        status: 'completed',
        output_data: funnel,
        validation_results: validationResults,
        completed_at: new Date().toISOString()
      })
      .eq('id', taskId);

    console.log(`${LOG_TAG} Task ${taskId} completed successfully`);
    return { statusCode: 200, body: 'OK' };

  } catch (error) {
    console.error(`${LOG_TAG} Task processing failed:`, error.message);

    // Update task with error
    if (taskId && supabase) {
      await supabase
        .from('funnel_idea_tasks')
        .update({
          status: 'failed',
          error_message: error.message
        })
        .eq('id', taskId);
    }

    return { statusCode: 500, body: error.message };
  }
}
