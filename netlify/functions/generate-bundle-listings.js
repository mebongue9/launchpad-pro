// /netlify/functions/generate-bundle-listings.js
// Generates bundle listings that combine all 4 funnel products at ~45% discount
// Creates marketplace-ready title, descriptions, tags, and pricing
// RELEVANT FILES: src/hooks/useBundles.js, src/components/funnel/BundlePreview.jsx

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { parseClaudeJSON } from './utils/sanitize-json.js';

// Initialize clients
console.log('🔧 [BUNDLE] Initializing Supabase client...');
console.log('🔧 [BUNDLE] Environment check - SUPABASE_URL:', !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL));
console.log('🔧 [BUNDLE] Environment check - SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('🔧 [BUNDLE] Environment check - ANTHROPIC_API_KEY:', !!process.env.ANTHROPIC_API_KEY);

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

// Bundle Listing System Prompt - Manifestable-proven Etsy SEO patterns
const BUNDLE_SYSTEM_PROMPT = `You are an expert at creating irresistible bundle offers for digital products.

## TITLE FORMULA (140 chars max)
[Bundle Name] | Digital Download | [Format] Bundle | Save $[Amount]

CRITICAL: If 3 keywords exceed 140 chars, use only 2 keywords.

## BUNDLE DESCRIPTION - MANIFESTABLE FRAMEWORK

CRITICAL FORMATTING: Each ✓ bullet MUST be on its own line. Use actual newline characters between bullets and sections. Never put multiple bullets on the same line.

[SECTION 1: EMOTIONAL HOOK - 2 paragraphs]
Open with a question about their pain point.
Acknowledge their struggle with empathy ("It's not your fault").
Position this COMPLETE bundle as the all-in-one solution.
Emphasize the incredible savings and convenience.

[SECTION 2: WHY YOU'LL LOVE THIS BUNDLE - 5 bullets]
✓ Benefit 1
✓ Benefit 2
✓ Benefit 3
✓ Benefit 4
✓ Benefit 5

[SECTION 3: WHAT'S INSIDE THE BUNDLE - list each product]
✓ [Product 1 Name] ($XX value) - brief benefit
✓ [Product 2 Name] ($XX value) - brief benefit
✓ [Product 3 Name] ($XX value) - brief benefit
✓ [Product 4 Name] ($XX value) - brief benefit
✓ Instant digital download - all products

[SECTION 4: WHO THIS IS FOR]
Perfect for [specific audience ready for a complete solution].

[SECTION 5: WHAT YOU'LL RECEIVE]
✓ [X] Complete Digital Products
✓ Total Value: $[XX] | Your Price: $[XX] | You Save: $[XX]

[SECTION 6: LEGAL/TERMS]
PLEASE NOTE: This is a digital product. No physical items will be shipped.
TERMS OF SERVICE: Due to the digital nature of this product, all sales are final.
This product is for PERSONAL USE ONLY.
Copyright 2026. All rights reserved.

## TAGS (EXACTLY 13, each MAX 20 chars)
Tag Framework:
- 2 bundle tags: bundle, digital bundle
- 3 format tags: checklist bundle, worksheet pack, template bundle
- 3 niche tags: online business, entrepreneur, marketing
- 3 benefit tags: lead generation, sales funnel, business growth
- 2 audience tags: coach, consultant

Return ONLY valid JSON.`;

export async function handler(event) {
  console.log('🚀 [BUNDLE] Function invoked');
  console.log('📥 [BUNDLE] HTTP method:', event.httpMethod);

  if (event.httpMethod !== 'POST') {
    console.log('❌ [BUNDLE] Method not allowed:', event.httpMethod);
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    console.log('📥 [BUNDLE] Parsing request body...');
    const { funnel_id, user_id, language = 'English' } = JSON.parse(event.body || '{}');
    console.log('📥 [BUNDLE] Received funnel_id:', funnel_id);
    console.log('📥 [BUNDLE] Received user_id:', user_id);
    console.log('📥 [BUNDLE] Received language:', language);

    if (!funnel_id || !user_id) {
      console.log('❌ [BUNDLE] Missing required parameters - funnel_id:', !!funnel_id, 'user_id:', !!user_id);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'funnel_id and user_id required' })
      };
    }

    console.log('🔄 [BUNDLE] Fetching funnel data from database...');
    // Get funnel data - verify ownership with user_id
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('*, profiles(*), audiences(*)')
      .eq('id', funnel_id)
      .eq('user_id', user_id)
      .single();

    if (funnelError) {
      console.error('❌ [BUNDLE] Database error fetching funnel:', funnelError.message);
      console.error('❌ [BUNDLE] Error details:', JSON.stringify(funnelError));
    }

    if (funnelError || !funnel) {
      console.log('❌ [BUNDLE] Funnel not found or access denied for funnel_id:', funnel_id);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Funnel not found or access denied' })
      };
    }

    console.log('✅ [BUNDLE] Funnel loaded:', funnel.name);

    // Calculate bundle pricing
    console.log('🔄 [BUNDLE] Calculating bundle pricing...');
    const productLevels = ['front_end', 'bump', 'upsell_1', 'upsell_2'];
    const products = productLevels
      .map(level => {
        const product = funnel[level];
        if (product && product.price) {
          console.log('📋 [BUNDLE] Found product:', level, '-', product.name, '- $' + product.price);
        }
        return product;
      })
      .filter(p => p && p.price);

    console.log('📋 [BUNDLE] Total products found with prices:', products.length);

    if (products.length < 2) {
      console.log('❌ [BUNDLE] Not enough products for bundle. Need at least 2, found:', products.length);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Need at least 2 products for a bundle' })
      };
    }

    const totalIndividualPrice = products.reduce((sum, p) => sum + parseFloat(p.price || 0), 0);
    const bundlePrice = Math.round(totalIndividualPrice * 0.45);
    const savings = totalIndividualPrice - bundlePrice;
    const discountPercent = Math.round((savings / totalIndividualPrice) * 100);

    console.log('💰 [BUNDLE] Pricing calculated:');
    console.log('💰 [BUNDLE]   Total individual value: $' + totalIndividualPrice);
    console.log('💰 [BUNDLE]   Bundle price: $' + bundlePrice);
    console.log('💰 [BUNDLE]   Customer saves: $' + savings + ' (' + discountPercent + '% off)');

    const profile = funnel.profiles || { name: 'Creator' };
    const audience = funnel.audiences;
    console.log('📋 [BUNDLE] Profile name:', profile.name);
    console.log('📋 [BUNDLE] Audience:', audience?.name || 'Not set');

    // Build product list for prompt
    const productList = products.map(p =>
      `- ${p.name} (${p.format}) - $${p.price}`
    ).join('\n');

    const bundlePrompt = `
Create a marketplace bundle listing using the Manifestable framework:

FUNNEL NAME: ${funnel.name}
CREATOR: ${profile.name} (${profile.business_name || profile.name})
NICHE: ${profile.niche || 'Not specified'}

INCLUDED PRODUCTS:
${productList}

PRICING:
- Total Individual Value: $${totalIndividualPrice}
- Bundle Price: $${bundlePrice}
- Customer Saves: $${savings} (${discountPercent}% off)

TARGET AUDIENCE: ${audience?.name || 'General'}

Return JSON:
{
  "title": "Bundle title using formula: [Bundle Name] | Digital Download | [Format] Bundle | Save $${savings} (MAX 140 chars - use only 2 keywords if 3 exceeds limit)",
  "etsy_description": "Etsy description (500-800 chars) with: Emotional hook question, What's in the bundle with values, Total savings emphasized, Legal/terms",
  "normal_description": "Gumroad description (1500-2500 chars) with: Emotional hook (2 paragraphs), Why You'll Love This Bundle (5 checkmark bullets), What's Inside listing each product with value, Who This Is For, What You'll Receive with pricing breakdown, Legal/Terms",
  "tags": "tag1, tag2, tag3, tag4, tag5, tag6, tag7, tag8, tag9, tag10, tag11, tag12, tag13"
}

TAG FRAMEWORK (fill all 13 slots):
- 2 bundle tags: bundle, digital bundle
- 3 format tags: checklist bundle, worksheet pack, template bundle
- 3 niche tags: online business, entrepreneur, marketing
- 3 benefit tags: lead generation, sales funnel, business growth
- 2 audience tags: coach, consultant

CRITICAL:
- Title MUST be under 140 characters (use 2 keywords if 3 exceeds limit)
- Tags MUST be exactly 13, each under 20 characters
- No duplicate tags
- Include specific dollar amounts for savings and total value
${getLanguagePromptSuffix(language)}`;

    console.log('🔄 [BUNDLE] Calling Claude API for bundle listing generation...');
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: BUNDLE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: bundlePrompt }]
    });
    console.log('✅ [BUNDLE] Claude API response received');

    console.log('🔄 [BUNDLE] Parsing Claude response...');
    const bundleListing = parseClaudeJSON(response.content[0].text);
    console.log('✅ [BUNDLE] Response parsed successfully');

    // Validate title length
    if (bundleListing.title && bundleListing.title.length > 140) {
      console.log('⚠️ [BUNDLE] Title too long (' + bundleListing.title.length + ' chars), trimming to 140...');
      bundleListing.title = bundleListing.title.substring(0, 137) + '...';
    }
    console.log('📋 [BUNDLE] Title:', bundleListing.title?.substring(0, 60) + '...');
    console.log('📋 [BUNDLE] Title length:', bundleListing.title?.length, 'chars');

    // Save bundle to database
    const bundleData = {
      user_id,
      funnel_id,
      title: bundleListing.title,
      etsy_description: bundleListing.etsy_description,
      normal_description: bundleListing.normal_description,
      tags: bundleListing.tags,
      bundle_price: bundlePrice,
      total_individual_price: totalIndividualPrice,
      savings: savings
    };

    // Delete existing bundle for this funnel (verify ownership)
    console.log('🔄 [BUNDLE] Deleting existing bundle for funnel...');
    const { error: deleteError } = await supabase
      .from('bundles')
      .delete()
      .eq('funnel_id', funnel_id)
      .eq('user_id', user_id);

    if (deleteError) {
      console.log('⚠️ [BUNDLE] Delete warning (may be no existing bundle):', deleteError.message);
    } else {
      console.log('✅ [BUNDLE] Existing bundle deleted (if any)');
    }

    // Insert new bundle
    console.log('🔄 [BUNDLE] Inserting new bundle into database...');
    const { data: savedBundle, error: insertError } = await supabase
      .from('bundles')
      .insert(bundleData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ [BUNDLE] Failed to save bundle:', insertError.message);
      console.error('❌ [BUNDLE] Insert error details:', JSON.stringify(insertError));
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to save bundle listing' })
      };
    }

    console.log('✅ [BUNDLE] Bundle saved to database with ID:', savedBundle.id);
    console.log('💰 [BUNDLE] Final bundle: $' + bundlePrice + ' (saves $' + savings + ')');
    console.log('🏁 [BUNDLE] Function completed successfully for funnel:', funnel_id);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        bundle: savedBundle
      })
    };

  } catch (error) {
    console.error('❌ [BUNDLE] Unhandled error:', error.message);
    console.error('❌ [BUNDLE] Error stack:', error.stack);
    console.error('❌ [BUNDLE] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
