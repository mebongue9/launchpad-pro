// netlify/functions/debug-lead-magnet.js
// Debug function to check what data exists for a lead magnet

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function handler(event) {
  const params = event.httpMethod === 'GET'
    ? event.queryStringParameters
    : JSON.parse(event.body || '{}');

  const { lead_magnet_id } = params;

  if (!lead_magnet_id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing lead_magnet_id' })
    };
  }

  try {
    const { data: lm, error } = await supabase
      .from('lead_magnets')
      .select('*')
      .eq('id', lead_magnet_id)
      .single();

    if (error) throw error;

    // Check funnel's lead_magnet_id if funnel_id exists
    let funnelCheck = null;
    let otherLeadMagnet = null;
    if (lm.funnel_id) {
      const { data: funnel, error: funnelError } = await supabase
        .from('funnels')
        .select('id, lead_magnet_id')
        .eq('id', lm.funnel_id)
        .single();
      funnelCheck = {
        funnel_id: funnel?.id || null,
        funnel_lead_magnet_id: funnel?.lead_magnet_id || 'NULL_OR_UNDEFINED',
        this_lead_magnet_id: lead_magnet_id,
        match: funnel?.lead_magnet_id === lead_magnet_id,
        query_error: funnelError?.message || null,
        diagnosis: funnelError
          ? 'Query error: ' + funnelError.message
          : funnel?.lead_magnet_id
            ? 'Funnel points to DIFFERENT lead magnet'
            : 'Funnel lead_magnet_id is NULL - FK not set!'
      };

      // If there's a mismatch, check what the OTHER lead magnet has
      if (funnel?.lead_magnet_id && funnel.lead_magnet_id !== lead_magnet_id) {
        const { data: other } = await supabase
          .from('lead_magnets')
          .select('id, name, content, marketplace_listing, email_sequence, created_at')
          .eq('id', funnel.lead_magnet_id)
          .single();
        otherLeadMagnet = {
          id: other?.id,
          name: other?.name,
          created_at: other?.created_at,
          has_content: !!other?.content,
          has_marketplace: !!other?.marketplace_listing,
          has_emails: !!other?.email_sequence
        };
      }
    }

    // Check if there are other lead_magnets with same funnel_id
    const { data: allLeadMagnets } = await supabase
      .from('lead_magnets')
      .select('id, name, created_at')
      .eq('funnel_id', lm.funnel_id);

    // Analyze what data exists
    const analysis = {
      lead_magnet_id,
      name: lm.name,
      funnel_id: lm.funnel_id,
      funnel_check: funnelCheck,
      other_lead_magnet_funnel_points_to: otherLeadMagnet,
      other_lead_magnets_with_same_funnel: allLeadMagnets,

      // Content analysis
      content: {
        exists: !!lm.content,
        type: typeof lm.content,
        hasChapters: lm.content?.chapters?.length > 0,
        chapterCount: lm.content?.chapters?.length || 0,
        hasCover: !!lm.content?.cover
      },

      // Marketplace analysis
      marketplace_listing: {
        exists: !!lm.marketplace_listing,
        type: typeof lm.marketplace_listing,
        hasTitle: !!lm.marketplace_listing?.marketplace_title,
        hasDescription: !!lm.marketplace_listing?.marketplace_description,
        hasBullets: lm.marketplace_listing?.marketplace_bullets?.length > 0,
        hasTags: lm.marketplace_listing?.marketplace_tags?.length > 0
      },

      // Email sequence analysis
      email_sequence: {
        exists: !!lm.email_sequence,
        type: typeof lm.email_sequence,
        isArray: Array.isArray(lm.email_sequence),
        count: Array.isArray(lm.email_sequence) ? lm.email_sequence.length : 0,
        emails: Array.isArray(lm.email_sequence)
          ? lm.email_sequence.map((e, i) => ({
              index: i,
              hasSubject: !!e?.subject,
              hasBody: !!e?.body,
              subject: e?.subject?.substring(0, 50) + '...'
            }))
          : null
      },

      // TLDR analysis
      tldr: {
        exists: !!lm.tldr,
        type: typeof lm.tldr,
        fields: lm.tldr ? Object.keys(lm.tldr) : []
      },

      // Raw data for verification
      raw: {
        content: lm.content,
        marketplace_listing: lm.marketplace_listing,
        email_sequence: lm.email_sequence,
        tldr: lm.tldr
      }
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analysis, null, 2)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
