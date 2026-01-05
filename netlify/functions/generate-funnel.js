// /netlify/functions/generate-funnel.js
// Generates funnel architecture using Claude API
// Accepts profile, audience, and optional existing product
// Now integrates with knowledge_chunks vector database for context
// RELEVANT FILES: src/prompts/funnel-strategist.js, src/pages/FunnelBuilder.jsx

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { parseClaudeJSON } from './utils/sanitize-json.js';

// Initialize clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Cosine similarity for vector search
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Fetch previous funnel product names to ensure freshness (no duplicate ideas)
async function getPreviousFunnelNames(userId, limit = 10) {
  console.log('🔄 [GENERATE-FUNNEL] Fetching previous funnel names for user:', userId);

  if (!userId) {
    console.log('⚠️ [GENERATE-FUNNEL] No user_id provided, skipping freshness check');
    return [];
  }

  try {
    const { data: funnels, error } = await supabase
      .from('funnels')
      .select('name, front_end, bump, upsell_1, upsell_2')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ [GENERATE-FUNNEL] Error fetching previous funnels:', error.message);
      return [];
    }

    if (!funnels || funnels.length === 0) {
      console.log('ℹ️ [GENERATE-FUNNEL] No previous funnels found');
      return [];
    }

    // Extract all product names from previous funnels
    const previousNames = [];
    funnels.forEach(funnel => {
      if (funnel.name) previousNames.push(funnel.name);
      if (funnel.front_end?.name) previousNames.push(funnel.front_end.name);
      if (funnel.bump?.name) previousNames.push(funnel.bump.name);
      if (funnel.upsell_1?.name) previousNames.push(funnel.upsell_1.name);
      if (funnel.upsell_2?.name) previousNames.push(funnel.upsell_2.name);
    });

    // Remove duplicates
    const uniqueNames = [...new Set(previousNames)];
    console.log('✅ [GENERATE-FUNNEL] Found', uniqueNames.length, 'previous product names to avoid');

    return uniqueNames;
  } catch (err) {
    console.error('❌ [GENERATE-FUNNEL] getPreviousFunnelNames error:', err.message);
    return [];
  }
}

// Search knowledge base for relevant content
async function searchKnowledge(query, limit = 5) {
  console.log('🔄 [GENERATE-FUNNEL] searchKnowledge called with limit:', limit);

  // Skip if OpenAI API key is not configured
  if (!process.env.OPENAI_API_KEY) {
    console.log('⚠️ [GENERATE-FUNNEL] Skipping knowledge search - OPENAI_API_KEY not configured');
    return '';
  }

  try {
    console.log('🔄 [GENERATE-FUNNEL] Creating embedding via OpenAI...');
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query
    });
    const queryVector = embedding.data[0].embedding;
    console.log('✅ [GENERATE-FUNNEL] Embedding created, vector length:', queryVector.length);

    console.log('🔄 [GENERATE-FUNNEL] Fetching knowledge chunks from Supabase...');
    const { data: chunks } = await supabase
      .from('knowledge_chunks')
      .select('id, content, embedding');

    if (!chunks || chunks.length === 0) {
      console.log('⚠️ [GENERATE-FUNNEL] No knowledge chunks found in database');
      return '';
    }
    console.log('✅ [GENERATE-FUNNEL] Retrieved', chunks.length, 'knowledge chunks');

    // Calculate ALL scores first for debugging
    const allScored = chunks.map(c => ({
      content: c.content,
      score: cosineSimilarity(queryVector, JSON.parse(c.embedding))
    }));

    // Sort by score descending
    allScored.sort((a, b) => b.score - a.score);

    // Log top 5 scores for debugging (regardless of threshold)
    console.log('📊 [GENERATE-FUNNEL] TOP 5 SIMILARITY SCORES (before filter):');
    allScored.slice(0, 5).forEach((r, i) => {
      console.log(`  [${i+1}] score=${r.score.toFixed(4)}, content="${r.content.substring(0, 60)}..."`);
    });

    // Take top results with similarity threshold
    const results = allScored.filter(r => r.score > 0.6).slice(0, limit);

    if (results.length === 0) {
      console.log('⚠️ [GENERATE-FUNNEL] No chunks matched with score > 0.6');
      console.log('⚠️ [GENERATE-FUNNEL] Best score was:', allScored[0]?.score?.toFixed(4));
      return '';
    }

    console.log('✅ [GENERATE-FUNNEL] Found', results.length, 'matching chunks, top score:', results[0]?.score?.toFixed(3));

    return '\n\n=== CREATOR\'S KNOWLEDGE & TEACHING STYLE ===\n' +
      results.map((r, i) => `[${i + 1}] ${r.content}`).join('\n\n') +
      '\n=== END KNOWLEDGE ===\n\nUse the above to match the creator\'s voice, terminology, and proven strategies.';
  } catch (err) {
    console.error('❌ [GENERATE-FUNNEL] Knowledge search error:', err.message);
    return '';
  }
}

