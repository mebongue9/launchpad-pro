// netlify/functions/get-funnel-idea-task.js
// GET endpoint for frontend to poll task status
// PART OF: Background funnel idea generation system
// RELEVANT FILES: create-funnel-idea-task.js, process-funnel-idea-task-background.js, FunnelBuilder.jsx

import { createClient } from '@supabase/supabase-js';

const LOG_TAG = '[GET-FUNNEL-IDEA-TASK]';

export async function handler(event) {
  // Allow both GET and POST for flexibility
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get task_id from query params (GET) or body (POST)
    let taskId;
    if (event.httpMethod === 'GET') {
      const params = event.queryStringParameters || {};
      taskId = params.task_id;
    } else {
      const body = JSON.parse(event.body || '{}');
      taskId = body.task_id;
    }

    if (!taskId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing task_id parameter' })
      };
    }

    console.log(`${LOG_TAG} Checking status for task: ${taskId}`);

    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch task
    const { data: task, error } = await supabase
      .from('funnel_idea_tasks')
      .select('id, status, output_data, validation_results, error_message, created_at, completed_at')
      .eq('id', taskId)
      .single();

    if (error || !task) {
      console.log(`${LOG_TAG} Task not found: ${taskId}`);
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Task not found' })
      };
    }

    // Build response based on status
    const response = {
      task_id: task.id,
      status: task.status,
      created_at: task.created_at
    };

    if (task.status === 'completed') {
      response.result = task.output_data;
      response.validation = task.validation_results;
      response.completed_at = task.completed_at;
    }

    if (task.status === 'failed') {
      response.error = task.error_message || 'Generation failed';
    }

    console.log(`${LOG_TAG} Task ${taskId} status: ${task.status}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
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
