// netlify/functions/check-generation-progress.js
// Checks progress of batched generation tasks
// Frontend polls this endpoint to update progress display
// RELEVANT FILES: lib/task-orchestrator.js, src/hooks/useGenerationJob.jsx

import { createClient } from '@supabase/supabase-js';
import { reportProgress } from './lib/task-orchestrator.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LOG_TAG = '[CHECK-GENERATION-PROGRESS]';

export async function handler(event) {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const params = event.httpMethod === 'GET'
      ? event.queryStringParameters
      : JSON.parse(event.body || '{}');

    const { funnel_id } = params;

    if (!funnel_id) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing funnel_id' })
      };
    }

    console.log(`🔍 ${LOG_TAG} Checking progress for funnel:`, funnel_id);

    // Get progress from task orchestrator
    const progress = await reportProgress(funnel_id);

    console.log(`📊 ${LOG_TAG} Progress:`, progress);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        funnel_id,
        progress,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error(`❌ ${LOG_TAG} Error:`, error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
}
