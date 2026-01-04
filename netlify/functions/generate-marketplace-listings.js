// /netlify/functions/generate-marketplace-listings.js
// Generates Etsy/Gumroad-ready marketplace listings for funnel products
// Creates SEO-optimized titles, descriptions, and tags
// RELEVANT FILES: src/hooks/useMarketplaceListings.js, src/components/funnel/MarketplaceListings.jsx

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { parseClaudeJSON } from './utils/sanitize-json.js';

// Initialize clients
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Language support
function getLanguagePromptSuffix(language) {
  if (!language || language === 'English') {
    return '';
  }
  return `
---
OUTPUT LANGUAGE: ${language}
All content must be written entirely in ${language}.
Do not include any English unless the user's language is English.
`;
}

// Marketplace Listing System Prompt
const MARKETPLACE_SYSTEM_PROMPT = `You are an expert Etsy and Gumroad marketplace listing copywriter.

## ETSY SEO REQUIREMENTS
1. **Title**: 140 characters MAX, front-load keywords
   - Format: [Main Keyword] | [Benefit] | [Format] | [Creator/Brand]
   - Use pipes (|) to separate sections
   - Include 3-4 keywords naturally

2. **Etsy Description**: 500-800 characters
   - Hook in first line
   - Key benefits (bullet points)
   - What's included
   - End with soft CTA

3. **Tags**: EXACTLY 13 tags
   - Each tag MAX 20 characters
   - Mix of specific and broad
   - Include format variations
   - No duplicate words across tags

## GUMROAD DESCRIPTION
1,500-2,500 characters
- More detailed than Etsy
- Include transformation/outcome
- Testimonial-style social proof (hypothetical)
- Clear deliverables list
- FAQ section (2-3 questions)
- CTA at the end

## OUTPUT REQUIREMENTS
Return ONLY valid JSON. No markdown, no code blocks.
All text must be within character limits.`;

// Generate marketplace listing for a single product
async function generateProductListing(product, profile, audience, language) {
  const prompt = `
Create marketplace listings for this digital product:

PRODUCT:
Name: ${product.name}
Format: ${product.format}
Price: $${product.price}
Description: ${product.description}

CREATOR: ${profile.name} (${profile.business_name || profile.name})
NICHE: ${profile.niche || 'Not specified'}

TARGET AUDIENCE: ${audience?.name || 'General'}
Pain Points: ${(audience?.pain_points || []).join(', ') || 'Not specified'}

Return JSON:
{
  "marketplace_title": "SEO title (MAX 140 chars)",
  "etsy_description": "Short description (500-800 chars)",
  "normal_description": "Long Gumroad description (1500-2500 chars)",
  "marketplace_tags": "tag1, tag2, tag3, tag4, tag5, tag6, tag7, tag8, tag9, tag10, tag11, tag12, tag13"
}

CRITICAL:
- Title MUST be under 140 characters
- Tags MUST be exactly 13, each under 20 characters
- Tags separated by commas
${getLanguagePromptSuffix(language)}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: MARKETPLACE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }]
    });

    const listing = parseClaudeJSON(response.content[0].text);

    // Validate and trim if needed
    if (listing.marketplace_title && listing.marketplace_title.length > 140) {
      listing.marketplace_title = listing.marketplace_title.substring(0, 137) + '...';
    }

    // Ensure exactly 13 tags
    if (listing.marketplace_tags) {
      const tags = listing.marketplace_tags.split(',').map(t => t.trim()).slice(0, 13);
      while (tags.length < 13) {
        tags.push('digital download');
      }
      listing.marketplace_tags = tags.join(', ');
    }

    return listing;
  } catch (error) {
    console.error('Listing generation failed:', error);
    throw error;
  }
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { funnel_id, user_id, product_level, language = 'English' } = JSON.parse(event.body || '{}');

    if (!funnel_id || !user_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'funnel_id and user_id required' })
      };
    }

    console.log(`[Marketplace] Generating for funnel: ${funnel_id}, product: ${product_level || 'all'}`);

    // Get funnel data with related profile and audience - verify ownership
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('*, profiles(*), audiences(*)')
      .eq('id', funnel_id)
      .eq('user_id', user_id)
      .single();

    if (funnelError || !funnel) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Funnel not found or access denied' })
      };
    }

    const profile = funnel.profiles || { name: 'Creator' };
    const audience = funnel.audiences;

    // Determine which products to generate listings for
    const productLevels = product_level
      ? [product_level]
      : ['front_end', 'bump', 'upsell_1', 'upsell_2'];

    const updates = {};
    const results = {};

    for (const level of productLevels) {
      const product = funnel[level];
      if (!product) continue;

      console.log(`[Marketplace] Generating listing for ${level}: ${product.name}`);

      const listing = await generateProductListing(product, profile, audience, language);

      // Map to database columns
      updates[`${level}_marketplace_title`] = listing.marketplace_title;
      updates[`${level}_etsy_description`] = listing.etsy_description;
      updates[`${level}_normal_description`] = listing.normal_description;
      updates[`${level}_marketplace_tags`] = listing.marketplace_tags;

      results[level] = listing;
    }

    // Update funnel with marketplace data (verify ownership)
    const { error: updateError } = await supabase
      .from('funnels')
      .update(updates)
      .eq('id', funnel_id)
      .eq('user_id', user_id);

    if (updateError) {
      console.error('Failed to save marketplace listings:', updateError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to save marketplace listings' })
      };
    }

    console.log(`[Marketplace] Generated ${Object.keys(results).length} listings for funnel ${funnel_id}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        listings: results
      })
    };

  } catch (error) {
    console.error('[Marketplace] Generation failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
