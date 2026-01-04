// /netlify/functions/check-job-status.js
// Returns current status and progress of a generation job
// Called by frontend polling every 3 seconds
// RELEVANT FILES: start-generation.js, process-generation-background.js, src/hooks/useGenerationJob.jsx

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
    const { job_id } = JSON.parse(event.body);

    if (!job_id) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'job_id is required' })
      };
    }

    // Fetch job status
    const { data: job, error } = await supabase
      .from('generation_jobs')
      .select(`
        id,
        status,
        job_type,
        total_chunks,
        completed_chunks,
        current_chunk_name,
        chunks_data,
        result,
        error_message,
        failed_at_chunk,
        retry_count,
        created_at,
        updated_at,
        completed_at
      `)
      .eq('id', job_id)
      .single();

    if (error) {
      console.error('Error fetching job:', error);
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Job not found' })
      };
    }

    // Calculate progress percentage
    let progress = 0;
    if (job.total_chunks && job.total_chunks > 0) {
      progress = Math.round((job.completed_chunks / job.total_chunks) * 100);
    } else if (job.status === 'complete') {
      progress = 100;
    }

    // Build response
    const response = {
      job_id: job.id,
      status: job.status,
      job_type: job.job_type,
      progress,
      total_chunks: job.total_chunks,
      completed_chunks: job.completed_chunks,
      current_chunk_name: job.current_chunk_name,
      created_at: job.created_at,
      updated_at: job.updated_at
    };

    // Include result only if complete
    if (job.status === 'complete' && job.result) {
      response.result = job.result;
      response.completed_at = job.completed_at;
    }

    // Include error info if failed
    if (job.status === 'failed') {
      response.error_message = job.error_message;
      response.failed_at_chunk = job.failed_at_chunk;
      response.retry_count = job.retry_count;
      // Include partial results if any chunks completed
      if (job.chunks_data && job.chunks_data.length > 0) {
        response.partial_result = job.chunks_data;
        response.can_resume = true;
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Check job status error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
}
