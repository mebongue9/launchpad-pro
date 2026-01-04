// /netlify/functions/generate-lead-magnet-content.js
// Generates full lead magnet content using Claude API
// Accepts lead magnet idea, profile, audience, and front-end product
// Now integrates with knowledge_chunks vector database for context
// RELEVANT FILES: src/prompts/lead-magnet-content.js, src/pages/LeadMagnetBuilder.jsx

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

// Search knowledge base for relevant content
async function searchKnowledge(query, limit = 8) {
  // Skip if OpenAI API key is not configured
  if (!process.env.OPENAI_API_KEY) {
    console.log('Skipping knowledge search - OPENAI_API_KEY not configured');
    return '';
  }

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
      'Use this as your primary source for content. Match the voice, examples, and terminology exactly:\n\n' +
      results.map((r, i) => `[${i + 1}] ${r.content}`).join('\n\n---\n\n') +
      '\n=== END KNOWLEDGE ===\n';
  } catch (err) {
    console.error('Knowledge search error:', err);
    return '';
  }
}

const LEAD_MAGNET_CONTENT_PROMPT = `
You are a lead magnet content writer. You create high-value free content that naturally leads to paid products.

## YOUR MISSION

Write the complete lead magnet content that:
1. Delivers immediate value
2. Builds trust and authority
3. Creates desire for the front-end product
4. Includes a natural bridge (NOT a hard sell)

## LEAD MAGNET STRUCTURE

1. **Cover**: Title, subtitle, author
2. **Chapters 2-6**: Value content (actual tips, frameworks, secrets)
3. **Bridge Chapter**: Summarizes learnings, introduces next step
4. **CTA**: Clear call-to-action with product link

## OUTPUT FORMAT

Respond with ONLY valid JSON:

{
  "title": "Lead Magnet Title",
  "subtitle": "Compelling subtitle",
  "keyword": "KEYWORD",
  "sections": [
    {
      "type": "cover",
      "title": "Title",
      "subtitle": "Subtitle",
      "author": "By [Name]",
      "tagline": "[Tagline]"
    },
    {
      "type": "chapter",
      "number": 1,
      "title": "Chapter Title",
      "content": "Full content..."
    },
    {
      "type": "bridge",
      "title": "What Happens Next...",
      "content": "Bridge content..."
    },
    {
      "type": "cta",
      "title": "Ready to [Outcome]?",
      "product_name": "[Front-end Product Name]",
      "product_description": "Brief description",
      "button_text": "Get [Product] →",
      "link_placeholder": "[PRODUCT_LINK]",
      "price": "$17"
    }
  ],
  "promotion_kit": {
    "video_script": {
      "hook": "Opening line to grab attention",
      "value": "Key points to cover",
      "cta": "Call to action with keyword"
    },
    "captions": {
      "comment_version": "Caption with 'comment [KEYWORD] below'",
      "dm_version": "Caption with 'DM me [KEYWORD]'"
    },
    "keyword": "KEYWORD"
  }
}

## RULES

1. Chapters should be 200-300 words each
2. Total: 5-7 value chapters + bridge + CTA
3. Include specific, actionable content
4. Bridge must feel natural, not forced
5. ONLY output JSON, no other text
`;

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { lead_magnet, profile, audience, front_end_product } = JSON.parse(event.body);

    if (!lead_magnet || !profile || !front_end_product) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Lead magnet, profile, and front-end product are required' })
      };
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Search knowledge base for relevant content about this topic
    const searchQuery = `${lead_magnet.topic} ${lead_magnet.title} tips strategies how to`;
    const knowledgeContext = await searchKnowledge(searchQuery, 8);

    const userMessage = `
## LEAD MAGNET TO CREATE
Title: ${lead_magnet.title}
Format: ${lead_magnet.format}
Topic: ${lead_magnet.topic}
Keyword: ${lead_magnet.keyword}

## PROFILE (Creator)
Name: ${profile.name}
Business: ${profile.business_name || profile.name}
Tagline: ${profile.tagline || ''}

## AUDIENCE
Name: ${audience?.name || 'General audience'}
Pain Points: ${(audience?.pain_points || []).join(', ') || 'Not specified'}
Desires: ${(audience?.desires || []).join(', ') || 'Not specified'}

## FRONT-END PRODUCT (Bridge to this)
Name: ${front_end_product.name}
Price: $${front_end_product.price}
Description: ${front_end_product.description}
${knowledgeContext}

Generate the complete lead magnet content now. Use the creator's knowledge above for specific examples, tips, and terminology.
`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: LEAD_MAGNET_CONTENT_PROMPT,
      messages: [{ role: 'user', content: userMessage }]
    });

    const content = parseClaudeJSON(response.content[0].text);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content)
    };
  } catch (error) {
    console.error('Generate lead magnet content error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
}
