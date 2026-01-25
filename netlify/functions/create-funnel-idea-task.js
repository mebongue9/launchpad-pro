// netlify/functions/create-funnel-idea-task.js
// Creates a task record and triggers background processing, returns immediately
// PART OF: Background funnel idea generation system
// RELEVANT FILES: process-funnel-idea-task-background.js, get-funnel-idea-task.js, FunnelBuilder.jsx

import { createClient } from '@supabase/supabase-js';

const LOG_TAG = '[CREATE-FUNNEL-IDEA-TASK]';

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
    const body = JSON.parse(event.body);
    const { profile, audience, existing_product, user_id } = body;

    // Validate required fields
    if (!profile) {
      console.log(`${LOG_TAG} Missing profile`);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'profile is required' })
      };
    }

    if (!audience) {
      console.log(`${LOG_TAG} Missing audience`);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'audience is required' })
      };
    }

    console.log(`${LOG_TAG} Creating task for profile: ${profile.name}, audience: ${audience.name}`);

    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Create task record with all input data
    const { data: task, error } = await supabase
      .from('funnel_idea_tasks')
      .insert({
        task_type: 'funnel_idea',
        status: 'pending',
        input_data: {
          profile,
          audience,
          existing_product: existing_product || null,
          user_id: user_id || null
        }
      })
      .select()
      .single();

    if (error) {
      console.error(`${LOG_TAG} Database error:`, error);
      throw error;
    }

    console.log(`${LOG_TAG} Task created with ID: ${task.id}`);

    // Trigger background function (fire-and-forget)
    const backgroundUrl = `${process.env.URL || 'http://localhost:8888'}/.netlify/functions/process-funnel-idea-task-background`;

    console.log(`${LOG_TAG} Triggering background function at: ${backgroundUrl}`);

    fetch(backgroundUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: task.id })
    }).catch(err => {
      console.error(`${LOG_TAG} Failed to trigger background task (non-blocking):`, err.message);
    });

    // Return immediately with task ID (< 1 second response)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        task_id: task.id,
        status: 'pending',
        message: 'Funnel idea generation started'
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
