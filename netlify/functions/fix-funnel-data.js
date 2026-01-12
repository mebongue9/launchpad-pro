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

    // Debug all - show TLDRs and bundle data for building new bundle description
    if (action === 'debug_tldrs_bundle') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          front_end: {
            name: funnel.front_end?.name,
            price: funnel.front_end?.price,
            tldr: funnel.front_end?.tldr || funnel.front_end_tldr
          },
          bump: {
            name: funnel.bump?.name,
            price: funnel.bump?.price,
            tldr: funnel.bump?.tldr || funnel.bump_tldr
          },
          upsell_1: {
            name: funnel.upsell_1?.name,
            price: funnel.upsell_1?.price,
            tldr: funnel.upsell_1?.tldr || funnel.upsell_1_tldr
          },
          upsell_2: {
            name: funnel.upsell_2?.name,
            price: funnel.upsell_2?.price,
            tldr: funnel.upsell_2?.tldr || funnel.upsell_2_tldr
          },
          bundle_listing: funnel.bundle_listing || null
        }, null, 2)
      };
    }

    // Update bundle description with new structured format
    if (action === 'update_bundle_description') {
      const { new_description } = JSON.parse(event.body || '{}');
      if (!new_description) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing new_description' })
        };
      }

      const updatedBundle = {
        ...funnel.bundle_listing,
        etsy_description: new_description,
        normal_description: new_description
      };

      const { error: updateError } = await supabase
        .from('funnels')
        .update({
          bundle_listing: updatedBundle,
          updated_at: new Date().toISOString()
        })
        .eq('id', funnel_id);

      if (updateError) throw updateError;

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Bundle description updated',
          description_length: new_description.length
        })
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

    // Transform marketplace descriptions to 7-section format using TLDRs
    if (action === 'transform_marketplace') {
      const levels = ['front_end', 'bump', 'upsell_1', 'upsell_2'];
      // TLDRs are nested inside each product's JSONB (e.g., front_end.tldr)
      const tldrColumns = {
        front_end: funnel.front_end?.tldr || funnel.front_end_tldr,
        bump: funnel.bump?.tldr || funnel.bump_tldr,
        upsell_1: funnel.upsell_1?.tldr || funnel.upsell_1_tldr,
        upsell_2: funnel.upsell_2?.tldr || funnel.upsell_2_tldr
      };

      // Helper: Convert text to Unicode bold
      const toBold = (text) => {
        if (!text) return '';
        const boldMap = {
          'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜',
          'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥',
          'S': '𝗦', 'T': '𝗧', 'U': '𝗨', 'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭',
          'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶',
          'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿',
          's': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
          '0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰', '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵'
        };
        return text.split('').map(c => boldMap[c] || c).join('');
      };

      // Helper: Transform TLDR to 7-section description
      const transformTldr = (tldr, productName) => {
        if (!tldr) return null;

        const divider = '━━━━━━━━━━';

        // Build the 7-section description
        let description = '';

        // Section 1: WHAT IT IS
        description += `${toBold("WHAT IT IS:")}\n`;
        description += `${tldr.what_it_is || 'A powerful resource to help you succeed'}\n\n`;
        description += `${divider}\n\n`;

        // Section 2: WHO IT'S FOR
        description += `${toBold("WHO IT'S FOR:")}\n`;
        description += `${tldr.who_its_for || 'Creators ready to take action'}\n\n`;
        description += `${divider}\n\n`;

        // Section 3: PROBLEM SOLVED
        description += `${toBold("PROBLEM SOLVED:")}\n`;
        description += `${tldr.problem_solved || 'Overcoming common challenges in your niche'}\n\n`;
        description += `${divider}\n\n`;

        // Section 4: KEY BENEFITS
        description += `${toBold("KEY BENEFITS:")}\n\n`;
        const benefits = tldr.key_benefits || [];
        description += benefits.map(b => `• ${b}`).join('\n');
        description += `\n\n${divider}\n\n`;

        // Section 5: WHAT'S INSIDE
        description += `${toBold("WHAT'S INSIDE:")}\n\n`;
        const items = tldr.whats_inside || [];
        description += items.map(item => {
          const boldItem = toBold(item);
          return `• ${boldItem} so you can implement immediately`;
        }).join('\n');
        description += `\n\n${divider}\n\n`;

        // Section 6: WHAT YOU'LL BE ABLE TO DO
        description += `${toBold("WHAT YOU'LL BE ABLE TO DO AFTER GETTING THIS:")}\n\n`;
        // Use full benefit text as transformation statement
        description += benefits.slice(0, 4).map(b => `• ${toBold(b)}`).join('\n');
        description += `\n\n${divider}\n\n`;

        // Section 7: CTA
        description += `${tldr.cta || tldr.call_to_action || 'Get instant access now'}`;

        return description;
      };

      const transformResults = {};

      for (const level of levels) {
        const product = funnel[level];
        const tldr = tldrColumns[level];

        if (!product || !tldr) {
          transformResults[level] = { skipped: true, reason: !product ? 'No product' : 'No TLDR' };
          continue;
        }

        const newDescription = transformTldr(tldr, product.name);
        if (!newDescription) {
          transformResults[level] = { skipped: true, reason: 'Transform failed' };
          continue;
        }

        // Get existing marketplace_listing or create new
        const existingListing = product.marketplace_listing || {};

        // Keep existing title and tags, update description
        const updatedListing = {
          ...existingListing,
          marketplace_description: newDescription,
          // Keep bullets as short items for display card
          marketplace_bullets: (tldr.whats_inside || []).slice(0, 5)
        };

        // Update the product with new marketplace_listing
        const updateObj = {
          [level]: { ...product, marketplace_listing: updatedListing },
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('funnels')
          .update(updateObj)
          .eq('id', funnel_id);

        if (error) {
          transformResults[level] = { error: error.message };
        } else {
          transformResults[level] = {
            success: true,
            description_length: newDescription.length,
            bullets_count: updatedListing.marketplace_bullets.length
          };
        }
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          funnel_id,
          results: transformResults,
          message: 'Marketplace descriptions transformed to 7-section format'
        })
      };
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