const FUNNEL_STRATEGIST_PROMPT = `
You are an elite funnel strategist specializing in digital products for coaches and course creators. Your recommendations are based on proven conversion patterns and anti-cannibalization principles.

## YOUR MISSION

Create a complete product funnel that:
1. Starts with an accessible entry point
2. Each product naturally leads to the next
3. No product cannibalizes another
4. Maximizes lifetime customer value

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

## OUTPUT FORMAT

Respond with ONLY valid JSON in this exact structure:

{
  "funnel_name": "Descriptive name for this funnel",
  "front_end": {
    "name": "Product name with specificity",
    "format": "checklist|templates|guide|etc",
    "price": 17,
    "description": "One sentence what they get",
    "bridges_to": "How this creates desire for the bump"
  },
  "bump": {
    "name": "Product name",
    "format": "format type",
    "price": 9,
    "description": "One sentence what they get",
    "bridges_to": "How this creates desire for upsell 1"
  },
  "upsell_1": {
    "name": "Product name",
    "format": "format type",
    "price": 47,
    "description": "One sentence what they get",
    "bridges_to": "How this creates desire for upsell 2"
  },
  "upsell_2": {
    "name": "Product name",
    "format": "format type",
    "price": 97,
    "description": "One sentence what they get",
    "bridges_to": "How this creates desire for upsell 3"
  },
  "upsell_3": {
    "name": "Product name OR existing product name",
    "format": "format type",
    "price": 197,
    "description": "One sentence what they get",
    "is_existing_product": false
  }
}

## RULES

1. Names must be SPECIFIC (include numbers, outcomes, or timeframes)
2. Each product must logically lead to the next
3. If an existing product is provided, reverse-engineer the funnel to lead into it
4. Match the vibe/tone to the profile
5. Focus on the audience's specific pain points
6. ONLY output JSON, no other text
`;

export async function handler(event) {
  console.log('🚀 [GENERATE-FUNNEL] Function invoked', { method: event.httpMethod });

  if (event.httpMethod !== 'POST') {
    console.log('❌ [GENERATE-FUNNEL] Method not allowed:', event.httpMethod);
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { profile, audience, existing_product, user_id } = JSON.parse(event.body);

    console.log('📥 [GENERATE-FUNNEL] Received parameters:', {
      profile: profile?.name,
      profileBusiness: profile?.business_name,
      profileNiche: profile?.niche,
      audience: audience?.name,
      audiencePainPoints: audience?.pain_points?.length || 0,
      existingProduct: existing_product?.name || 'none',
      userId: user_id || 'not provided'
    });

    console.log('🔧 [GENERATE-FUNNEL] Environment check:', {
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });

    if (!profile || !audience) {
      console.log('❌ [GENERATE-FUNNEL] Missing required fields: profile or audience');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Profile and audience are required' })
      };
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Freshness check: Get previous funnel product names to avoid duplicate names
    const previousNames = await getPreviousFunnelNames(user_id, 10);
    const freshnessContext = previousNames.length > 0
      ? `\n\n## AVOID DUPLICATE NAMES\nThe user has already used these product names in previous funnels. Use DIFFERENT NAMES for the new products, but STAY WITHIN THE SAME NICHE (${profile.niche || 'as specified in the profile'}):\n- ${previousNames.join('\n- ')}\n\nUse fresh, unique product names while still serving the same audience and niche.`
      : '';

    // Search knowledge base for relevant content
    const searchQuery = `${profile.niche || ''} ${audience.name} ${(audience.pain_points || []).join(' ')} funnel products digital`;
    console.log('🔄 [GENERATE-FUNNEL] Searching knowledge base with query:', searchQuery.substring(0, 100) + '...');
    const knowledgeContext = await searchKnowledge(searchQuery, 5);
    console.log('✅ [GENERATE-FUNNEL] Knowledge search complete, context length:', knowledgeContext.length);

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

Generate the funnel architecture now.
`;

    console.log('🔄 [GENERATE-FUNNEL] Calling Claude API (claude-sonnet-4-20250514)...');
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: FUNNEL_STRATEGIST_PROMPT,
      messages: [{ role: 'user', content: userMessage }]
    });
    console.log('✅ [GENERATE-FUNNEL] Claude API response received, tokens used:', response.usage?.output_tokens || 'unknown');

    console.log('🔄 [GENERATE-FUNNEL] Parsing Claude response...');
    const funnel = parseClaudeJSON(response.content[0].text);
    console.log('✅ [GENERATE-FUNNEL] Funnel parsed successfully:', {
      funnelName: funnel.funnel_name,
      frontEnd: funnel.front_end?.name,
      bump: funnel.bump?.name,
      upsell1: funnel.upsell_1?.name,
      upsell2: funnel.upsell_2?.name,
      upsell3: funnel.upsell_3?.name || 'none'
    });

    console.log('✅ [GENERATE-FUNNEL] Function completed successfully');
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(funnel)
    };
  } catch (error) {
    console.error('❌ [GENERATE-FUNNEL] Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      status: error.status || 'N/A'
    });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
}
