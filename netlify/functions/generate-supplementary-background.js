// /netlify/functions/generate-supplementary-background.js
// Background function that generates TLDRs and cross-promos AFTER user saves a funnel
// Runs for up to 15 minutes (Netlify background function limit)
// RELEVANT FILES: src/hooks/useFunnels.jsx, check-job-status.js, generate-supplementary-content.js

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Update job status in database
async function updateJobStatus(jobId, updates) {
  const { error } = await supabase
    .from('generation_jobs')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId);

  if (error) {
    console.error('Failed to update job status:', error);
  }
}

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
  console.log('🚀 [SUPPLEMENTARY-BG] Background function started');

  try {
    const { job_id, funnel_id, user_id } = JSON.parse(event.body || '{}');
    console.log('📥 [SUPPLEMENTARY-BG] Job ID:', job_id);
    console.log('📥 [SUPPLEMENTARY-BG] Funnel ID:', funnel_id);
    console.log('📥 [SUPPLEMENTARY-BG] User ID:', user_id);

    if (!job_id || !funnel_id || !user_id) {
      console.error('❌ [SUPPLEMENTARY-BG] Missing required fields');
      return { statusCode: 400, body: 'Missing required fields' };
    }

    // Update job to processing
    await updateJobStatus(job_id, {
      status: 'processing',
      current_chunk_name: 'Starting...'
    });

    // Get funnel data
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
      console.error('❌ [SUPPLEMENTARY-BG] Funnel not found:', funnelError);
      await updateJobStatus(job_id, {
        status: 'failed',
        error_message: 'Funnel not found'
      });
      return { statusCode: 404, body: 'Funnel not found' };
    }

    console.log('✅ [SUPPLEMENTARY-BG] Funnel found:', funnel.name);

    const language = funnel.language || 'English';
    const profile = funnel.profiles || { name: 'Creator' };
    const existingProduct = funnel.existing_products;

    // Calculate total tasks: 4 TLDRs + up to 3 cross-promos
    const productLevels = ['front_end', 'bump', 'upsell_1', 'upsell_2'];
    let totalTasks = 0;
    for (const level of productLevels) {
      if (funnel[level]?.name) {
        totalTasks++; // TLDR
        if (existingProduct && level !== 'front_end') {
          totalTasks++; // Cross-promo
        }
      }
    }

    console.log('📊 [SUPPLEMENTARY-BG] Total tasks:', totalTasks);
    await updateJobStatus(job_id, { total_chunks: totalTasks });

    const updates = {};
    let completedTasks = 0;

    for (const level of productLevels) {
      const product = funnel[level];
      if (!product || !product.name) {
        console.log(`⏭️ [SUPPLEMENTARY-BG] Skipping ${level} - no product`);
        continue;
      }

      // Generate TLDR
      const tldrLabel = `Generating ${level.replace('_', ' ')} TLDR...`;
      console.log(`🎯 [SUPPLEMENTARY-BG] ${tldrLabel}`);
      await updateJobStatus(job_id, { current_chunk_name: tldrLabel });

      try {
        const tldr = await generateTLDR(product, language);
        updates[`${level}_tldr`] = tldr;
        completedTasks++;
        console.log(`✅ [SUPPLEMENTARY-BG] TLDR done for ${level}`);
        await updateJobStatus(job_id, { completed_chunks: completedTasks });
      } catch (error) {
        console.error(`❌ [SUPPLEMENTARY-BG] TLDR failed for ${level}:`, error.message);
      }

      // Generate cross-promo (for paid products only)
      if (existingProduct && level !== 'front_end') {
        const crossPromoLabel = `Generating ${level.replace('_', ' ')} cross-promo...`;
        console.log(`🎯 [SUPPLEMENTARY-BG] ${crossPromoLabel}`);
        await updateJobStatus(job_id, { current_chunk_name: crossPromoLabel });

        try {
          const crossPromo = await generateCrossPromo(product, existingProduct, profile, language);
          if (crossPromo) {
            updates[`${level}_cross_promo`] = crossPromo;
          }
          completedTasks++;
          console.log(`✅ [SUPPLEMENTARY-BG] Cross-promo done for ${level}`);
          await updateJobStatus(job_id, { completed_chunks: completedTasks });
        } catch (error) {
          console.error(`❌ [SUPPLEMENTARY-BG] Cross-promo failed for ${level}:`, error.message);
        }
      }
    }

    // Save to funnel
    console.log('💾 [SUPPLEMENTARY-BG] Saving to database...');
    await updateJobStatus(job_id, { current_chunk_name: 'Saving documents...' });

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
        console.error('❌ [SUPPLEMENTARY-BG] Database update failed:', updateError);
        await updateJobStatus(job_id, {
          status: 'failed',
          error_message: 'Failed to save generated content'
        });
        return { statusCode: 500, body: 'Database update failed' };
      }
    }

    // Mark job as complete
    console.log('🎉 [SUPPLEMENTARY-BG] All done!');
    await updateJobStatus(job_id, {
      status: 'complete',
      current_chunk_name: 'Documents generated!',
      completed_at: new Date().toISOString(),
      result: { generated: Object.keys(updates) }
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };

  } catch (error) {
    console.error('❌ [SUPPLEMENTARY-BG] Error:', error);
    return { statusCode: 500, body: error.message };
  }
}
