// netlify/functions/fix-funnel-data.js
// ONE-TIME migration script to fix data display issues
// Run once, then DELETE this file

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'POST only' })
    };
  }

  const { funnel_id, action } = JSON.parse(event.body || '{}');

  if (!funnel_id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing funnel_id' })
    };
  }

  try {
    // Get current funnel data
    const { data: funnel, error: fetchError } = await supabase
      .from('funnels')
      .select('*')
      .eq('id', funnel_id)
      .single();

    if (fetchError) throw fetchError;

    const results = {};

    // Debug action - show marketplace_listing data
    if (action === 'debug_marketplace') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          front_end_marketplace: funnel.front_end?.marketplace_listing || null,
          bump_marketplace: funnel.bump?.marketplace_listing || null,
          upsell_1_marketplace: funnel.upsell_1?.marketplace_listing || null,
          upsell_2_marketplace: funnel.upsell_2?.marketplace_listing || null
        }, null, 2)
      };
    }

    // Fix 1: Copy TLDRs from nested JSONB to top-level columns
    if (action === 'all' || action === 'tldrs') {
      const tldrUpdate = {};

      if (funnel.front_end?.tldr) {
        tldrUpdate.front_end_tldr = funnel.front_end.tldr;
      }
      if (funnel.bump?.tldr) {
        tldrUpdate.bump_tldr = funnel.bump.tldr;
      }
      if (funnel.upsell_1?.tldr) {
        tldrUpdate.upsell_1_tldr = funnel.upsell_1.tldr;
      }
      if (funnel.upsell_2?.tldr) {
        tldrUpdate.upsell_2_tldr = funnel.upsell_2.tldr;
      }

      if (Object.keys(tldrUpdate).length > 0) {
        tldrUpdate.updated_at = new Date().toISOString();
        const { error } = await supabase
          .from('funnels')
          .update(tldrUpdate)
          .eq('id', funnel_id);

        if (error) throw error;
        results.tldrs = { fixed: Object.keys(tldrUpdate).length - 1, fields: Object.keys(tldrUpdate) };
      } else {
        results.tldrs = { fixed: 0, message: 'No nested TLDRs found to migrate' };
      }
    }

    // Fix 2: Transform bundle_listing field names
    if (action === 'all' || action === 'bundle') {
      const oldBundle = funnel.bundle_listing;

      if (oldBundle) {
        // Get prices from products
        const fePrice = parseFloat(funnel.front_end?.price) || 17;
        const bumpPrice = parseFloat(funnel.bump?.price) || 9;
        const u1Price = parseFloat(funnel.upsell_1?.price) || 47;
        const u2Price = parseFloat(funnel.upsell_2?.price) || 97;

        const totalPrice = fePrice + bumpPrice + u1Price + u2Price;
        const bundlePrice = Math.round(totalPrice * 0.45); // 55% discount
        const savings = totalPrice - bundlePrice;

        const newBundle = {
          title: oldBundle.bundle_title || oldBundle.title || '',
          etsy_description: oldBundle.bundle_description || oldBundle.etsy_description || '',
          normal_description: oldBundle.bundle_description || oldBundle.normal_description || '',
          tags: Array.isArray(oldBundle.bundle_tags)
            ? oldBundle.bundle_tags.join(', ')
            : (oldBundle.tags || ''),
          bundle_price: bundlePrice,
          total_individual_price: totalPrice,
          savings: savings,
          // Keep original fields too
          bundle_subtitle: oldBundle.bundle_subtitle || '',
          bundle_bullets: oldBundle.bundle_bullets || [],
          value_proposition: oldBundle.value_proposition || ''
        };

        const { error } = await supabase
          .from('funnels')
          .update({
            bundle_listing: newBundle,
            updated_at: new Date().toISOString()
          })
          .eq('id', funnel_id);

        if (error) throw error;
        results.bundle = {
          fixed: true,
          prices: { fePrice, bumpPrice, u1Price, u2Price, totalPrice, bundlePrice, savings },
          oldFields: Object.keys(oldBundle),
          newFields: Object.keys(newBundle)
        };
      } else {
        results.bundle = { fixed: false, message: 'No bundle_listing found' };
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        funnel_id,
        results,
        message: 'Data migration completed'
      })
    };

  } catch (error) {
    console.error('Fix funnel data error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
