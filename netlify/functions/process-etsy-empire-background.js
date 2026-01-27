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

// Data-backed prompts based on analysis of 3,251 Pinterest pins
// Top performers: Study Desk Flatlay (57,782 repins), Sticky Note Cork Board (25,879), Minimalist Typography (18,055)
// Engagement boosters: Handwritten notes +42%, Feminine hands +40%, iPad/Tablet +35%, Gold accents +31%
// Validated palettes: Black+Cream (#1A1A1A + #F5F0E8) 14,200 avg, Warm Wood (#A57C55 + #F5F0E8) 5,100 avg

const ETSY_SLIDE_PROMPTS = {
  hero: `Bird's eye flatlay of iPad Pro in space gray displaying {FORMAT} pages alongside MacBook Pro showing spreadsheet, warm oak wood desk surface #A08060, white ceramic coffee mug upper left, small potted succulent in terracotta pot lower right, gold paperclips scattered naturally, soft diffused window light from left creating gentle shadows, professional product photography style. 4:5 aspect ratio.`,

  detail: `Feminine hands with natural manicure holding iPad Pro in landscape displaying colorful {FORMAT} interface, cozy living room setting with cream knit blanket visible, warm ambient lighting from right side, shallow depth of field with soft bokeh background showing houseplants, lifestyle photography aesthetic. 4:5 aspect ratio.`,

  feature: `Bird's eye shot of iPad Pro on white marble surface with subtle gray veins displaying {FORMAT} layout, small potted succulent in white ceramic pot upper right corner, gold pen diagonal lower left, soft even lighting from above with minimal shadows, clean minimalist product photography style. 4:5 aspect ratio.`,

  cascading: `Bird's eye flatlay of printed {FORMAT} pages fanned out diagonally on cream linen fabric background #F5F0E8, gold binder clips securing page corners, single dried eucalyptus stem placed organically across pages, soft natural window light from top creating subtle texture shadows, editorial product photography aesthetic. 4:5 aspect ratio.`,

  book: `Bird's eye flatlay of aesthetic workspace on warm wood desk #A08060, open ring binder showing {FORMAT} pages center frame, MacBook Pro corner visible upper left with spreadsheet on screen, white coffee mug with latte art right side, gold scissors and washi tape rolls scattered lower area, natural daylight from window left side, aspirational desk setup photography. 4:5 aspect ratio.`,

  index: `Bird's eye shot of single {FORMAT} printed page centered on smooth cream paper background #F5F0E6, slight natural paper texture visible, soft even diffused lighting from above creating no harsh shadows, ultra minimal composition with generous negative space all sides, clean product documentation style. 4:5 aspect ratio.`,

  cover_options: `Bird's eye lifestyle shot of feminine hands with light skin tone writing with black pen in open planner showing {FORMAT} layout, cream chunky knit sweater sleeves visible, warm wood desk surface #A57C55 beneath, gold ring on finger catching light, soft warm lighting from upper right, cozy planning session aesthetic. 4:5 aspect ratio.`,

  features_layout: `45-degree angle shot of printed {FORMAT} pages in leather folio on organized white desk, silver laptop open to side showing document, wireless keyboard lower frame, small green plant in white pot background right, natural office lighting from large window behind camera, professional home office context photography. 4:5 aspect ratio.`,

  floating: `Close-up macro shot of {FORMAT} printed page corner showing paper texture and print quality, selective focus with soft bokeh background of blurred desk items, natural side lighting emphasizing paper weight and premium feel, detail-oriented product photography for quality showcase. 4:5 aspect ratio.`,

  library: `45-degree shot of {FORMAT} pages bound with gold spiral binding, slight angle showing thickness of page stack approximately 50 pages, clean white background with soft shadow beneath binding, even studio lighting from both sides, product catalog photography style highlighting binding quality. 4:5 aspect ratio.`,

  desk_burgundy: `Bird's eye flatlay of iMac in silver displaying {FORMAT} on smooth burgundy leather desk pad #800020, small grid notepad with off-white pen to left, white cube candle upper left, beige ceramic mug and small jewelry dish with gold rings upper right, soft diffused overhead lighting, minimal shadows, warm sophisticated tones, executive desk aesthetic, professional product photography. 4:5 aspect ratio.`,

  smartphone_gift: `Bird's eye lifestyle shot of black smartphone displaying {FORMAT} interface on warm cream surface #F5F0E8, sheer brown organza ribbon #8B4513 tied in bow around phone, feminine hands with natural nails adjusting ribbon, soft natural lighting from top-right, minimal diffused shadows, warm celebratory tones, gift presentation aesthetic, professional product photography. 4:5 aspect ratio.`
};

