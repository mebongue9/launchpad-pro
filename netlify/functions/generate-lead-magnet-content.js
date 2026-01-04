// /netlify/functions/generate-lead-magnet-content.js
// STARTER function - creates job and triggers background generation
// Background function generates content section-by-section to avoid token limits
// RELEVANT FILES: generate-lead-magnet-background.js, check-job-status.js

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const LOG_TAG = '[LEAD-MAGNET-START]';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function handler(event) {
  console.log(`🚀 ${LOG_TAG} Starting lead magnet content generation`);

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { lead_magnet, profile, audience, front_end, language } = JSON.parse(event.body || '{}');

    console.log(`📥 ${LOG_TAG} Lead magnet:`, lead_magnet?.title);
    console.log(`📥 ${LOG_TAG} Profile:`, profile?.name);
    console.log(`📥 ${LOG_TAG} Language:`, language);

    if (!lead_magnet || !profile || !audience || !front_end) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Create job record
    const jobId = crypto.randomUUID();
    console.log(`📝 ${LOG_TAG} Creating job:`, jobId);

    const { error: jobError } = await supabase
      .from('generation_jobs')
      .insert({
        id: jobId,
        user_id: profile.user_id || profile.id, // Handle both formats
        job_type: 'lead_magnet_content',
        status: 'pending',
        total_chunks: 8, // cover + 5 chapters + bridge + cta
        completed_chunks: 0,
        current_chunk_name: 'Starting generation...',
        input_data: { lead_magnet, profile, audience, front_end, language }
      });

    if (jobError) {
      console.error(`❌ ${LOG_TAG} Failed to create job:`, jobError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to create job' })
      };
    }

    // Trigger background function
    const siteUrl = process.env.URL || 'https://launchpad-pro-app.netlify.app';
    const backgroundUrl = `${siteUrl}/.netlify/functions/generate-lead-magnet-background`;

    console.log(`🔄 ${LOG_TAG} Triggering background function:`, backgroundUrl);

    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const bgResponse = await fetch(backgroundUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, lead_magnet, profile, audience, front_end, language }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      console.log(`📡 ${LOG_TAG} Background response status:`, bgResponse.status);

      if (!bgResponse.ok) {
        console.error(`❌ ${LOG_TAG} Background function failed:`, bgResponse.status);
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
      if (bgError.name === 'AbortError') {
        console.log(`⏱️ ${LOG_TAG} Background function timed out (may still be running)`);
        await supabase
          .from('generation_jobs')
          .update({
            status: 'processing',
            current_chunk_name: 'Processing...',
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
      } else {
        console.error(`❌ ${LOG_TAG} Background trigger failed:`, bgError.message);
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

    console.log(`✅ ${LOG_TAG} Job started:`, jobId);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        job_id: jobId,
        message: 'Lead magnet generation started'
      })
    };

  } catch (error) {
    console.error(`❌ ${LOG_TAG} Error:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
