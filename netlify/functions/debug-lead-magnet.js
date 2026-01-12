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

    // Analyze what data exists
    const analysis = {
      lead_magnet_id,
      name: lm.name,
      funnel_id: lm.funnel_id,  // Check if funnel_id is set

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