const PINTEREST_PIN_PROMPTS = {
  quote: `Elegant minimalist {FORMAT} cover design, large stacked serif numerals "2026" in black #1A1A1A centered, cream textured paper background #F5F0E8 with subtle linen texture, thin gold foil line accent beneath year, generous negative space above and below text, soft even lighting with no shadows, typography-focused graphic design aesthetic. Vertical 2:3 format.`,

  lifestyle: `Grid layout showing 16 {FORMAT} page thumbnails in 4x4 arrangement on cream background #F5F0E6, consistent sage green #9DBF82 and cream color scheme across all pages, slight drop shadow beneath each thumbnail, clean white borders between grid items, soft diffused lighting, product catalog overview style showing variety of included pages. Vertical 2:3 format.`,

  desk: `Feminine hands holding iPad Pro displaying {FORMAT} interface with pastel sections, seated on gray fabric couch with warm wooden floor visible below, cozy living room setting with soft natural window light from left, cream throw pillow partially visible, shallow depth of field, lifestyle product photography with human connection element. Vertical 2:3 format.`,

  mood: `Single {FORMAT} page design flat composition on cream background #F5F0E8, soft pastel color palette featuring pink #FFC0CB yellow #FFC45C mint #98FF98 and lavender #E6E6FA section headers, clean grid layout with rounded corners on content blocks, soft even lighting with no shadows, digital product mockup aesthetic showcasing page design details. Vertical 2:3 format.`,

  document_hands: `Minimalist {FORMAT} typography design on crumpled cream paper texture #F5F0E8, elegant black serif text centered reading "Plan Your Success" in two lines, generous negative space surrounding text, subtle paper fold shadows at corners, soft warm lighting from above, motivational quote pin aesthetic matching high-engagement Pinterest typography style. Vertical 2:3 format.`,

  flatlay: `White sticky note pinned to cork board background #B8956E with orange pushpin #FF6B35 at top center, handwritten style black text reading "Start Your {FORMAT} Today", authentic tactile texture of cork visible, warm natural lighting from upper left creating soft shadow beneath note, goal-oriented vision board aesthetic matching 25K repin sticky note pattern. Vertical 2:3 format.`,

  typography_bold: `Straight-on motivational typography design, bold dark red brush script text #8B0000 reading "I CAN AND I WILL" centered on smooth light gray background #D3D3D3, generous negative space above and below, energetic hand-lettered style, no decorative elements, high contrast, {FORMAT} cover design, Pinterest vertical format. Vertical 2:3 format.`
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
  const { product_title, tldr_text, product_format } = project;

  // Get base prompt template
  const templates = task_type === 'etsy_slide' ? ETSY_SLIDE_PROMPTS : PINTEREST_PIN_PROMPTS;
  const template = templates[slide_type];

  // Get format (defaults to "digital product" if not specified)
  const format = product_format || 'digital product';

  if (!template) {
    console.warn(`${LOG_TAG} No template found for ${task_type}/${slide_type}, using generic`);
    return `Professional product mockup for "${product_title}" ${format}. Soft-minimalist luxury style. Light beige linen background. Golden hour lighting. 4:5 aspect ratio.`;
  }

  // Replace placeholders
  return template
    .replace(/{PRODUCT_TITLE}/g, product_title)
    .replace(/{FORMAT}/g, format)
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
    .select('id, user_id, product_title, tldr_text, product_format, manifestable_ratio, pinterest_enabled')
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
    console.log(`${LOG_TAG} Project: "${project.product_title}" (Pinterest: ${project.pinterest_enabled})`);

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
      if (project.pinterest_enabled) {
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
      if (project.pinterest_enabled && finalStatus.completedCount > 0) {
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
