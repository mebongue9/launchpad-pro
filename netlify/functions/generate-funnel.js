// /netlify/functions/generate-funnel.js
// Generates funnel architecture using Claude API
// Accepts profile, audience, and optional existing product
// Now integrates with knowledge_chunks vector database for context
// RELEVANT FILES: src/prompts/funnel-strategist.js, src/pages/FunnelBuilder.jsx

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

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

// Search knowledge base for relevant content
async function searchKnowledge(query, limit = 5) {
  try {
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query
    });
    const queryVector = embedding.data[0].embedding;

    const { data: chunks } = await supabase
      .from('knowledge_chunks')
      .select('id, content, embedding');

    if (!chunks || chunks.length === 0) return '';

    const results = chunks
      .map(c => ({ content: c.content, score: cosineSimilarity(queryVector, c.embedding) }))
      .filter(r => r.score > 0.6)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    if (results.length === 0) return '';

    return '\n\n=== CREATOR\'S KNOWLEDGE & TEACHING STYLE ===\n' +
      results.map((r, i) => `[${i + 1}] ${r.content}`).join('\n\n') +
      '\n=== END KNOWLEDGE ===\n\nUse the above to match the creator\'s voice, terminology, and proven strategies.';
  } catch (err) {
    console.error('Knowledge search error:', err);
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
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { profile, audience, existing_product } = JSON.parse(event.body);

    if (!profile || !audience) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Profile and audience are required' })
      };
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Search knowledge base for relevant content
    const searchQuery = `${profile.niche || ''} ${audience.name} ${(audience.pain_points || []).join(' ')} funnel products digital`;
    const knowledgeContext = await searchKnowledge(searchQuery, 5);

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
${knowledgeContext}

Generate the funnel architecture now.
`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: FUNNEL_STRATEGIST_PROMPT,
      messages: [{ role: 'user', content: userMessage }]
    });

    const jsonText = response.content[0].text;
    const funnel = JSON.parse(jsonText);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(funnel)
    };
  } catch (error) {
    console.error('Generate funnel error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
}
