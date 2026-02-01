// /netlify/functions/generate-marketplace-listings.js
// Generates Etsy/Gumroad-ready marketplace listings for funnel products
// Creates SEO-optimized titles, descriptions, and tags
// RELEVANT FILES: src/hooks/useMarketplaceListings.js, src/components/funnel/MarketplaceListings.jsx

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { parseClaudeJSON } from './utils/sanitize-json.js';

// Initialize clients
console.log('🔧 [MARKETPLACE] Initializing Supabase client...');
console.log('🔧 [MARKETPLACE] Environment check - SUPABASE_URL:', !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL));
console.log('🔧 [MARKETPLACE] Environment check - SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('🔧 [MARKETPLACE] Environment check - ANTHROPIC_API_KEY:', !!process.env.ANTHROPIC_API_KEY);

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

// Marketplace Listing System Prompt - Manifestable-proven Etsy SEO patterns
const MARKETPLACE_SYSTEM_PROMPT = `You are an expert Etsy and Gumroad marketplace listing copywriter specializing in digital products.

## TITLE FORMAT (MAX 140 chars)
Formula: [Product Name] | [Platform Keyword] | [Format Keyword] | [Benefit Keyword]

Platform Keywords (pick 1): Digital Download, Instant PDF, Printable, PDF Template
Format Keywords: Marketing Checklist, Business Worksheet, Strategy Blueprint, Quick Guide, Business Planner, Swipe File
Benefit Keywords: Lead Generation, Sales Funnel, Email Marketing, Content Strategy, Social Media, Online Business

CRITICAL: If 3 keywords exceed 140 chars, use only 2 keywords.

## DESCRIPTION - MANIFESTABLE FRAMEWORK (800-1200 chars)

CRITICAL FORMATTING: Each ✓ bullet MUST be on its own line. Use actual newline characters between bullets and sections.

[SECTION 1: EMOTIONAL HOOK]
Open with a question about their pain point.
Acknowledge their struggle with empathy.

[SECTION 2: WHY YOU'LL LOVE THIS - 5 bullets]
✓ Benefit 1
✓ Benefit 2
✓ Benefit 3
✓ Benefit 4
✓ Benefit 5

[SECTION 3: WHAT'S INSIDE - 6-8 bullets]
✓ Feature 1
✓ Feature 2
✓ Feature 3
✓ Feature 4
✓ Feature 5
✓ Feature 6
✓ Instant digital download

[SECTION 4: WHO THIS IS FOR]
Perfect for [specific audience].

[SECTION 5: WHAT YOU'LL RECEIVE]
✓ 1 PDF [Product Name]

[SECTION 6: LEGAL/TERMS]
PLEASE NOTE: Digital product. No physical items shipped.
TERMS: All sales final. Personal use only.

## TAGS: EXACTLY 13 tags (each MAX 20 chars)
Tag Framework:
- 3 format tags: checklist, worksheet, template
- 3 niche tags: online business, entrepreneur, marketing
- 3 benefit tags: lead generation, sales funnel, email list
- 2 platform tags: digital download, instant pdf
- 2 audience tags: coach, consultant, course creator

## OUTPUT REQUIREMENTS
Return ONLY valid JSON. No markdown, no code blocks.
All text must be within character limits.`;

// Generate marketplace listing for a single product
async function generateProductListing(product, profile, audience, language, productLevel) {
  console.log('🔄 [MARKETPLACE] Generating listing for product:', product.name);
  console.log('📋 [MARKETPLACE] Product format:', product.format, '| Price: $' + product.price);
  console.log('📋 [MARKETPLACE] Product level:', productLevel);

  const prompt = `
Create marketplace listings for this digital product using the Manifestable framework:

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
  "marketplace_title": "SEO title using formula: [Product Name] | [Platform Keyword] | [Format Keyword] | [Benefit Keyword] (MAX 140 chars - use only 2 keywords if 3 exceeds limit)",
  "marketplace_description": "Manifestable-style description (800-1200 chars) with: Emotional hook question, Why You'll Love This (5 checkmark bullets), What's Inside (6-8 checkmark bullets), Perfect for [audience], What You'll Receive, Legal/Terms",
  "marketplace_tags": "tag1, tag2, tag3, tag4, tag5, tag6, tag7, tag8, tag9, tag10, tag11, tag12, tag13"
}

TAG FRAMEWORK (fill all 13 slots):
- 3 format tags: checklist, worksheet, template, etc.
- 3 niche tags: online business, entrepreneur, marketing
- 3 benefit tags: lead generation, sales funnel, email list
- 2 platform tags: digital download, instant pdf
- 2 audience tags: coach, consultant, course creator

CRITICAL:
- Title MUST be under 140 characters (use 2 keywords if 3 exceeds limit)
- Tags MUST be exactly 13, each under 20 characters
- Tags separated by commas
- No duplicate tags
${getLanguagePromptSuffix(language)}`;

  try {
    console.log('🔄 [MARKETPLACE] Calling Claude API for listing generation...');
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: MARKETPLACE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }]
    });
    console.log('✅ [MARKETPLACE] Claude API response received');

    console.log('🔄 [MARKETPLACE] Parsing Claude response...');
    const listing = parseClaudeJSON(response.content[0].text);
    console.log('✅ [MARKETPLACE] Response parsed successfully');

    // Validate and trim if needed
    if (listing.marketplace_title && listing.marketplace_title.length > 140) {
      console.log('⚠️ [MARKETPLACE] Title too long (' + listing.marketplace_title.length + ' chars), trimming to 140...');
      listing.marketplace_title = listing.marketplace_title.substring(0, 137) + '...';
    }
    console.log('📋 [MARKETPLACE] Title length:', listing.marketplace_title?.length, 'chars');

    // Ensure exactly 13 tags
    if (listing.marketplace_tags) {
      const tags = listing.marketplace_tags.split(',').map(t => t.trim()).slice(0, 13);
      const originalCount = tags.length;
      while (tags.length < 13) {
        tags.push('digital download');
      }
      if (originalCount < 13) {
        console.log('⚠️ [MARKETPLACE] Only', originalCount, 'tags generated, padded to 13');
      }
      listing.marketplace_tags = tags.join(', ');
      console.log('📋 [MARKETPLACE] Final tag count: 13');
    }

    console.log('✅ [MARKETPLACE] Listing generated for:', product.name);
    return listing;
  } catch (error) {
    console.error('❌ [MARKETPLACE] Listing generation failed for product:', product.name);
    console.error('❌ [MARKETPLACE] Error:', error.message);
    console.error('❌ [MARKETPLACE] Error stack:', error.stack);
    throw error;
  }
}

