// netlify/functions/process-etsy-empire-background.js
// Background function that processes Etsy Empire image generation tasks
// Uses Google Imagen 3 via Vertex AI for image generation
// PART OF: Etsy Empire visual generation system
// RELEVANT FILES: create-etsy-empire-project.js, get-etsy-empire-project.js

import { createClient } from '@supabase/supabase-js';
import { GoogleAuth } from 'google-auth-library';

const LOG_TAG = '[PROCESS-ETSY-EMPIRE-BG]';

// Constants
const REGION = 'us-central1';
const MODEL = 'imagen-3.0-generate-002';
const COST_PER_IMAGE = 0.03;
const MAX_CONCURRENT = 5;
const RETRY_DELAYS = [0, 5000, 30000, 120000, 300000]; // ms: immediate, 5s, 30s, 2min, 5min

// ============================================================
// PROMPT TEMPLATES
// ============================================================

const ETSY_SLIDE_PROMPTS = {
  hero: `Professional product mockup for digital planner listing. Two iPads overlapping at slight angles on light beige linen surface, displaying "{PRODUCT_TITLE}" digital planner pages. Minimal composition with generous negative space. Golden hour lighting from top-left creating soft elongated shadows. Soft-minimalist luxury aesthetic. No text overlays. 4:5 aspect ratio.

AESTHETIC REQUIREMENTS:
- Soft-minimalist luxury style
- Light beige linen background (#F5F5DC) or linen white (#FAF0E6)
- Golden hour lighting from top-left at 45 degrees
- Elongated soft shadows (window-pane or botanical pattern)
- Generous negative space
- NO busy elements, NO loud colors, NO Canva template look
- Professional product photography quality`,

  detail: `Single iPad Pro at 15-degree angle on light oak desk surface, screen showing detailed page from "{PRODUCT_TITLE}" planner. Soft window light from left creating gentle shadow. Minimalist composition, no props. Beige linen cloth visible at edge. Professional product photography. 4:5 aspect ratio.

AESTHETIC REQUIREMENTS:
- Soft-minimalist luxury style
- Light beige linen background (#F5F5DC) or linen white (#FAF0E6)
- Golden hour lighting from top-left at 45 degrees
- Elongated soft shadows (window-pane or botanical pattern)
- Generous negative space
- NO busy elements, NO loud colors, NO Canva template look
- Professional product photography quality`,

  feature: `iPad displaying "{PRODUCT_TITLE}" digital planner on cream linen background. Clean product shot with soft natural lighting. Space around device for potential text callouts. Luxury minimalist aesthetic. Golden hour warmth. 4:5 aspect ratio.

AESTHETIC REQUIREMENTS:
- Soft-minimalist luxury style
- Light beige linen background (#F5F5DC) or linen white (#FAF0E6)
- Golden hour lighting from top-left at 45 degrees
- Elongated soft shadows (window-pane or botanical pattern)
- Generous negative space
- NO busy elements, NO loud colors, NO Canva template look
- Professional product photography quality`,

  cascading: `Multiple printed planner pages from "{PRODUCT_TITLE}" fanning diagonally across light beige surface. Pages showing various sections of the planner. Soft shadows, golden hour lighting from top-left. Elegant paper cascade composition. No hands. 4:5 aspect ratio.

AESTHETIC REQUIREMENTS:
- Soft-minimalist luxury style
- Light beige linen background (#F5F5DC) or linen white (#FAF0E6)
- Golden hour lighting from top-left at 45 degrees
- Elongated soft shadows (window-pane or botanical pattern)
- Generous negative space
- NO busy elements, NO loud colors, NO Canva template look
- Professional product photography quality`,

  book: `Physical spiral-bound planner next to iPad showing same "{PRODUCT_TITLE}" content. Both on light oak wood surface. Textured paper visible on physical book. Soft minimalist styling with beige linen cloth accent. Professional product photography. 4:5 aspect ratio.

AESTHETIC REQUIREMENTS:
- Soft-minimalist luxury style
- Light beige linen background (#F5F5DC) or linen white (#FAF0E6)
- Golden hour lighting from top-left at 45 degrees
- Elongated soft shadows (window-pane or botanical pattern)
- Generous negative space
- NO busy elements, NO loud colors, NO Canva template look
- Professional product photography quality`,

  index: `iPad straight-on view showing table of contents or index page of "{PRODUCT_TITLE}" planner. Clean composition on cream surface. Soft diffused lighting, no harsh shadows. Focus on screen content visibility. Luxury minimal aesthetic. 4:5 aspect ratio.

AESTHETIC REQUIREMENTS:
- Soft-minimalist luxury style
- Light beige linen background (#F5F5DC) or linen white (#FAF0E6)
- Golden hour lighting from top-left at 45 degrees
- Elongated soft shadows (window-pane or botanical pattern)
- Generous negative space
- NO busy elements, NO loud colors, NO Canva template look
- Professional product photography quality`,

  cover_options: `Two iPads side by side showing different cover design options for "{PRODUCT_TITLE}" digital planner. Light beige linen background. Devices at slight angles toward each other. Soft shadows, professional lighting. Clean minimal composition. 4:5 aspect ratio.

AESTHETIC REQUIREMENTS:
- Soft-minimalist luxury style
- Light beige linen background (#F5F5DC) or linen white (#FAF0E6)
- Golden hour lighting from top-left at 45 degrees
- Elongated soft shadows (window-pane or botanical pattern)
- Generous negative space
- NO busy elements, NO loud colors, NO Canva template look
- Professional product photography quality`,

  features_layout: `iPad on left side of frame displaying "{PRODUCT_TITLE}" planner page. Right side has clean negative space on beige background. Soft natural lighting with gentle shadows. Room for feature list overlay. Minimalist product photography. 4:5 aspect ratio.

AESTHETIC REQUIREMENTS:
- Soft-minimalist luxury style
- Light beige linen background (#F5F5DC) or linen white (#FAF0E6)
- Golden hour lighting from top-left at 45 degrees
- Elongated soft shadows (window-pane or botanical pattern)
- Generous negative space
- NO busy elements, NO loud colors, NO Canva template look
- Professional product photography quality`,

  floating: `Large iPad showing "{PRODUCT_TITLE}" planner with single printed page floating beside it on light surface. Pages appear to lift off naturally. Soft shadows beneath both elements. Golden hour lighting. Elegant minimal composition. 4:5 aspect ratio.

AESTHETIC REQUIREMENTS:
- Soft-minimalist luxury style
- Light beige linen background (#F5F5DC) or linen white (#FAF0E6)
- Golden hour lighting from top-left at 45 degrees
- Elongated soft shadows (window-pane or botanical pattern)
- Generous negative space
- NO busy elements, NO loud colors, NO Canva template look
- Professional product photography quality`,

  library: `Grid layout showing multiple pages and sections from "{PRODUCT_TITLE}" planner arranged neatly on cream surface. Bird's eye view flatlay. Each page clearly visible. Demonstrates volume and variety of content. Soft even lighting. 4:5 aspect ratio.

AESTHETIC REQUIREMENTS:
- Soft-minimalist luxury style
- Light beige linen background (#F5F5DC) or linen white (#FAF0E6)
- Golden hour lighting from top-left at 45 degrees
- Elongated soft shadows (window-pane or botanical pattern)
- Generous negative space
- NO busy elements, NO loud colors, NO Canva template look
- Professional product photography quality`
};

