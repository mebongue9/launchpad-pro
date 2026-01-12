// netlify/functions/recover-lead-magnet-data.js
// ONE-TIME recovery script to save generated content to lead_magnets table
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

  const { lead_magnet_id, job_id, funnel_id, action } = JSON.parse(event.body || '{}');

  try {
    // If funnel_id provided, look up lead_magnet_id and find the job
    let resolvedLeadMagnetId = lead_magnet_id;
    let resolvedJobId = job_id;

    if (funnel_id && !lead_magnet_id) {
      // Get lead_magnet for this funnel
      const { data: leadMagnet, error: lmError } = await supabase
        .from('lead_magnets')
        .select('id')
        .eq('funnel_id', funnel_id)
        .single();

      if (lmError) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Lead magnet not found for funnel', funnel_id })
        };
      }
      resolvedLeadMagnetId = leadMagnet.id;

      // Also find the most recent lead_magnet_content job for this funnel
      if (!job_id) {
        const { data: job, error: jobFindError } = await supabase
          .from('generation_jobs')
          .select('id')
          .eq('job_type', 'lead_magnet_content')
          .contains('input_data', { funnel_id })
          .eq('status', 'complete')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!jobFindError && job) {
          resolvedJobId = job.id;
        }
      }
    }

    if (!resolvedLeadMagnetId || !resolvedJobId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Could not resolve lead_magnet_id or job_id',
          resolved: { lead_magnet_id: resolvedLeadMagnetId, job_id: resolvedJobId }
        })
      };
    }
    // Get the job result
    const { data: job, error: jobError } = await supabase
      .from('generation_jobs')
      .select('result, job_type')
      .eq('id', resolvedJobId)
      .single();

    if (jobError) throw jobError;

    if (!job?.result) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Job result not found', job_id: resolvedJobId })
      };
    }

    // Check what data exists in the result
    const result = job.result;
    const analysis = {
      job_type: job.job_type,
      has_cover: !!result.cover,
      has_chapters: Array.isArray(result.chapters) && result.chapters.length > 0,
      chapter_count: result.chapters?.length || 0,
      has_title: !!result.title
    };

    if (action === 'analyze') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis, result_preview: { ...result, chapters: result.chapters?.map(c => ({ title: c.title })) } })
      };
    }

    if (action === 'recover_content') {
      // Build content structure matching what frontend expects
      const content = {
        cover: result.cover,
        chapters: result.chapters
      };

      const { error: updateError } = await supabase
        .from('lead_magnets')
        .update({
          content: content,
          updated_at: new Date().toISOString()
        })
        .eq('id', resolvedLeadMagnetId);

      if (updateError) throw updateError;

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Lead magnet content recovered and saved',
          lead_magnet_id: resolvedLeadMagnetId,
          job_id: resolvedJobId,
          chapters_saved: result.chapters?.length || 0
        })
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid action. Use "analyze" or "recover_content"' })
    };

  } catch (error) {
    console.error('Recovery error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
