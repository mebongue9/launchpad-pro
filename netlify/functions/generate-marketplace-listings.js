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

## TITLE FORMAT (MAX 140 characters)
[Keyword 1] | [Keyword 2] | [Keyword 3] | [Keyword 4] | [Keyword 5] | [Keyword 6]

Fill ALL 140 characters with searchable keyword phrases separated by |

KEYWORD STRATEGY:
1. Lead with the product's core topic as a searchable phrase
2. Add synonyms and variations (different ways people search for this topic)
3. Add format-adjacent search terms (Guide, Planner, Template, Tracker, Workbook)
4. Add audience/niche keywords (Small Business, Entrepreneur, Coach, Creator)
5. Fill remaining characters with related search terms

RULES:
- NEVER use "Digital Download" in the title
- NEVER use generic standalone labels like "Checklist", "Swipe File", "Cheat Sheet"
- Every phrase must be something a buyer would type into Etsy search
- Use | as separator between keyword phrases
- Each keyword phrase should be 2-4 words
- Maximize unique searchable terms for discoverability

EXAMPLES:
Product: "9 Quick Posts That Turn 50 Views Into Your First $300" (Checklist)
Title: "Social Media Post Templates | Instagram Content Strategy | Small Business Marketing | Content Creator Guide | Engagement Tips | Reel Ideas"

Product: "The Complete FB Group Lead Machine" (Checklist)
Title: "Facebook Group Marketing | Lead Generation Guide | FB Group Growth | Social Media Strategy | Online Business | Community Building Tips"

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

## TAGS (EXACTLY 13 tags, each MAX 20 characters)

MANDATORY STRUCTURE:
1. "digital download" (REQUIRED - always include this exact tag)
2. "instant pdf" OR "pdf template" OR "printable" (REQUIRED - pick one)
3-5. Three FORMAT tags (checklist, worksheet, template, guide, etc.)
6-8. Three NICHE tags (online business, marketing, social media, etc.)
9-11. Three BENEFIT tags (lead generation, passive income, etc.)
12-13. Two AUDIENCE tags (coach, consultant, entrepreneur, etc.)

EXAMPLE: ["digital download", "instant pdf", "marketing checklist", "business checklist", "checklist template", "online business", "entrepreneur", "small business", "lead generation", "sales funnel", "marketing tips", "coach", "consultant"]

CRITICAL:
- Tag #1 MUST be "digital download"
- Tag #2 MUST be a platform tag (instant pdf, pdf template, or printable)
- All 13 slots filled, each ≤20 chars, no duplicates

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
  "marketplace_title": "SEO keyword-stuffed title using all 140 chars: [Keyword] | [Keyword] | [Keyword] | ...",
  "marketplace_description": "Manifestable-style description with proper newlines between bullets",
  "marketplace_tags": "digital download, instant pdf, [11 more tags following framework]"
}

TITLE REQUIREMENTS:
- Fill ALL 140 characters with searchable keyword phrases separated by |
- Lead with the core topic, then add synonyms, format terms, and audience keywords
- NEVER use "Digital Download" - waste of characters
- NEVER use generic labels like "Checklist" or "Swipe File" alone
- Every phrase must be something a buyer would search for on Etsy
- Each keyword phrase should be 2-4 words
- Example: "Social Media Post Templates | Instagram Content Strategy | Small Business Marketing | Content Creator Guide | Engagement Tips"

TAG REQUIREMENTS (EXACTLY 13 tags):
1. "digital download" (REQUIRED - always this exact tag first)
2. "instant pdf" OR "pdf template" OR "printable" (REQUIRED - pick one)
3-5. Three FORMAT tags (checklist, worksheet, template, etc.)
6-8. Three NICHE tags (online business, marketing, etc.)
9-11. Three BENEFIT tags (lead generation, sales funnel, etc.)
12-13. Two AUDIENCE tags (coach, consultant, etc.)

CRITICAL:
- Tag #1 MUST be "digital download"
- Tag #2 MUST be a platform tag
- All 13 tags required, each ≤20 chars, no duplicates
- Tags separated by commas
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

    // Ensure exactly 13 tags (handle both string and array formats from LLM)
    if (listing.marketplace_tags) {
      const tags = (Array.isArray(listing.marketplace_tags)
        ? listing.marketplace_tags
        : listing.marketplace_tags.split(',').map(t => t.trim())
      ).slice(0, 13);
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

      // Map to database columns
      updates[`${level}_marketplace_title`] = listing.marketplace_title;
      updates[`${level}_etsy_description`] = listing.marketplace_description;
      updates[`${level}_normal_description`] = listing.marketplace_description;
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
