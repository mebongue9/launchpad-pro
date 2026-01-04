// /netlify/functions/generate-content.js
// Generates full product content using Claude API
// Accepts product details, profile, audience, and funnel context
// RELEVANT FILES: src/prompts/product-builder.js, src/pages/FunnelBuilder.jsx

import Anthropic from '@anthropic-ai/sdk';
import { parseClaudeJSON } from './utils/sanitize-json.js';

const LOG_TAG = '[GENERATE-CONTENT]';

console.log(`🔧 ${LOG_TAG} Module loaded`);
console.log(`🔧 ${LOG_TAG} Environment check:`, {
  ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY
});

const PRODUCT_BUILDER_PROMPT = `
You are a product content creator specializing in digital products for coaches. You transform concepts into fully-written, actionable content.

## YOUR MISSION

Take a product concept and write the complete content. Focus on:
1. Actionable value (not fluff)
2. Clear structure
3. Natural bridge to the next offer

## CONTENT PHILOSOPHY

### Efficiency Over Length
- If 5 pages delivers the result, write 5 pages
- Concise, precise, actionable
- No padding

### Content Length Guidelines
- Front-End ($7-17): 8-15 pages
- Bump: 3-5 pages (shortcuts, templates)
- Upsells: 10-20 pages (deeper implementation)

### Voice and Tone
- Conversational, direct, confident
- Use "I" and "you" language
- "Here's exactly what I do..."

## OUTPUT FORMAT

Respond with ONLY valid JSON:

{
  "title": "Product Title",
  "subtitle": "Compelling subtitle",
  "sections": [
    {
      "type": "cover",
      "title": "Product Title",
      "subtitle": "Subtitle",
      "author": "By [Creator Name]",
      "tagline": "[Their tagline]"
    },
    {
      "type": "introduction",
      "title": "Introduction Title",
      "content": "Full introduction text..."
    },
    {
      "type": "chapter",
      "number": 1,
      "title": "Chapter Title",
      "content": "Full chapter content..."
    },
    {
      "type": "bridge",
      "title": "What's Next",
      "content": "Bridge content that creates desire for next product..."
    },
    {
      "type": "cta",
      "title": "Ready for [Next Product]?",
      "content": "CTA content...",
      "button_text": "Get [Next Product] →",
      "link_placeholder": "[PRODUCT_LINK]"
    }
  ]
}

## RULES

1. Write COMPLETE content, not outlines
2. Each chapter should be 200-400 words
3. Include specific, actionable steps
4. Bridge section must create desire without being salesy
5. ONLY output JSON, no other text
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
    const { product, profile, audience, next_product } = JSON.parse(event.body);

    console.log(`📥 ${LOG_TAG} Received parameters:`, {
      product: product ? {
        name: product.name,
        format: product.format,
        price: product.price
      } : null,
      profile: profile ? { id: profile.id, name: profile.name } : null,
      audience: audience ? { name: audience.name } : null,
      next_product: next_product ? { name: next_product.name, price: next_product.price } : null
    });

    if (!product || !profile) {
      console.log(`❌ ${LOG_TAG} Missing required fields:`, {
        product: !!product,
        profile: !!profile
      });
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Product and profile are required' })
      };
    }

    console.log(`🔧 ${LOG_TAG} Initializing Anthropic client...`);
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const userMessage = `
## PRODUCT TO CREATE
Name: ${product.name}
Format: ${product.format}
Price: $${product.price}
Description: ${product.description}

## PROFILE (Creator)
Name: ${profile.name}
Business: ${profile.business_name || profile.name}
Tagline: ${profile.tagline || ''}
Vibe: ${profile.vibe || 'Professional'}

## AUDIENCE
Name: ${audience?.name || 'General audience'}
Pain Points: ${(audience?.pain_points || []).join(', ') || 'Not specified'}
Desires: ${(audience?.desires || []).join(', ') || 'Not specified'}

## NEXT PRODUCT (Bridge to this)
${next_product ? `Name: ${next_product.name}\nPrice: $${next_product.price}\nDescription: ${next_product.description}` : 'No next product - this is the final offer'}

Generate the complete product content now.
`;

    console.log(`🔄 ${LOG_TAG} Calling Claude API to generate product content...`);
    console.log(`🔄 ${LOG_TAG} Using model: claude-sonnet-4-20250514, max_tokens: 8192`);
    console.log(`🔄 ${LOG_TAG} Product details: "${product.name}" at $${product.price}`);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: PRODUCT_BUILDER_PROMPT,
      messages: [{ role: 'user', content: userMessage }]
    });

    console.log(`✅ ${LOG_TAG} Claude API response received`);
    console.log(`📊 ${LOG_TAG} Response usage:`, {
      input_tokens: response.usage?.input_tokens,
      output_tokens: response.usage?.output_tokens
    });
    console.log(`📊 ${LOG_TAG} Response stop reason:`, response.stop_reason);

    console.log(`🔄 ${LOG_TAG} Parsing Claude response as JSON...`);
    const content = parseClaudeJSON(response.content[0].text);
    console.log(`✅ ${LOG_TAG} JSON parsed successfully`);
    console.log(`📊 ${LOG_TAG} Content structure:`, {
      title: content.title,
      subtitle: content.subtitle,
      sections_count: content.sections?.length || 0
    });

    // Log section types for debugging
    if (content.sections) {
      const sectionTypes = content.sections.map(s => s.type);
      console.log(`📊 ${LOG_TAG} Section types:`, sectionTypes);
    }

    console.log(`✅ ${LOG_TAG} Function completed successfully`);
    console.log(`📤 ${LOG_TAG} Returning product content with ${content.sections?.length || 0} sections`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content)
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
