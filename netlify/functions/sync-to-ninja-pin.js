// /netlify/functions/sync-to-ninja-pin.js
// Syncs all 6 products (lead magnet + 4 funnel levels + bundle) to Ninja Pin Uploader
// Sends sequential POST requests to Ninja Pin API for each product
// RELEVANT FILES: src/pages/LeadMagnetDetails.jsx

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const NINJA_PIN_API_URL = 'https://lfrydexaspgkkwjbqzgf.supabase.co/functions/v1/sync-from-launchpad';

function normalizeTagsToString(tags) {
  if (!tags) return null;
  if (Array.isArray(tags)) return tags.join(', ');
  if (typeof tags === 'string') return tags;
  return null;
}

export async function handler(event) {
  const headers = { 'Content-Type': 'application/json' };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.NINJA_PIN_SYNC_API_KEY;
  if (!apiKey) {
    console.error('🔴 [SYNC-NINJA-PIN] NINJA_PIN_SYNC_API_KEY not set');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Sync API key not configured' }) };
  }

  let lead_magnet_id;
  try {
    const body = JSON.parse(event.body);
    lead_magnet_id = body.lead_magnet_id;
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  if (!lead_magnet_id) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'lead_magnet_id is required' }) };
  }

  console.log(`🔄 [SYNC-NINJA-PIN] Starting sync for lead_magnet_id: ${lead_magnet_id}`);

  // 1. Fetch lead magnet
  const { data: leadMagnet, error: lmError } = await supabase
    .from('lead_magnets')
    .select('*')
    .eq('id', lead_magnet_id)
    .single();

  if (lmError || !leadMagnet) {
    console.error('🔴 [SYNC-NINJA-PIN] Lead magnet not found:', lmError);
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Lead magnet not found' }) };
  }

  // 2. Fetch funnel
  const { data: funnel, error: funnelError } = await supabase
    .from('funnels')
    .select('*')
    .eq('id', leadMagnet.funnel_id)
    .single();

  if (funnelError || !funnel) {
    console.error('🔴 [SYNC-NINJA-PIN] Funnel not found:', funnelError);
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Funnel not found' }) };
  }

  // 3. Guard: funnel must be ready
  if (funnel.status !== 'ready') {
    console.log(`🔴 [SYNC-NINJA-PIN] Funnel status is "${funnel.status}", not "ready"`);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: `Funnel is not ready (status: "${funnel.status}"). Complete the funnel before syncing.` })
    };
  }

  // 4. Fetch bundle
  const { data: bundles, error: bundleError } = await supabase
    .from('bundles')
    .select('*')
    .eq('funnel_id', funnel.id);

  if (bundleError) {
    console.error('🔴 [SYNC-NINJA-PIN] Bundle fetch error:', bundleError);
  }

  const bundle = bundles && bundles.length > 0 ? bundles[0] : null;

  // 4b. Resolve bundle data from bundles table OR funnel.bundle_listing JSONB
  const bundleData = bundle
    ? { title: bundle.title, description: bundle.etsy_description, tags: bundle.tags }
    : funnel.bundle_listing
      ? { title: funnel.bundle_listing.title, description: funnel.bundle_listing.etsy_description, tags: funnel.bundle_listing.tags }
      : null;

  // 5. Validate: only block on missing product titles
  const missingTitles = [];

  // Lead Magnet: flat column is always NULL, fall back to JSONB
  const lmTitle = leadMagnet.marketplace_title || leadMagnet.marketplace_listing?.marketplace_title || null;
  if (!lmTitle) missingTitles.push('Lead Magnet');

  const levels = [
    { prefix: 'front_end', label: 'Front-End' },
    { prefix: 'bump', label: 'Bump' },
    { prefix: 'upsell_1', label: 'Upsell 1' },
    { prefix: 'upsell_2', label: 'Upsell 2' },
  ];
  for (const level of levels) {
    const title = funnel[`${level.prefix}_marketplace_title`]
      || funnel[level.prefix]?.marketplace_listing?.marketplace_title || null;
    if (!title) missingTitles.push(level.label);
  }

  if (!bundleData || !bundleData.title) missingTitles.push('Bundle');

  if (missingTitles.length > 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: `Missing required titles for: ${missingTitles.join(', ')}. Generate marketplace listings before syncing.`
      })
    };
  }

  // 6. Build 6 payloads
  const funnelName = funnel.name;

  const payloads = [
    {
      product: 'Lead Magnet',
      type: 'lead_magnet',
      product_title: lmTitle,
      marketplace_description: leadMagnet.marketplace_listing?.marketplace_description || null,
      marketplace_tags: normalizeTagsToString(leadMagnet.marketplace_listing?.marketplace_tags),
      tldr: leadMagnet.tldr || null,
      source: 'launchpad_pro',
      emails: null,
      funnel_name: funnelName,
    },
    ...levels.map(level => ({
      product: level.label,
      type: 'funnel',
      product_title: funnel[`${level.prefix}_marketplace_title`]
        || funnel[level.prefix]?.marketplace_listing?.marketplace_title || null,
      marketplace_description: funnel[`${level.prefix}_etsy_description`]
        || funnel[level.prefix]?.marketplace_listing?.marketplace_description || null,
      marketplace_tags: normalizeTagsToString(
        funnel[`${level.prefix}_marketplace_tags`]
        || funnel[level.prefix]?.marketplace_listing?.marketplace_tags
      ),
      tldr: funnel[`${level.prefix}_tldr`] || null,
      source: 'launchpad_pro',
      emails: null,
      funnel_name: funnelName,
    })),
    {
      product: 'Bundle',
      type: 'bundle',
      product_title: bundleData.title,
      marketplace_description: bundleData.description || null,
      marketplace_tags: normalizeTagsToString(bundleData.tags),
      tldr: null,
      source: 'launchpad_pro',
      emails: null,
      funnel_name: funnelName,
    },
  ];

  // 7. Send 6 sequential POSTs
  const results = [];
  for (const payload of payloads) {
    try {
      console.log(`🔄 [SYNC-NINJA-PIN] Sending ${payload.product}...`);
      const response = await fetch(NINJA_PIN_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }

      if (response.ok) {
        console.log(`✅ [SYNC-NINJA-PIN] ${payload.product} synced successfully`);
        results.push({ product: payload.product, success: true, data: responseData });
      } else {
        console.error(`🔴 [SYNC-NINJA-PIN] ${payload.product} failed: ${response.status}`, responseText);
        results.push({ product: payload.product, success: false, error: responseData?.error || `HTTP ${response.status}` });
      }
    } catch (err) {
      console.error(`🔴 [SYNC-NINJA-PIN] ${payload.product} error:`, err.message);
      results.push({ product: payload.product, success: false, error: err.message });
    }
  }

  const synced_count = results.filter(r => r.success).length;
  const failed_count = results.filter(r => !r.success).length;

  // 8. On full success (6/6), update ninja_pin_synced_at
  if (failed_count === 0) {
    const { error: updateError } = await supabase
      .from('lead_magnets')
      .update({ ninja_pin_synced_at: new Date().toISOString() })
      .eq('id', lead_magnet_id);

    if (updateError) {
      console.error('🔴 [SYNC-NINJA-PIN] Failed to update ninja_pin_synced_at:', updateError);
    } else {
      console.log('✅ [SYNC-NINJA-PIN] ninja_pin_synced_at updated');
    }
  }

  console.log(`🔄 [SYNC-NINJA-PIN] Complete: ${synced_count}/6 synced, ${failed_count}/6 failed`);

  return {
    statusCode: failed_count === 0 ? 200 : 207,
    headers,
    body: JSON.stringify({ success: failed_count === 0, results, synced_count, failed_count }),
  };
}
