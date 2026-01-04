// /netlify/functions/generate-supplementary-content.js
// Generates TLDRs and cross-promos AFTER user saves a funnel
// Called only when user accepts the funnel (clicks Save Funnel)
// RELEVANT FILES: src/hooks/useFunnels.jsx, process-generation-background.js

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

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
`;
}

// Generate TLDR for a product
async function generateTLDR(productData, language = 'English') {
  const { name, description, format, price } = productData;

  const tldrPrompt = `
Create a TLDR summary for this product:

Product Name: ${name}
Description: ${description || 'Not provided'}
Format: ${format}
Price: $${price}

Return ONLY valid JSON with this exact structure:
{
  "what_it_is": "One clear sentence describing what this product is",
  "who_its_for": "One sentence describing the ideal customer",
  "problem_solved": "One sentence about the main problem it solves",
  "whats_inside": ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"],
  "key_benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
  "cta": "A compelling call to action"
}
${getLanguagePromptSuffix(language)}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: 'You are a marketing copywriter. Create concise, compelling TLDR summaries. Return ONLY valid JSON.',
    messages: [{ role: 'user', content: tldrPrompt }]
  });

  try {
    return JSON.parse(response.content[0].text);
  } catch {
    // Try to extract JSON from response
    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to parse TLDR response');
  }
}

// Generate cross-promo for a product
async function generateCrossPromo(productData, existingProduct, profile, language = 'English') {
  if (!existingProduct) {
    return null;
  }

  const crossPromoPrompt = `
Write a cross-promotion paragraph for the end of a product:

CURRENT PRODUCT:
Name: ${productData.name}
Price: $${productData.price}

DESTINATION PRODUCT (what we're promoting):
Name: ${existingProduct.name}
Price: $${existingProduct.price}
Description: ${existingProduct.description || 'Premium offering'}

CREATOR: ${profile.name}

Write a 150-200 word promotional paragraph that:
1. Acknowledges the value they just got from the current product
2. Creates curiosity about the destination product
3. Positions the destination product as the next logical step
4. Includes a soft CTA (no aggressive sales language)

Keep it conversational and authentic to the creator's voice.
Do NOT include the destination product URL - that will be added separately.
${getLanguagePromptSuffix(language)}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: 'You are a conversion copywriter specializing in natural, non-pushy cross-promotions. Output only the promotional paragraph text, no JSON.',
    messages: [{ role: 'user', content: crossPromoPrompt }]
  });

  return response.content[0].text.trim();
}

export async function handler(event) {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { funnel_id, user_id } = JSON.parse(event.body || '{}');

    if (!funnel_id || !user_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'funnel_id and user_id required' })
      };
    }

    console.log(`[Supplementary] Starting generation for funnel: ${funnel_id}`);

    // Get funnel data with related profile and existing product
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select(`
        *,
        profiles (id, name, business_name),
        existing_products (id, name, price, description)
      `)
      .eq('id', funnel_id)
      .eq('user_id', user_id)
      .single();

    if (funnelError || !funnel) {
      console.error('Funnel not found:', funnelError);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Funnel not found' })
      };
    }

    const language = funnel.language || 'English';
    const profile = funnel.profiles || { name: 'Creator' };
    const existingProduct = funnel.existing_products;

    // Generate TLDRs and cross-promos for each product
    const productLevels = ['front_end', 'bump', 'upsell_1', 'upsell_2'];
    const updates = {};

    for (const level of productLevels) {
      const product = funnel[level];
      if (!product || !product.name) continue;

      console.log(`[Supplementary] Generating TLDR for ${level}: ${product.name}`);

      // Generate TLDR
      try {
        const tldr = await generateTLDR(product, language);
        updates[`${level}_tldr`] = tldr;
      } catch (error) {
        console.error(`TLDR generation failed for ${level}:`, error.message);
      }

      // Generate cross-promo (for paid products only, not front_end)
      if (existingProduct && level !== 'front_end') {
        console.log(`[Supplementary] Generating cross-promo for ${level}`);
        try {
          const crossPromo = await generateCrossPromo(product, existingProduct, profile, language);
          if (crossPromo) {
            updates[`${level}_cross_promo`] = crossPromo;
          }
        } catch (error) {
          console.error(`Cross-promo generation failed for ${level}:`, error.message);
        }
      }
    }

    // Update funnel with TLDRs and cross-promos
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('funnels')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', funnel_id)
        .eq('user_id', user_id);

      if (updateError) {
        console.error('Failed to update funnel:', updateError);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to save generated content' })
        };
      }
    }

    console.log(`[Supplementary] Completed for funnel: ${funnel_id}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Supplementary content generated',
        generated: Object.keys(updates)
      })
    };

  } catch (error) {
    console.error('[Supplementary] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
