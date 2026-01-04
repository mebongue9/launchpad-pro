// /netlify/functions/generate-supplementary-content.js
// Starts background job to generate TLDRs and cross-promos AFTER user saves a funnel
// Returns immediately with job_id - frontend polls check-job-status for progress
// RELEVANT FILES: src/hooks/useFunnels.jsx, generate-supplementary-background.js, check-job-status.js

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function handler(event) {
  console.log('🚀 [SUPPLEMENTARY-START] Starting supplementary content job');

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { funnel_id, user_id } = JSON.parse(event.body || '{}');
    console.log('📥 [SUPPLEMENTARY-START] Funnel ID:', funnel_id);
    console.log('📥 [SUPPLEMENTARY-START] User ID:', user_id);

    if (!funnel_id || !user_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'funnel_id and user_id required' })
      };
    }

    // Create job record
    const jobId = crypto.randomUUID();
    console.log('📝 [SUPPLEMENTARY-START] Creating job:', jobId);

    const { error: jobError } = await supabase
      .from('generation_jobs')
      .insert({
        id: jobId,
        user_id: user_id,
        job_type: 'supplementary_content',
        status: 'pending',
        total_chunks: 7, // 4 TLDRs + 3 cross-promos (estimate)
        completed_chunks: 0,
        current_chunk_name: 'Starting document generation...',
        input_data: { funnel_id, user_id }
      });

    if (jobError) {
      console.error('❌ [SUPPLEMENTARY-START] Failed to create job:', jobError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to create job' })
      };
    }

    // Trigger background function with proper error handling
    const siteUrl = process.env.URL || 'https://launchpad-pro-app.netlify.app';
    const backgroundUrl = `${siteUrl}/.netlify/functions/generate-supplementary-background`;

    console.log('🔄 [SUPPLEMENTARY-START] Triggering background function:', backgroundUrl);

    // Use AbortController for timeout (8 seconds to stay under Netlify limit)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const bgResponse = await fetch(backgroundUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, funnel_id, user_id }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      console.log('📡 [SUPPLEMENTARY-START] Background response status:', bgResponse.status);

      if (!bgResponse.ok) {
        console.error('❌ [SUPPLEMENTARY-START] Background function returned error:', bgResponse.status);
        // Mark job as failed so user knows
        await supabase
          .from('generation_jobs')
          .update({
            status: 'failed',
            error_message: `Background function failed with status ${bgResponse.status}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
      }
    } catch (bgError) {
      clearTimeout(timeoutId);
      // If it's an abort, the function might still be running (just slow to respond)
      if (bgError.name === 'AbortError') {
        console.log('⏱️ [SUPPLEMENTARY-START] Background function timed out (may still be running)');
        // Update job to show it's processing (optimistic)
        await supabase
          .from('generation_jobs')
          .update({
            status: 'processing',
            current_chunk_name: 'Processing (started)...',
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
      } else {
        console.error('❌ [SUPPLEMENTARY-START] Background trigger failed:', bgError.message);
        // Mark job as failed
        await supabase
          .from('generation_jobs')
          .update({
            status: 'failed',
            error_message: `Failed to trigger background: ${bgError.message}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
      }
    }

    console.log('✅ [SUPPLEMENTARY-START] Job started:', jobId);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        job_id: jobId,
        message: 'Document generation started'
      })
    };

  } catch (error) {
    console.error('❌ [SUPPLEMENTARY-START] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