export async function handler(event) {
  console.log('🚀 [MARKETPLACE] Function invoked');
  console.log('📥 [MARKETPLACE] HTTP method:', event.httpMethod);

  if (event.httpMethod !== 'POST') {
    console.log('❌ [MARKETPLACE] Method not allowed:', event.httpMethod);
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    console.log('📥 [MARKETPLACE] Parsing request body...');
    const { funnel_id, user_id, product_level, language = 'English' } = JSON.parse(event.body || '{}');
    console.log('📥 [MARKETPLACE] Received funnel_id:', funnel_id);
    console.log('📥 [MARKETPLACE] Received user_id:', user_id);
    console.log('📥 [MARKETPLACE] Received product_level:', product_level || 'all');
    console.log('📥 [MARKETPLACE] Received language:', language);

    if (!funnel_id || !user_id) {
      console.log('❌ [MARKETPLACE] Missing required parameters - funnel_id:', !!funnel_id, 'user_id:', !!user_id);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'funnel_id and user_id required' })
      };
    }

    console.log('🔄 [MARKETPLACE] Fetching funnel data from database...');
    // Get funnel data with related profile and audience - verify ownership
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('*, profiles(*), audiences(*)')
      .eq('id', funnel_id)
      .eq('user_id', user_id)
      .single();

    if (funnelError) {
      console.error('❌ [MARKETPLACE] Database error fetching funnel:', funnelError.message);
      console.error('❌ [MARKETPLACE] Error details:', JSON.stringify(funnelError));
    }

    if (funnelError || !funnel) {
      console.log('❌ [MARKETPLACE] Funnel not found or access denied for funnel_id:', funnel_id);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Funnel not found or access denied' })
      };
    }

    console.log('✅ [MARKETPLACE] Funnel loaded:', funnel.name);
    const profile = funnel.profiles || { name: 'Creator' };
    const audience = funnel.audiences;
    console.log('📋 [MARKETPLACE] Profile name:', profile.name);
    console.log('📋 [MARKETPLACE] Audience:', audience?.name || 'Not set');

    // Determine which products to generate listings for
    const productLevels = product_level
      ? [product_level]
      : ['front_end', 'bump', 'upsell_1', 'upsell_2'];
    console.log('📋 [MARKETPLACE] Product levels to process:', productLevels.join(', '));

    const updates = {};
    const results = {};
    let processedCount = 0;
    let skippedCount = 0;

    for (const level of productLevels) {
      const product = funnel[level];
      if (!product) {
        console.log('⏭️ [MARKETPLACE] Skipping', level, '- no product data');
        skippedCount++;
        continue;
      }

      console.log('🔄 [MARKETPLACE] Processing', level, ':', product.name);

      const listing = await generateProductListing(product, profile, audience, language, level);

      // Map to database columns (single description for both Etsy/Gumroad)
      updates[`${level}_marketplace_title`] = listing.marketplace_title;
      updates[`${level}_marketplace_description`] = listing.marketplace_description;
      updates[`${level}_marketplace_tags`] = listing.marketplace_tags;

      results[level] = listing;
      processedCount++;
      console.log('✅ [MARKETPLACE] Completed', level, '- Title:', listing.marketplace_title?.substring(0, 50) + '...');
    }

    console.log('📊 [MARKETPLACE] Summary: Processed', processedCount, 'products, Skipped', skippedCount);

    // Update funnel with marketplace data (verify ownership)
    console.log('🔄 [MARKETPLACE] Saving listings to database...');
    const { error: updateError } = await supabase
      .from('funnels')
      .update(updates)
      .eq('id', funnel_id)
      .eq('user_id', user_id);

    if (updateError) {
      console.error('❌ [MARKETPLACE] Failed to save marketplace listings:', updateError.message);
      console.error('❌ [MARKETPLACE] Update error details:', JSON.stringify(updateError));
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to save marketplace listings' })
      };
    }

    console.log('✅ [MARKETPLACE] Saved', Object.keys(results).length, 'listings to database');
    console.log('🏁 [MARKETPLACE] Function completed successfully for funnel:', funnel_id);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        listings: results
      })
    };

  } catch (error) {
    console.error('❌ [MARKETPLACE] Unhandled error:', error.message);
    console.error('❌ [MARKETPLACE] Error stack:', error.stack);
    console.error('❌ [MARKETPLACE] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
