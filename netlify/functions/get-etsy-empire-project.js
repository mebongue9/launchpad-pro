// netlify/functions/get-etsy-empire-project.js
// GET endpoint for frontend to poll project status
// PART OF: Etsy Empire visual generation system
// RELEVANT FILES: create-etsy-empire-project.js, process-etsy-empire-background.js

import { createClient } from '@supabase/supabase-js';

const LOG_TAG = '[GET-ETSY-EMPIRE-PROJECT]';

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
    // Get project_id from query params (GET) or body (POST)
    let projectId;
    if (event.httpMethod === 'GET') {
      const params = event.queryStringParameters || {};
      projectId = params.project_id;
    } else {
      const body = JSON.parse(event.body || '{}');
      projectId = body.project_id;
    }

    if (!projectId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing project_id parameter' })
      };
    }

    console.log(`${LOG_TAG} Checking status for project: ${projectId}`);

    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from('etsy_empire_projects')
      .select(`
        id,
        status,
        product_title,
        total_tasks,
        completed_tasks,
        failed_tasks,
        estimated_cost,
        actual_cost,
        last_error,
        created_at,
        started_at,
        completed_at
      `)
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.log(`${LOG_TAG} Project not found: ${projectId}`);
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Project not found' })
      };
    }

    // Build response based on status
    const response = {
      project_id: project.id,
      status: project.status,
      product_title: project.product_title,
      total_tasks: project.total_tasks,
      completed_tasks: project.completed_tasks,
      failed_tasks: project.failed_tasks,
      created_at: project.created_at
    };

    // Status-specific responses
    switch (project.status) {
      case 'pending':
        response.message = 'Queued for processing...';
        break;

      case 'processing':
        response.message = `Generating image ${project.completed_tasks + 1} of ${project.total_tasks}...`;
        response.started_at = project.started_at;
        // Calculate elapsed time
        if (project.started_at) {
          const elapsed = Math.floor((Date.now() - new Date(project.started_at).getTime()) / 1000);
          response.elapsed_seconds = elapsed;
        }
        break;

      case 'completed':
        response.message = 'Generation complete!';
        response.completed_at = project.completed_at;
        response.actual_cost = project.actual_cost;

        // Fetch assets
        const { data: assets, error: assetsError } = await supabase
          .from('etsy_empire_assets')
          .select(`
            id,
            asset_type,
            asset_category,
            public_url,
            width,
            height,
            pin_description,
            pin_alt_text
          `)
          .eq('project_id', projectId)
          .order('asset_type', { ascending: true })
          .order('asset_category', { ascending: true });

        if (!assetsError && assets) {
          response.assets = assets;
          response.etsy_count = assets.filter(a => a.asset_type === 'etsy_slide').length;
          response.pinterest_count = assets.filter(a => a.asset_type === 'pinterest_pin').length;
        }

        // Fetch spintax
        const { data: spintax, error: spintaxError } = await supabase
          .from('etsy_empire_spintax')
          .select('master_description, master_alt_text, full_payload')
          .eq('project_id', projectId)
          .single();

        if (!spintaxError && spintax) {
          response.spintax = spintax;
        }
        break;

      case 'failed':
        response.message = 'Generation failed';
        response.error = project.last_error || 'Unknown error occurred';
        response.completed_at = project.completed_at;
        break;
    }

    console.log(`${LOG_TAG} Project ${projectId} status: ${project.status} (${project.completed_tasks}/${project.total_tasks})`);

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
