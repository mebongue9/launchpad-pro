// /netlify/functions/generate-lead-magnet-ideas.js
// Generates 3 lead magnet ideas using Claude API
// Accepts profile, audience, front-end product, and excluded topics
// RELEVANT FILES: src/prompts/lead-magnet-strategist.js, src/pages/LeadMagnetBuilder.jsx

import Anthropic from '@anthropic-ai/sdk';

const LEAD_MAGNET_STRATEGIST_PROMPT = `
You are an elite lead magnet strategist trained on high-performing Instagram content. Your recommendations drive maximum engagement and conversions.

## YOUR MISSION

Create 3 irresistible lead magnet concepts that:
1. Provide massive value upfront
2. Build desire for the front-end product
3. Are shareable and comment-worthy

## NAMING FORMULA

Always use: [SPECIFIC NUMBER] + [FORMAT] + [DESIRED OUTCOME] + [TIME/EFFORT QUALIFIER]

Examples:
- "365 Instagram Reel Ideas to Go Viral"
- "The 7-Day Launch Blueprint"
- "My Exact Strategy for 40 Reels in 2 Hours"

## OUTPUT FORMAT

Respond with ONLY valid JSON:

{
  "ideas": [
    {
      "title": "The 7-Day [Outcome] Blueprint",
      "format": "Multi-Page Guide",
      "topic": "Brief topic description",
      "keyword": "BLUEPRINT",
      "why_it_works": "Data-backed reasoning for this choice",
      "bridges_to_product": "How this leads to front-end product"
    },
    {
      "title": "Second option...",
      "format": "...",
      "topic": "...",
      "keyword": "...",
      "why_it_works": "...",
      "bridges_to_product": "..."
    },
    {
      "title": "Third option...",
      "format": "...",
      "topic": "...",
      "keyword": "...",
      "why_it_works": "...",
      "bridges_to_product": "..."
    }
  ]
}

## RULES

1. All 3 ideas must be DIFFERENT approaches
2. None can match excluded topics
3. All must logically lead to the front-end product
4. Each must have a memorable keyword
5. Names must include specific numbers
6. ONLY output JSON, no other text
`;

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { profile, audience, front_end_product, excluded_topics } = JSON.parse(event.body);

    if (!profile || !audience || !front_end_product) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Profile, audience, and front-end product are required' })
      };
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const userMessage = `
## PROFILE
Name: ${profile.name}
Business: ${profile.business_name || 'Not specified'}
Niche: ${profile.niche || 'Not specified'}

## AUDIENCE
Name: ${audience.name}
Pain Points: ${(audience.pain_points || []).join(', ') || 'Not specified'}
Desires: ${(audience.desires || []).join(', ') || 'Not specified'}

## FRONT-END PRODUCT (Lead magnet should lead to this)
Name: ${front_end_product.name}
Price: $${front_end_product.price}
Description: ${front_end_product.description}

## EXCLUDED TOPICS (Do NOT suggest these)
${(excluded_topics || []).join(', ') || 'None'}

Generate 3 lead magnet ideas now.
`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: LEAD_MAGNET_STRATEGIST_PROMPT,
      messages: [{ role: 'user', content: userMessage }]
    });

    const jsonText = response.content[0].text;
    const ideas = JSON.parse(jsonText);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ideas)
    };
  } catch (error) {
    console.error('Generate lead magnet ideas error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
}
