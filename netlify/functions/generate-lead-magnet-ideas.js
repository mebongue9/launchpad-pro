// /netlify/functions/generate-lead-magnet-ideas.js
// Generates 3 lead magnet ideas using Claude API with vector grounding
// Uses Maria Wendt format performance data and PDF-only formats
// RELEVANT FILES: src/prompts/product-prompts.js, src/pages/LeadMagnetBuilder.jsx, vector-search.js

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { parseClaudeJSON } from './utils/sanitize-json.js';

const LOG_TAG = '[LEAD-MAGNET-IDEAS]';

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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Maria Wendt Format Performance Data (by average comments from 1,153 posts)
const FORMAT_PERFORMANCE = `
## FORMAT PERFORMANCE (by average comments - PROVEN DATA)
1. Strategy/System: 1,729 avg - "my exact strategy for..."
2. ChatGPT Prompt: 1,429 avg - specific prompts for outcomes
3. Google Doc: 946 avg - collections, lists, resources
4. Checklist/Steps: 808 avg - X steps to achieve Y
5. Cheat Sheet: Quick reference one-pager
`;

// PDF-Only Lead Magnet Strategist Prompt - SMALL = FAST RESULTS philosophy
const LEAD_MAGNET_STRATEGIST_PROMPT = `
You are an elite lead magnet strategist. Your recommendations are based on PROVEN data from 1,153 high-performing Instagram posts (Maria Wendt analysis).

## CORE PHILOSOPHY: SMALL = FAST RESULTS
People don't want to read 40+ pages. They want QUICK WINS.
- A 1-page guide is MORE appealing than a 50-page guide
- "Get results in 3 simple steps" beats "comprehensive 100-page manual"
- Short = Easy to consume = Higher completion rate = More desire for paid product

${FORMAT_PERFORMANCE}

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

// Calculate cosine similarity for vector search
function cosineSimilarity(a, b) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Search vector database for available knowledge topics
async function getAvailableKnowledgeTopics(profileId) {
  console.log(`🔍 ${LOG_TAG} Searching knowledge base for profile:`, profileId);

  try {
    // Get a broad query to find what topics exist in the knowledge base
    const query = "What topics, strategies, and teachings are available?";
    console.log(`🔄 ${LOG_TAG} Creating embedding for knowledge search...`);

    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query
    });
    console.log(`✅ ${LOG_TAG} Embedding created successfully`);

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Fetch chunks with embeddings
    console.log(`🔄 ${LOG_TAG} Fetching knowledge chunks from Supabase...`);
    const { data: chunks, error } = await supabase
      .from('knowledge_chunks')
      .select('id, content, metadata, embedding');

    if (error) {
      console.log(`⚠️ ${LOG_TAG} No knowledge chunks found or error:`, error);
      return [];
    }

    if (!chunks || chunks.length === 0) {
      console.log(`⚠️ ${LOG_TAG} No knowledge chunks available in database`);
      return [];
    }

    console.log(`📊 ${LOG_TAG} Found ${chunks.length} knowledge chunks, calculating similarities...`);

    // Calculate similarity and get top topics
    const results = chunks
      .filter(chunk => chunk.embedding) // Only chunks with embeddings
      .map(chunk => ({
        content: chunk.content,
        metadata: chunk.metadata,
        similarity: cosineSimilarity(queryEmbedding, JSON.parse(chunk.embedding))
      }))
      .filter(r => r.similarity >= 0.5)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 15); // Get top 15 relevant chunks

    console.log(`✅ ${LOG_TAG} Found ${results.length} relevant chunks with similarity >= 0.5`);

    // Extract unique topics from the chunks
    const topics = results.map(r => {
      // Extract a brief topic description from the content
      const firstLine = r.content.split('\n')[0].substring(0, 150);
      return firstLine;
    });

    return topics;
  } catch (err) {
    console.error(`❌ ${LOG_TAG} Vector search error:`, err.message);
    console.error(`❌ ${LOG_TAG} Full error:`, err);
    return [];
  }
}

export async function handler(event) {
  console.log(`🚀 ${LOG_TAG} Function invoked`);
  console.log(`📥 ${LOG_TAG} HTTP method:`, event.httpMethod);

  if (event.httpMethod !== 'POST') {
    console.log(`❌ ${LOG_TAG} Method not allowed:`, event.httpMethod);
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    console.log(`📥 ${LOG_TAG} Parsing request body...`);
    const { profile, audience, front_end_product, excluded_topics } = JSON.parse(event.body);

    console.log(`📥 ${LOG_TAG} Received parameters:`, {
      profile: profile ? { id: profile.id, name: profile.name, niche: profile.niche } : null,
      audience: audience ? { name: audience.name } : null,
      front_end_product: front_end_product ? { name: front_end_product.name, price: front_end_product.price } : null,
      excluded_topics: excluded_topics || []
    });

    if (!profile || !front_end_product) {
      console.log(`❌ ${LOG_TAG} Missing required fields - profile:`, !!profile, 'front_end_product:', !!front_end_product);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Profile and target product are required' })
      };
    }

    // Get available knowledge topics from vector database
    console.log(`🔄 ${LOG_TAG} Fetching knowledge topics from vector database...`);
    const knowledgeTopics = await getAvailableKnowledgeTopics(profile.id);
    console.log(`✅ ${LOG_TAG} Retrieved ${knowledgeTopics.length} knowledge topics`);

    // Build knowledge context
    let knowledgeContext = '';
    if (knowledgeTopics.length > 0) {
      knowledgeContext = `
## AVAILABLE KNOWLEDGE (Ground ideas in this - we have content to write about these topics)
${knowledgeTopics.map((t, i) => `${i + 1}. ${t}`).join('\n')}

IMPORTANT: Only suggest lead magnets on topics related to the knowledge above. We need actual content to write about.
`;
    } else {
      knowledgeContext = `
## KNOWLEDGE BASE
No specific knowledge chunks found. Generate ideas based on the profile's niche and audience needs.
`;
    }

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

${knowledgeContext}

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

    // Validate that all formats are PDF-friendly
    const pdfFormats = [
      'Strategy/System', 'Multi-Page Guide/PDF', 'Multi-Page Guide', 'PDF',
      'Checklist/Steps', 'Checklist', 'Steps', 'Google Doc',
      'Cheat Sheet', 'Swipe File', 'Blueprint', 'Workbook', 'Guide'
    ];

    if (ideas.ideas) {
      console.log(`🔄 ${LOG_TAG} Validating PDF formats for ${ideas.ideas.length} ideas...`);
      ideas.ideas = ideas.ideas.map((idea, index) => {
        // Warn if format doesn't match allowed list (but don't block)
        const formatLower = (idea.format || '').toLowerCase();
        const isValidFormat = pdfFormats.some(f => formatLower.includes(f.toLowerCase()));

        if (!isValidFormat) {
          console.warn(`⚠️ ${LOG_TAG} Idea ${index + 1}: Format "${idea.format}" may not be PDF-compatible`);
        } else {
          console.log(`✅ ${LOG_TAG} Idea ${index + 1}: "${idea.title}" - format valid`);
        }

        return idea;
      });
    }

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
