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
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { job_type, input_data, user_id } = JSON.parse(event.body);

    // Validate required fields
    if (!job_type || !input_data || !user_id) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'job_type, input_data, and user_id are required' })
      };
    }

    // Validate job_type
    const validJobTypes = ['lead_magnet_content', 'lead_magnet_ideas', 'funnel', 'funnel_product'];
    if (!validJobTypes.includes(job_type)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Invalid job_type. Must be one of: ${validJobTypes.join(', ')}` })
      };
    }

    // Create job record in database
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
      console.error('Error creating job:', insertError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to create generation job' })
      };
    }

    // Trigger background processing
    // We need to await this to ensure the request is sent before the function terminates
    const backgroundUrl = `${process.env.URL || 'https://launchpad-pro-app.netlify.app'}/.netlify/functions/process-generation-background`;

    try {
      // Fire the request and wait for initial response (background functions return 202 immediately)
      const bgResponse = await fetch(backgroundUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: job.id })
      });
      console.log(`Background function triggered: ${bgResponse.status}`);
    } catch (err) {
      // Log but don't fail - the job is created and can be retried
      console.error('Failed to trigger background function:', err);
    }

    // Return job_id immediately
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
    console.error('Start generation error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
}
