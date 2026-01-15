// netlify/functions/start-cover-generation.js
// Creates a job record and triggers background processing, returns immediately
// PART OF: Cover Lab background task system
// RELEVANT FILES: process-cover-generation-background.js, check-cover-generation.js, CreativeLab.jsx

import { createClient } from '@supabase/supabase-js';

const LOG_TAG = '[START-COVER-GENERATION]';

export async function handler(event) {
  console.log(`${LOG_TAG} Function invoked`);

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { analysisResult } = JSON.parse(event.body);

    if (!analysisResult) {
      console.log(`${LOG_TAG} Missing analysisResult`);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'analysisResult is required' })
      };
    }

    console.log(`${LOG_TAG} Creating job with analysis:`, JSON.stringify(analysisResult).substring(0, 200));

    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Create job record
    const { data: job, error } = await supabase
      .from('cover_generation_jobs')
      .insert({
        status: 'pending',
        analysis_result: analysisResult
      })
      .select()
      .single();

    if (error) {
      console.error(`${LOG_TAG} Database error:`, error);
      throw error;
    }

    console.log(`${LOG_TAG} Job created with ID: ${job.id}`);

    // Note: Background function is triggered directly by the frontend
    // This avoids issues with function-to-function calls in Netlify

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        jobId: job.id,
        message: 'Generation started'
      })
    };

  } catch (error) {
    console.error(`${LOG_TAG} Error:`, error.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
}
