// netlify/functions/create-etsy-empire-project.js
// Creates a project record and task records, triggers background processing, returns immediately
// PART OF: Etsy Empire visual generation system
// RELEVANT FILES: process-etsy-empire-background.js, get-etsy-empire-project.js

import { createClient } from '@supabase/supabase-js';

const LOG_TAG = '[CREATE-ETSY-EMPIRE-PROJECT]';

// 10 Etsy slide types (per vision doc Part 13)
const ETSY_SLIDE_TYPES = [
  'hero',           // Dual iPad overlap, product title at top
  'detail',         // Single iPad at angle showing content
  'feature',        // iPad with text callouts pointing to features
  'cascading',      // Multiple printed pages fanning diagonally
  'book',           // Physical textured book alongside iPad
  'index',          // iPad straight-on showing table of contents
  'cover_options',  // Two iPads showing different cover designs
  'features_layout',// iPad on left, feature list on right
  'floating',       // Large iPad with separate page floating beside
  'library'         // Grid of items showing volume of content
];

// 6 Pinterest pin categories (per vision doc Part 13)
const PINTEREST_CATEGORIES = [
  'quote',          // Quote/Affirmation Card - motivational text
  'lifestyle',      // iPad in Use - hands holding iPad showing planner
  'desk',           // Clean Desk Setup - minimal workspace flatlay
  'mood',           // Mood Board Collage - grid of aspirational images
  'planner_hands',  // Physical Planner in Hands - holding/flipping printed pages
  'flatlay'         // Flatlay with Props - product pages with styled accessories
];

// Cost per image (Imagen 3 Nano pricing)
const COST_PER_IMAGE = 0.03;

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
    const {
      pdf_url,
      product_title,
      tldr_text,
      secondary_benefits = [],
      funnel_id = null,
      product_type = null,
      pinterest_enabled = true,
      manifestable_ratio = 0.70,
      user_id
    } = body;

    // Validate required fields
    if (!pdf_url) {
      console.log(`${LOG_TAG} Missing pdf_url`);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'pdf_url is required' })
      };
    }

    if (!product_title) {
      console.log(`${LOG_TAG} Missing product_title`);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'product_title is required' })
      };
    }

    if (!tldr_text) {
      console.log(`${LOG_TAG} Missing tldr_text`);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'tldr_text is required' })
      };
    }

    if (!user_id) {
      console.log(`${LOG_TAG} Missing user_id`);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'user_id is required' })
      };
    }

    // Validate manifestable_ratio range
    const ratio = Math.max(0.50, Math.min(0.90, manifestable_ratio));

    // Calculate total tasks and estimated cost
    const etsyTaskCount = ETSY_SLIDE_TYPES.length; // 10
    const pinterestTaskCount = pinterest_enabled ? 32 : 0;
    const totalTasks = etsyTaskCount + pinterestTaskCount;
    const estimatedCost = totalTasks * COST_PER_IMAGE;

    console.log(`${LOG_TAG} Creating project: "${product_title}"`);
    console.log(`${LOG_TAG} Pinterest enabled: ${pinterest_enabled}, Total tasks: ${totalTasks}, Est. cost: $${estimatedCost.toFixed(2)}`);

    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Create project record
    const { data: project, error: projectError } = await supabase
      .from('etsy_empire_projects')
      .insert({
        user_id,
        pdf_url,
        product_title,
        tldr_text,
        secondary_benefits,
        funnel_id,
        product_type,
        pinterest_enabled,
        manifestable_ratio: ratio,
        status: 'pending',
        total_tasks: totalTasks,
        completed_tasks: 0,
        failed_tasks: 0,
        estimated_cost: estimatedCost,
        actual_cost: 0
      })
      .select()
      .single();

    if (projectError) {
      console.error(`${LOG_TAG} Project creation error:`, projectError);
      throw projectError;
    }

    console.log(`${LOG_TAG} Project created with ID: ${project.id}`);

    // Create task records
    const tasks = [];

    // Create 10 Etsy slide tasks
    for (const slideType of ETSY_SLIDE_TYPES) {
      tasks.push({
        project_id: project.id,
        task_type: 'etsy_slide',
        slide_type: slideType,
        variation_number: 1,
        prompt: '', // Built during processing based on manifestable_ratio
        status: 'queued'
      });
    }

    // Create 32 Pinterest pin tasks if enabled (spread across 6 categories)
    if (pinterest_enabled) {
      // Distribute 32 pins across 6 categories
      // 6 categories × 5 = 30, plus 2 extra for quote and lifestyle = 32
      const pinsPerCategory = {
        'quote': 6,           // More quote cards
        'lifestyle': 6,       // More lifestyle shots
        'desk': 5,
        'mood': 5,
        'planner_hands': 5,
        'flatlay': 5
      };

      for (const [category, count] of Object.entries(pinsPerCategory)) {
        for (let i = 1; i <= count; i++) {
          tasks.push({
            project_id: project.id,
            task_type: 'pinterest_pin',
            slide_type: category,
            variation_number: i,
            prompt: '', // Built during processing based on manifestable_ratio
            status: 'queued'
          });
        }
      }
    }

    console.log(`${LOG_TAG} Creating ${tasks.length} task records...`);

    // Insert all tasks
    const { error: tasksError } = await supabase
      .from('etsy_empire_tasks')
      .insert(tasks);

    if (tasksError) {
      console.error(`${LOG_TAG} Tasks creation error:`, tasksError);
      // Clean up project if tasks fail
      await supabase.from('etsy_empire_projects').delete().eq('id', project.id);
      throw tasksError;
    }

    console.log(`${LOG_TAG} ${tasks.length} tasks created successfully`);

    // Trigger background function (fire-and-forget)
    const backgroundUrl = `${process.env.URL || 'http://localhost:8888'}/.netlify/functions/process-etsy-empire-background`;

    console.log(`${LOG_TAG} Triggering background function at: ${backgroundUrl}`);

    fetch(backgroundUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: project.id })
    }).catch(err => {
      console.error(`${LOG_TAG} Failed to trigger background task (non-blocking):`, err.message);
    });

    // Return immediately with project ID (< 1 second response)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        project_id: project.id,
        status: 'pending',
        total_tasks: totalTasks,
        estimated_cost: estimatedCost,
        message: 'Etsy Empire generation started'
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
