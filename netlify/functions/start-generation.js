// /netlify/functions/start-generation.js
// Creates a generation job and triggers background processing
// Returns job_id immediately (< 1 second response)
// RELEVANT FILES: check-job-status.js, process-generation-background.js

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function handler(event) {
  console.log('🚀 [START-GENERATION] Function invoked', { method: event.httpMethod });

  if (event.httpMethod !== 'POST') {
    console.log('❌ [START-GENERATION] Method not allowed:', event.httpMethod);
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { job_type, input_data, user_id } = JSON.parse(event.body);

    console.log('📥 [START-GENERATION] Received parameters:', {
      job_type,
      user_id,
      input_data_keys: input_data ? Object.keys(input_data) : 'none'
    });

    console.log('🔧 [START-GENERATION] Environment check:', {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      URL: process.env.URL || 'not set'
    });

    // Validate required fields
    if (!job_type || !input_data || !user_id) {
      console.log('❌ [START-GENERATION] Missing required fields:', {
        job_type: !!job_type,
        input_data: !!input_data,
        user_id: !!user_id
      });
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'job_type, input_data, and user_id are required' })
      };
    }

    // Validate job_type
    const validJobTypes = ['lead_magnet_content', 'lead_magnet_ideas', 'funnel', 'funnel_product', 'funnel_remaining_content'];
    if (!validJobTypes.includes(job_type)) {
      console.log('❌ [START-GENERATION] Invalid job_type:', job_type);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Invalid job_type. Must be one of: ${validJobTypes.join(', ')}` })
      };
    }

    // Create job record in database
    console.log('🔄 [START-GENERATION] Creating job record in Supabase...');
    const { data: job, error: insertError } = await supabase
      .from('generation_jobs')
      .insert({
        user_id,
        job_type,
        input_data,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ [START-GENERATION] Error creating job:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details
      });
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to create generation job' })
      };
    }

    console.log('✅ [START-GENERATION] Job created successfully:', {
      job_id: job.id,
      job_type: job.job_type,
      status: job.status
    });

    // Trigger background processing
    // We need to await this to ensure the request is sent before the function terminates
    const backgroundUrl = `${process.env.URL || 'https://launchpad-pro-app.netlify.app'}/.netlify/functions/process-generation-background`;
    console.log('🔄 [START-GENERATION] Triggering background function:', backgroundUrl);

    try {
      // Fire the request and wait for initial response (background functions return 202 immediately)
      const bgResponse = await fetch(backgroundUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: job.id })
      });
      console.log('✅ [START-GENERATION] Background function triggered:', {
        status: bgResponse.status,
        statusText: bgResponse.statusText
      });
    } catch (err) {
      // Log but don't fail - the job is created and can be retried
      console.error('⚠️ [START-GENERATION] Failed to trigger background function:', {
        message: err.message,
        cause: err.cause
      });
    }

    // Return job_id immediately
    console.log('✅ [START-GENERATION] Function completed successfully, returning job_id:', job.id);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: job.id,
        status: 'pending',
        message: 'Generation started. Poll check-job-status for progress.'
      })
    };

  } catch (error) {
    console.error('❌ [START-GENERATION] Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
}
