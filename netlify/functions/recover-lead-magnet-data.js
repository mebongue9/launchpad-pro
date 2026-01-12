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

  const { lead_magnet_id, job_id, action } = JSON.parse(event.body || '{}');

  if (!lead_magnet_id || !job_id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing lead_magnet_id or job_id' })
    };
  }

  try {
    // Get the job result
    const { data: job, error: jobError } = await supabase
      .from('generation_jobs')
      .select('result, job_type')
      .eq('id', job_id)
      .single();

    if (jobError) throw jobError;

    if (!job?.result) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Job result not found', job_id })
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
        .eq('id', lead_magnet_id);

      if (updateError) throw updateError;

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Lead magnet content recovered and saved',
          lead_magnet_id,
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
