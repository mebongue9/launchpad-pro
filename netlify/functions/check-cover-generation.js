// netlify/functions/check-cover-generation.js
// Frontend polls this to check job status and get results
// PART OF: Cover Lab background task system
// RELEVANT FILES: start-cover-generation.js, process-cover-generation-background.js, CreativeLab.jsx

import { createClient } from '@supabase/supabase-js';

const LOG_TAG = '[CHECK-COVER-GENERATION]';

export async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const jobId = event.queryStringParameters?.jobId;

  if (!jobId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'jobId is required' })
    };
  }

  console.log(`${LOG_TAG} Checking job: ${jobId}`);

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: job, error } = await supabase
      .from('cover_generation_jobs')
      .select('status, variations, error_message, created_at, started_at')
      .eq('id', jobId)
      .single();

    if (error || !job) {
      console.log(`${LOG_TAG} Job not found: ${jobId}`);
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Job not found' })
      };
    }

    console.log(`${LOG_TAG} Job ${jobId} status: ${job.status}`);

    // Calculate elapsed time for progress messages
    const startedAt = job.started_at ? new Date(job.started_at) : null;
    const elapsed = startedAt ? Math.floor((Date.now() - startedAt.getTime()) / 1000) : 0;

    // Return based on status
    switch (job.status) {
      case 'pending':
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'pending',
            message: 'Job queued, waiting to start...'
          })
        };

      case 'processing':
        // Provide progress messages based on elapsed time
        let progressMessage = 'Generating cover variations...';
        if (elapsed > 60) {
          progressMessage = 'Still working... Claude is creating detailed designs.';
        } else if (elapsed > 30) {
          progressMessage = 'Designing variations... almost there!';
        } else if (elapsed > 10) {
          progressMessage = 'Claude is analyzing and creating HTML/CSS...';
        }

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'processing',
            message: progressMessage,
            elapsed: elapsed
          })
        };

      case 'completed':
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'completed',
            variations: job.variations
          })
        };

      case 'failed':
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'failed',
            error: job.error_message || 'Unknown error occurred'
          })
        };

      default:
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Unknown job status' })
        };
    }

  } catch (error) {
    console.error(`${LOG_TAG} Error:`, error.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
}