const PINTEREST_PIN_PROMPTS = {
  quote: `Minimalist motivational quote card design. Solid light beige (#F5F5DC) textured linen background. Space for text overlay. Subtle grain texture. Soft warm lighting. Clean modern aesthetic suitable for Pinterest. Vertical 2:3 format. NO text in image.

AESTHETIC REQUIREMENTS:
- Soft-minimalist luxury style
- Light beige linen background (#F5F5DC) or linen white (#FAF0E6)
- Golden hour lighting from top-left at 45 degrees
- Elongated soft shadows (window-pane or botanical pattern)
- Generous negative space
- NO busy elements, NO loud colors, NO Canva template look
- Professional product photography quality`,

  lifestyle: `Feminine hands with neutral nail polish holding iPad displaying "{PRODUCT_TITLE}" digital planner. Cozy setting with cream knit blanket visible. Golden hour lighting. Anatomically correct hands with 5 fingers. Lifestyle photography for Pinterest. Vertical 2:3 format.

AESTHETIC REQUIREMENTS:
- Soft-minimalist luxury style
- Light beige linen background (#F5F5DC) or linen white (#FAF0E6)
- Golden hour lighting from top-left at 45 degrees
- Anatomically correct hands with exactly 5 fingers
- Feminine hands with neutral nail polish
- Generous negative space
- NO busy elements, NO loud colors, NO Canva template look
- Professional product photography quality`,

  desk: `Clean minimal desk flatlay with iPad showing "{PRODUCT_TITLE}" planner. Light wood desk, single coffee cup, small plant. Very minimal props. Soft overhead lighting. Aspirational workspace aesthetic for Pinterest. Vertical 2:3 format.

AESTHETIC REQUIREMENTS:
- Soft-minimalist luxury style
- Light beige linen background (#F5F5DC) or linen white (#FAF0E6)
- Golden hour lighting from top-left at 45 degrees
- Elongated soft shadows (window-pane or botanical pattern)
- Generous negative space
- NO busy elements, NO loud colors, NO Canva template look
- Professional product photography quality`,

  mood: `Mood board style collage grid featuring neutral tones, planners, coffee, cozy textures. Aspirational lifestyle imagery. Cream and beige color palette. Pinterest aesthetic grid layout. {PRODUCT_TITLE} planner visible in one section. Vertical 2:3 format.

AESTHETIC REQUIREMENTS:
- Soft-minimalist luxury style
- Light beige linen background (#F5F5DC) or linen white (#FAF0E6)
- Golden hour lighting from top-left at 45 degrees
- Elongated soft shadows (window-pane or botanical pattern)
- Generous negative space
- NO busy elements, NO loud colors, NO Canva template look
- Professional product photography quality`,

  planner_hands: `Feminine hands with neutral nails flipping through printed pages of "{PRODUCT_TITLE}" planner. Cream sweater sleeves visible. Cozy aesthetic. Anatomically correct hands with exactly 5 fingers. Soft natural lighting. Pinterest lifestyle content. Vertical 2:3 format.

AESTHETIC REQUIREMENTS:
- Soft-minimalist luxury style
- Light beige linen background (#F5F5DC) or linen white (#FAF0E6)
- Golden hour lighting from top-left at 45 degrees
- Anatomically correct hands with exactly 5 fingers
- Feminine hands with neutral nail polish
- Generous negative space
- NO busy elements, NO loud colors, NO Canva template look
- Professional product photography quality`,

  flatlay: `Styled flatlay of "{PRODUCT_TITLE}" planner pages with minimal props: dried eucalyptus, gold pen, linen napkin. Light beige surface. Soft shadows. Editorial product photography for Pinterest. Vertical 2:3 format.

AESTHETIC REQUIREMENTS:
- Soft-minimalist luxury style
- Light beige linen background (#F5F5DC) or linen white (#FAF0E6)
- Golden hour lighting from top-left at 45 degrees
- Elongated soft shadows (window-pane or botanical pattern)
- Generous negative space
- NO busy elements, NO loud colors, NO Canva template look
- Professional product photography quality`
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getAccessToken() {
  const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}

async function generateImage(prompt, aspectRatio) {
  const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const accessToken = await getAccessToken();
  const endpoint = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/publishers/google/models/${MODEL}:predict`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: aspectRatio,
        safetyFilterLevel: 'block_few',
        personGeneration: 'allow_adult'
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Imagen API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  if (!data.predictions || !data.predictions[0] || !data.predictions[0].bytesBase64Encoded) {
    throw new Error('Invalid response from Imagen API: no image data returned');
  }

  return data.predictions[0].bytesBase64Encoded;
}

function buildPrompt(task, project) {
  const { task_type, slide_type } = task;
  const { product_title, tldr_text } = project;

  // Get base prompt template
  const templates = task_type === 'etsy_slide' ? ETSY_SLIDE_PROMPTS : PINTEREST_PIN_PROMPTS;
  const template = templates[slide_type];

  if (!template) {
    console.warn(`${LOG_TAG} No template found for ${task_type}/${slide_type}, using generic`);
    return `Professional product mockup for "${product_title}" digital planner. Soft-minimalist luxury style. Light beige linen background. Golden hour lighting. 4:5 aspect ratio.`;
  }

  // Replace placeholders
  return template
    .replace(/{PRODUCT_TITLE}/g, product_title)
    .replace(/{TLDR}/g, tldr_text || '');
}

async function updateProjectStatus(supabase, projectId, status, extraFields = {}) {
  const updateData = { status, ...extraFields };

  if (status === 'completed' || status === 'failed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('etsy_empire_projects')
    .update(updateData)
    .eq('id', projectId);

  if (error) {
    console.error(`${LOG_TAG} Failed to update project status to ${status}:`, error);
    throw error;
  }

  console.log(`${LOG_TAG} Project ${projectId} status updated to: ${status}`);
}

async function getQueuedTasks(supabase, projectId) {
  const { data, error } = await supabase
    .from('etsy_empire_tasks')
    .select('id, task_type, slide_type, variation_number')
    .eq('project_id', projectId)
    .eq('status', 'queued');

  if (error) {
    console.error(`${LOG_TAG} Failed to fetch queued tasks:`, error);
    throw error;
  }

  return data || [];
}

async function getProject(supabase, projectId) {
  const { data, error } = await supabase
    .from('etsy_empire_projects')
    .select('id, user_id, product_title, tldr_text, manifestable_ratio, include_pinterest')
    .eq('id', projectId)
    .single();

  if (error) {
    console.error(`${LOG_TAG} Failed to fetch project:`, error);
    throw error;
  }

  return data;
}

async function updateTaskStatus(supabase, taskId, status, extraFields = {}) {
  const updateData = { status, ...extraFields };

  if (status === 'completed' || status === 'permanent_failure') {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('etsy_empire_tasks')
    .update(updateData)
    .eq('id', taskId);

  if (error) {
    console.error(`${LOG_TAG} Failed to update task ${taskId} status:`, error);
  }
}

async function createAssetRecord(supabase, task, projectId, userId, storagePath, publicUrl, aspectRatio) {
  const dimensions = aspectRatio === '4:5'
    ? { width: 1080, height: 1350 }
    : { width: 1000, height: 1500 }; // 2:3 Pinterest

  const { error } = await supabase
    .from('etsy_empire_assets')
    .insert({
      project_id: projectId,
      user_id: userId,
      task_id: task.id,
      asset_type: task.task_type,
      asset_category: task.slide_type,
      variation_number: task.variation_number,
      storage_path: storagePath,
      public_url: publicUrl,
      width: dimensions.width,
      height: dimensions.height
    });

  if (error) {
    console.error(`${LOG_TAG} Failed to create asset record:`, error);
    throw error;
  }
}

async function incrementProjectProgress(supabase, projectId) {
  // Use RPC or raw increment - Supabase doesn't have native increment
  const { data: project } = await supabase
    .from('etsy_empire_projects')
    .select('completed_tasks')
    .eq('id', projectId)
    .single();

  const newCount = (project?.completed_tasks || 0) + 1;

  await supabase
    .from('etsy_empire_projects')
    .update({ completed_tasks: newCount })
    .eq('id', projectId);
}

async function checkAllTasksStatus(supabase, projectId) {
  const { data: tasks, error } = await supabase
    .from('etsy_empire_tasks')
    .select('status')
    .eq('project_id', projectId);

  if (error) {
    console.error(`${LOG_TAG} Failed to check tasks status:`, error);
    throw error;
  }

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const failedCount = tasks.filter(t => t.status === 'permanent_failure').length;
  const totalCount = tasks.length;

  return {
    allCompleted: completedCount === totalCount,
    hasPermanentFailures: failedCount > 0,
    completedCount,
    failedCount,
    totalCount
  };
}

// ============================================================
// CORE PROCESSING FUNCTIONS
// ============================================================

async function processTaskWithRetry(supabase, task, project) {
  // Etsy uses 4:5, Pinterest uses 9:16 (closest to 2:3 that Imagen supports)
  const aspectRatio = task.task_type === 'etsy_slide' ? '4:5' : '9:16';

  for (let attempt = 0; attempt < RETRY_DELAYS.length; attempt++) {
    try {
      // Wait before retry (0 for first attempt)
      if (attempt > 0) {
        console.log(`${LOG_TAG} Task ${task.id} retry attempt ${attempt + 1} after ${RETRY_DELAYS[attempt]}ms`);
        await sleep(RETRY_DELAYS[attempt]);
      }

      // Update task status
      await updateTaskStatus(supabase, task.id, 'processing', { retry_count: attempt });

      // Build prompt
      const prompt = buildPrompt(task, project);
      console.log(`${LOG_TAG} Generating image for ${task.task_type}/${task.slide_type} (attempt ${attempt + 1})`);

      // Generate image
      const base64Image = await generateImage(prompt, aspectRatio);

      // Upload to Supabase Storage
      const storagePath = `${project.user_id}/etsy-empire/${project.id}/${task.task_type}/${task.slide_type}_${task.variation_number}.png`;
      const imageBuffer = Buffer.from(base64Image, 'base64');

      const { error: uploadError } = await supabase.storage
        .from('visual-designs')
        .upload(storagePath, imageBuffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        console.error(`${LOG_TAG} Upload error:`, uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('visual-designs')
        .getPublicUrl(storagePath);

      // Create asset record
      await createAssetRecord(supabase, task, project.id, project.user_id, storagePath, urlData.publicUrl, aspectRatio);

      // Mark task completed
      await updateTaskStatus(supabase, task.id, 'completed', { output_url: urlData.publicUrl });

      // Update project progress
      await incrementProjectProgress(supabase, project.id);

      console.log(`${LOG_TAG} Task ${task.id} completed successfully`);
      return true;

    } catch (error) {
      console.error(`${LOG_TAG} Task ${task.id} attempt ${attempt + 1} failed:`, error.message);

      if (attempt === RETRY_DELAYS.length - 1) {
        // Final attempt failed
        console.error(`${LOG_TAG} Task ${task.id} permanently failed after ${RETRY_DELAYS.length} attempts`);
        await updateTaskStatus(supabase, task.id, 'permanent_failure', { last_error: error.message });
        return false;
      }
    }
  }

  return false;
}

async function processTasksWithConcurrency(supabase, tasks, project, limit) {
  const results = [];
  const executing = new Set();

  for (const task of tasks) {
    const promise = processTaskWithRetry(supabase, task, project).then(result => {
      executing.delete(promise);
      return result;
    });

    executing.add(promise);
    results.push(promise);

    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}

// ============================================================
// SPINTAX GENERATION
// ============================================================

function buildSpintaxDescription(project) {
  const title = project.product_title;
  return `{Grab|Get|Download|Snag} your ${title} {today|now}! {Perfect for|Ideal for|Great for|Made for} {busy professionals|entrepreneurs|go-getters|ambitious planners} who want {results|success|growth|productivity}. ${project.tldr_text || ''}`;
}

function buildSpintaxAltText(project) {
  return `${project.product_title} - digital planner and productivity tool`;
}

function generatePinDescription(asset, project) {
  const category = asset.asset_category;
  const title = project.product_title;

  const descriptions = {
    quote: `{Motivation|Inspiration|Daily reminder} for {your journey|success|growth}. ${title} {helps you|empowers you to} {stay focused|achieve more|plan better}.`,
    lifestyle: `{Planning session|Getting organized|My planning routine} with ${title}. {Love|Obsessed with} this {cozy|minimal|aesthetic} setup!`,
    desk: `{Workspace goals|Desk setup|Office vibes} featuring ${title}. {Clean|Minimal|Organized} {planning|workspace} {essentials|aesthetic}.`,
    mood: `{Aesthetic planning|Mood board|Planner vibes} with ${title}. {Neutral|Cozy|Minimal} {tones|aesthetic|palette}.`,
    planner_hands: `{Flipping through|Exploring|Checking out} my ${title}. {So many|Love all the} {pages|sections|features}!`,
    flatlay: `{Flatlay|Styled shot|Planning essentials} featuring ${title}. {Minimal|Clean|Aesthetic} {product photography|setup}.`
  };

  return descriptions[category] || `${title} - {your new|the ultimate|the best} digital planner for {productivity|success|organization}.`;
}

function generatePinAltText(asset, project) {
  return `${project.product_title} ${asset.asset_category} pin - digital planner mockup`;
}

async function generateSpintax(supabase, projectId, project) {
  console.log(`${LOG_TAG} Generating spintax for project ${projectId}`);

  // Get all Pinterest assets
  const { data: pinterestAssets, error: assetsError } = await supabase
    .from('etsy_empire_assets')
    .select('*')
    .eq('project_id', projectId)
    .eq('asset_type', 'pinterest_pin');

  if (assetsError) {
    console.error(`${LOG_TAG} Failed to fetch Pinterest assets for spintax:`, assetsError);
  }

  // Build spintax payload
  const masterDescription = buildSpintaxDescription(project);
  const masterAltText = buildSpintaxAltText(project);

  const fullPayload = {
    product_title: project.product_title,
    master_description: masterDescription,
    master_alt_text: masterAltText,
    pins: (pinterestAssets || []).map(asset => ({
      url: asset.public_url,
      category: asset.asset_category,
      variation: asset.variation_number,
      description: generatePinDescription(asset, project),
      alt_text: generatePinAltText(asset, project)
    }))
  };

  // Save spintax record
  const { error: spintaxError } = await supabase
    .from('etsy_empire_spintax')
    .insert({
      project_id: projectId,
      user_id: project.user_id,
      master_description: masterDescription,
      master_alt_text: masterAltText,
      full_payload: fullPayload
    });

  if (spintaxError) {
    console.error(`${LOG_TAG} Failed to save spintax:`, spintaxError);
  } else {
    console.log(`${LOG_TAG} Spintax generated successfully`);
  }
}

// ============================================================
// MAIN HANDLER
// ============================================================

export async function handler(event) {
  console.log(`${LOG_TAG} Background function invoked`);

  // Always return 200 from background functions (Netlify requirement)
  const successResponse = { statusCode: 200 };

  try {
    const body = JSON.parse(event.body || '{}');
    const { project_id } = body;

    if (!project_id) {
      console.error(`${LOG_TAG} Missing project_id in request body`);
      return successResponse;
    }

    console.log(`${LOG_TAG} Processing project: ${project_id}`);

    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Mark project as 'processing' and set started_at
    await updateProjectStatus(supabase, project_id, 'processing', {
      started_at: new Date().toISOString()
    });

    // 2. Get project details
    const project = await getProject(supabase, project_id);
    console.log(`${LOG_TAG} Project: "${project.product_title}" (Pinterest: ${project.include_pinterest})`);

    // 3. Fetch all queued tasks
    const tasks = await getQueuedTasks(supabase, project_id);
    console.log(`${LOG_TAG} Found ${tasks.length} queued tasks`);

    if (tasks.length === 0) {
      console.log(`${LOG_TAG} No tasks to process, marking as completed`);
      await updateProjectStatus(supabase, project_id, 'completed');
      return successResponse;
    }

    // Count tasks by type
    const etsyTasks = tasks.filter(t => t.task_type === 'etsy_slide');
    const pinterestTasks = tasks.filter(t => t.task_type === 'pinterest_pin');

    console.log(`${LOG_TAG} Task breakdown:`);
    console.log(`${LOG_TAG}   - Etsy slides: ${etsyTasks.length}`);
    console.log(`${LOG_TAG}   - Pinterest pins: ${pinterestTasks.length}`);

    // 4. Process tasks with concurrency limit
    console.log(`${LOG_TAG} Starting image generation with concurrency limit of ${MAX_CONCURRENT}`);
    await processTasksWithConcurrency(supabase, tasks, project, MAX_CONCURRENT);

    // 5. Check final status
    const finalStatus = await checkAllTasksStatus(supabase, project_id);
    console.log(`${LOG_TAG} Final status: ${finalStatus.completedCount}/${finalStatus.totalCount} completed, ${finalStatus.failedCount} failed`);

    if (finalStatus.allCompleted) {
      // 6. Generate spintax (only if Pinterest was enabled)
      if (project.include_pinterest) {
        await generateSpintax(supabase, project_id, project);
      }

      // 7. Update project as completed
      const actualCost = finalStatus.completedCount * COST_PER_IMAGE;
      await updateProjectStatus(supabase, project_id, 'completed', {
        actual_cost: actualCost
      });

      console.log(`${LOG_TAG} Project ${project_id} completed successfully. Cost: $${actualCost.toFixed(2)}`);

    } else if (finalStatus.hasPermanentFailures) {
      // Some tasks failed permanently
      const partialCost = finalStatus.completedCount * COST_PER_IMAGE;

      // Still generate spintax for whatever was completed
      if (project.include_pinterest && finalStatus.completedCount > 0) {
        await generateSpintax(supabase, project_id, project);
      }

      // Mark as failed but preserve partial results
      await updateProjectStatus(supabase, project_id, 'failed', {
        last_error: `${finalStatus.failedCount} of ${finalStatus.totalCount} images failed permanently`,
        actual_cost: partialCost
      });

      console.log(`${LOG_TAG} Project ${project_id} partially failed. ${finalStatus.completedCount} images generated, ${finalStatus.failedCount} failed.`);
    }

    return successResponse;

  } catch (error) {
    console.error(`${LOG_TAG} Unexpected error:`, error.message);

    // Try to mark project as failed
    try {
      const body = JSON.parse(event.body || '{}');
      if (body.project_id) {
        const supabase = createClient(
          process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        await updateProjectStatus(supabase, body.project_id, 'failed', {
          last_error: error.message
        });
      }
    } catch (e) {
      console.error(`${LOG_TAG} Failed to mark project as failed:`, e.message);
    }

    return successResponse;
  }
}
