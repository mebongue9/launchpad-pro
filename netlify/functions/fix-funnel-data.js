// netlify/functions/fix-funnel-data.js
// ONE-TIME migration script to fix data display issues
// Run once, then DELETE this file

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper: Fix bullet points formatting for proper UI rendering
// 1. Replaces " • " with newline + bullet to put each on its own line
// 2. Adds double newlines after section headers so bullets become their own section
//    (The UI splits by \n\n and only renders bullets if section STARTS with •)
function fixBulletNewlines(text) {
  if (!text) return text;

  let fixed = text;

  // Fix bullets on same line
  fixed = fixed.replace(/ • /g, '\n• ').replace(/ - /g, '\n- ');

  // Add double newline after section headers that are followed by bullets
  // Pattern: "HEADER:\n• " -> "HEADER:\n\n• "
  // This ensures the bullets become their own section for proper UI rendering
  fixed = fixed.replace(/:\n•/g, ':\n\n•');
  fixed = fixed.replace(/:\n-/g, ':\n\n-');

  return fixed;
}

// Helper: Convert text to Unicode bold (for Etsy/Gumroad compatibility)
function toUnicodeBold(text) {
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
}

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

    // ============================================================
    // FIX ACTIONS FOR EXISTING DATA
    // ============================================================

    // Fix bullet newlines in all marketplace descriptions and bundle
    if (action === 'fix_bullet_newlines' || action === 'fix_all_formatting') {
      const levels = ['front_end', 'bump', 'upsell_1', 'upsell_2'];
      const bulletResults = { marketplace: {}, bundle: false };

      // Fix marketplace descriptions
      for (const level of levels) {
        const product = funnel[level];
        if (product?.marketplace_listing?.marketplace_description) {
          const fixed = fixBulletNewlines(product.marketplace_listing.marketplace_description);
          if (fixed !== product.marketplace_listing.marketplace_description) {
            const updateObj = {
              [level]: {
                ...product,
                marketplace_listing: {
                  ...product.marketplace_listing,
                  marketplace_description: fixed
                }
              },
              updated_at: new Date().toISOString()
            };
            await supabase.from('funnels').update(updateObj).eq('id', funnel_id);
            bulletResults.marketplace[level] = 'fixed';
          } else {
            bulletResults.marketplace[level] = 'no_change_needed';
          }
        } else {
          bulletResults.marketplace[level] = 'no_description';
        }
      }

      // Fix bundle description
      if (funnel.bundle_listing?.etsy_description) {
        const fixedEtsy = fixBulletNewlines(funnel.bundle_listing.etsy_description);
        const fixedNormal = fixBulletNewlines(funnel.bundle_listing.normal_description || funnel.bundle_listing.etsy_description);

        if (fixedEtsy !== funnel.bundle_listing.etsy_description) {
          await supabase.from('funnels').update({
            bundle_listing: {
              ...funnel.bundle_listing,
              etsy_description: fixedEtsy,
              normal_description: fixedNormal
            },
            updated_at: new Date().toISOString()
          }).eq('id', funnel_id);
          bulletResults.bundle = 'fixed';
        } else {
          bulletResults.bundle = 'no_change_needed';
        }
      }

      if (action === 'fix_bullet_newlines') {
        results.bullet_newlines = bulletResults;
      } else {
        results.bullet_newlines = bulletResults;
      }
    }

    // Fix email [LINK] placeholders with actual URL
    if (action === 'fix_email_links' || action === 'fix_all_formatting') {
      // front_end_link is a top-level column in funnels table, not inside front_end JSONB
      const productUrl = funnel.front_end_link || '';
      const emailResults = { front_end: [], lead_magnet: [] };

      if (!productUrl) {
        emailResults.error = 'No product URL found in front_end_link column';
      } else {
        // Fix front-end email sequence
        if (funnel.front_end?.email_sequence && Array.isArray(funnel.front_end.email_sequence)) {
          const fixedEmails = funnel.front_end.email_sequence.map((email, idx) => {
            if (email.body) {
              const fixedBody = email.body
                .replace(/\[LINK\]/gi, productUrl)
                .replace(/\[PRODUCT_URL\]/gi, productUrl)
                .replace(/\[CLICK HERE\]/gi, productUrl)
                .replace(/\[URL\]/gi, productUrl);

              if (fixedBody !== email.body) {
                emailResults.front_end.push(`email_${idx + 1}_fixed`);
                return { ...email, body: fixedBody };
              }
            }
            return email;
          });

          if (emailResults.front_end.length > 0) {
            await supabase.from('funnels').update({
              front_end: { ...funnel.front_end, email_sequence: fixedEmails },
              updated_at: new Date().toISOString()
            }).eq('id', funnel_id);
          }
        }

        // Also check lead_magnets table for email sequences
        // (Lead magnet emails are stored separately)
        if (funnel.lead_magnet_id) {
          const { data: lm } = await supabase
            .from('lead_magnets')
            .select('email_sequence')
            .eq('id', funnel.lead_magnet_id)
            .single();

          if (lm?.email_sequence && Array.isArray(lm.email_sequence)) {
            const fixedLmEmails = lm.email_sequence.map((email, idx) => {
              if (email.body) {
                const fixedBody = email.body
                  .replace(/\[LINK\]/gi, productUrl)
                  .replace(/\[PRODUCT_URL\]/gi, productUrl)
                  .replace(/\[CLICK HERE\]/gi, productUrl)
                  .replace(/\[URL\]/gi, productUrl);

                if (fixedBody !== email.body) {
                  emailResults.lead_magnet.push(`email_${idx + 1}_fixed`);
                  return { ...email, body: fixedBody };
                }
              }
              return email;
            });

            if (emailResults.lead_magnet.length > 0) {
              await supabase.from('lead_magnets').update({
                email_sequence: fixedLmEmails
              }).eq('id', funnel.lead_magnet_id);
            }
          }
        }
      }

      if (action === 'fix_email_links') {
        results.email_links = emailResults;
      } else {
        results.email_links = emailResults;
      }
    }

    // Fix bundle - bold product names AND deliverables (everything before "so you can")
    if (action === 'fix_bundle_bold' || action === 'fix_all_formatting') {
      const bundleResults = { products_bolded: [], deliverables_bolded: 0 };

      if (funnel.bundle_listing?.etsy_description) {
        let description = funnel.bundle_listing.etsy_description;

        // 1. Bold product names
        const products = [
          { name: funnel.front_end?.name, level: 'front_end' },
          { name: funnel.bump?.name, level: 'bump' },
          { name: funnel.upsell_1?.name, level: 'upsell_1' },
          { name: funnel.upsell_2?.name, level: 'upsell_2' }
        ];

        for (const product of products) {
          if (product.name) {
            const boldName = toUnicodeBold(product.name);
            // Only replace if the name exists in plain text (not already bolded)
            if (description.includes(product.name) && !description.includes(boldName)) {
              description = description.replace(new RegExp(product.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), boldName);
              bundleResults.products_bolded.push(product.level);
            }
          }
        }

        // 2. Bold deliverables - everything from "• " up to " so you can"
        // Pattern: "• [deliverable text] so you can [benefit]"
        // Need to bold [deliverable text] part
        const deliverablePattern = /• ([^•\n]+?) so you can/g;
        let match;
        let newDescription = description;

        while ((match = deliverablePattern.exec(description)) !== null) {
          const deliverable = match[1];
          // Check if already bolded (contains Unicode bold chars)
          const hasBoldChars = /[𝗔-𝘇𝟬-𝟵]/.test(deliverable);
          if (!hasBoldChars && deliverable.trim()) {
            const boldDeliverable = toUnicodeBold(deliverable);
            newDescription = newDescription.replace(
              `• ${deliverable} so you can`,
              `• ${boldDeliverable} so you can`
            );
            bundleResults.deliverables_bolded++;
          }
        }
        description = newDescription;

        // Only update if we made changes
        if (bundleResults.products_bolded.length > 0 || bundleResults.deliverables_bolded > 0) {
          await supabase.from('funnels').update({
            bundle_listing: {
              ...funnel.bundle_listing,
              etsy_description: description,
              normal_description: description
            },
            updated_at: new Date().toISOString()
          }).eq('id', funnel_id);
        }
      }

      if (action === 'fix_bundle_bold') {
        results.bundle_bold = bundleResults;
      } else {
        results.bundle_bold = bundleResults;
      }
    }

    // Return results for fix_all_formatting
    if (action === 'fix_all_formatting') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          funnel_id,
          results,
          message: 'All formatting fixes applied'
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

      // Helper: Generate unique "so you can" benefits for all items (no duplicates)
      const generateAllSoYouCans = (items) => {
        const usedBenefits = new Set();

        // All possible benefits organized by priority/specificity
        const benefitPatterns = [
          { keywords: ['step-by-step', 'guide', 'blueprint', 'implementation'], benefit: 'so you can follow along and implement without getting stuck or confused' },
          { keywords: ['case stud', 'example', 'showing how'], benefit: 'so you can see exactly what works and model your approach after proven successes' },
          { keywords: ['format', 'framework', 'structure'], benefit: 'so you can use proven structures instead of guessing what might work' },
          { keywords: ['automat', 'system'], benefit: 'so you can set it up once and let it work for you on autopilot' },
          { keywords: ['tutorial', 'training', 'lesson'], benefit: 'so you can learn exactly how to do it even if you\'re starting from zero' },
          { keywords: ['checklist', 'worksheet'], benefit: 'so you can track your progress and make sure you don\'t miss anything important' },
          { keywords: ['swipe', 'copy-paste', 'ready-to-use'], benefit: 'so you can start using them today without any additional work' },
          { keywords: ['follow-up', 'followup'], benefit: 'so you can stay top of mind and close deals that would otherwise slip away' },
          { keywords: ['closing', 'close'], benefit: 'so you can seal the deal confidently every single time' },
          { keywords: ['objection'], benefit: 'so you can handle any pushback and close the sale anyway' },
          { keywords: ['negotiat', 'price negotiation'], benefit: 'so you can maintain your value while still closing the deal' },
          { keywords: ['email', 'sequence'], benefit: 'so you can nurture leads and close sales even while you sleep' },
          { keywords: ['dm', 'message', 'conversation'], benefit: 'so you can confidently turn conversations into sales without feeling pushy' },
          { keywords: ['monetiz', 'revenue', 'income'], benefit: 'so you can start making money faster instead of leaving cash on the table' },
          { keywords: ['content', 'post'], benefit: 'so you can create content that actually converts instead of just getting likes' },
          { keywords: ['calendar', 'schedule', 'plan', 'days of'], benefit: 'so you can stay consistent without constantly figuring out what to do next' },
          { keywords: ['template'], benefit: 'so you can copy, paste, and start using them immediately without writing from scratch' },
          { keywords: ['script'], benefit: 'so you can know exactly what to say in every situation' },
          { keywords: ['lead magnet', 'freebie'], benefit: 'so you can attract qualified leads who are ready to buy' },
          { keywords: ['funnel', 'sales page'], benefit: 'so you can guide prospects smoothly from interest to purchase' },
          { keywords: ['pricing', 'price'], benefit: 'so you can charge what you\'re worth and have buyers happily pay it' },
          { keywords: ['tracking', 'analytics', 'metric'], benefit: 'so you can see what\'s working and double down on your best performers' },
          { keywords: ['strateg', 'method'], benefit: 'so you can approach this with confidence knowing the path is proven' },
          { keywords: ['product pitch', 'pitch'], benefit: 'so you can seamlessly weave in offers without sounding salesy' },
          { keywords: ['integration'], benefit: 'so you can connect everything and have it work together smoothly' },
          { keywords: ['optimization', 'tips'], benefit: 'so you can continually improve your results over time' }
        ];

        // Fallback benefits (used when no pattern matches or benefit already used)
        const fallbackBenefits = [
          'so you can implement right away without any guesswork',
          'so you can skip the trial and error and get results faster',
          'so you can have everything you need in one place',
          'so you can take action immediately with complete confidence',
          'so you can see results without wasting time figuring it out yourself',
          'so you can get started today and see progress immediately',
          'so you can avoid common mistakes that slow others down',
          'so you can focus on what matters instead of figuring out the basics'
        ];

        const results = [];
        let fallbackIndex = 0;

        for (const item of items) {
          const itemLower = item.toLowerCase();
          let matchedBenefit = null;

          // Try to find a matching pattern that hasn't been used yet
          for (const pattern of benefitPatterns) {
            const hasKeyword = pattern.keywords.some(kw => itemLower.includes(kw));
            if (hasKeyword && !usedBenefits.has(pattern.benefit)) {
              matchedBenefit = pattern.benefit;
              usedBenefits.add(pattern.benefit);
              break;
            }
          }

          // If no match found or already used, use a fallback
          if (!matchedBenefit) {
            // Find next unused fallback
            while (usedBenefits.has(fallbackBenefits[fallbackIndex % fallbackBenefits.length]) && fallbackIndex < fallbackBenefits.length * 2) {
              fallbackIndex++;
            }
            matchedBenefit = fallbackBenefits[fallbackIndex % fallbackBenefits.length];
            usedBenefits.add(matchedBenefit);
            fallbackIndex++;
          }

          results.push(matchedBenefit);
        }

        return results;
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

        // Section 5: WHAT'S INSIDE - Each item gets UNIQUE "so you can" benefit (no duplicates)
        description += `${toBold("WHAT'S INSIDE:")}\n\n`;
        const items = tldr.whats_inside || [];
        const soYouCans = generateAllSoYouCans(items);
        description += items.map((item, idx) => {
          return `• ${toBold(item)} ${soYouCans[idx]}`;
        }).join('\n');
        description += `\n\n${divider}\n\n`;

        // Section 6: WHAT YOU'LL BE ABLE TO DO
        description += `${toBold("WHAT YOU'LL BE ABLE TO DO AFTER GETTING THIS:")}\n\n`;
        // Use benefit text as transformation statements (not bold)
        description += benefits.slice(0, 4).map(b => `• ${b}`).join('\n');
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
