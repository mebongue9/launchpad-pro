// netlify/functions/process-etsy-empire-background.js
// Background function that processes Etsy Empire image generation tasks
// Uses kie.ai API for image and video generation
// PART OF: Etsy Empire visual generation system
// RELEVANT FILES: create-etsy-empire-project.js, get-etsy-empire-project.js

import { createClient } from '@supabase/supabase-js';

const LOG_TAG = '[PROCESS-ETSY-EMPIRE-BG]';

// ============================================================
// KIE.AI API CONFIGURATION
// ============================================================
const KIE_AI_API_KEY = process.env.KIE_AI_API_KEY;
const KIE_AI_BASE_URL = 'https://api.kie.ai/api/v1/jobs';

// Cost constants
const COST_PER_IMAGE = 0.02;
const COST_PER_VIDEO = 0.10;

// Rate limiting
const RATE_LIMIT_DELAY_MS = 750;

// Retry delays for transient errors
const RETRY_DELAYS = [0, 2000, 5000]; // ms: immediate, 2s, 5s

// Aspect ratios (kie.ai native support)
const ETSY_ASPECT_RATIO = '4:5';
const PINTEREST_ASPECT_RATIO = '2:3';

// Valid kie.ai aspect ratios
const VALID_KIE_ASPECT_RATIOS = [
  '1:1', '9:16', '16:9', '3:4', '4:3',
  '3:2', '2:3', '5:4', '4:5', '21:9', 'auto'
];

// Variation rotation state (tracks last used variation per category)
const categoryVariationState = new Map();

// Text framework rotation state (tracks last used framework code)
let lastTextFrameworkCode = null;

// ============================================================
// VISUAL VARIETY POOLS (randomized per pin)
// ============================================================

const SURFACE_OPTIONS = [
  { description: 'light beige linen', hex: '#F5F5DC' },
  { description: 'cream paper', hex: '#F5F0E8' },
  { description: 'light oak wood grain', hex: '#E3DCC9' },
  { description: 'smooth white', hex: '#FFFFFF' },
  { description: 'warm walnut wood', hex: '#7E584A' },
  { description: 'soft blush pink', hex: '#F8E9F0' },
  { description: 'light cool gray', hex: '#D3D3D3' },
  { description: 'white marble with subtle gray veins', hex: '#FAFAFA' },
  { description: 'light concrete', hex: '#E0E0E0' },
  { description: 'terrazzo with neutral speckles', hex: '#F0EDE8' }
];

const LIGHTING_OPTIONS = [
  { description: 'soft natural lighting from top-left', shadow: 'gentle shadows falling right' },
  { description: 'soft natural lighting from top-right', shadow: 'gentle shadows falling left' },
  { description: 'even diffused overhead lighting', shadow: 'minimal soft shadows' },
  { description: 'bright diffused daylight', shadow: 'very soft shadows' },
  { description: 'warm side lighting from left', shadow: 'elongated shadows to the right' },
  { description: 'cool side lighting from right', shadow: 'elongated shadows to the left' }
];

const SKIN_TONE_OPTIONS = [
  'light skin tone',
  'medium skin tone',
  'olive skin tone',
  'tan skin tone',
  'dark skin tone'
];

const HAND_STYLE_OPTIONS = [
  'feminine hands with natural manicure',
  'elegant hands with neutral polish',
  'hands wearing delicate bracelet',
  'hands with minimal gold ring',
  'hands with simple watch'
];

const COLOR_TEMP_WEIGHTS = { warm: 0.6, neutral: 0.3, cool: 0.1 };

// ============================================================
// VARIETY SELECTION HELPERS
// ============================================================

function selectRandomFromArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function selectWeightedRandom(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [_, weight]) => sum + weight, 0);
  let random = Math.random() * total;

  for (const [option, weight] of entries) {
    random -= weight;
    if (random <= 0) return option;
  }
  return entries[0][0];
}

// ============================================================
// PROMPT TEMPLATES
// ============================================================

// Data-backed prompts based on analysis of 3,251 Pinterest pins
// Top performers: Study Desk Flatlay (57,782 repins), Sticky Note Cork Board (25,879), Minimalist Typography (18,055)
// Engagement boosters: Handwritten notes +42%, Feminine hands +40%, iPad/Tablet +35%, Gold accents +31%
// Validated palettes: Black+Cream (#1A1A1A + #F5F0E8) 14,200 avg, Warm Wood (#A57C55 + #F5F0E8) 5,100 avg

const ETSY_SLIDE_PROMPTS = {
  hero: `Bird's eye flatlay of iPad Pro in space gray displaying {FORMAT} pages with visible title "{PRODUCT_TITLE}" on screen, alongside MacBook Pro showing related content about {PRODUCT_TITLE}, warm oak wood desk surface #A08060, white ceramic coffee mug upper left, small potted succulent in terracotta pot lower right, gold paperclips scattered naturally, soft diffused window light from left creating gentle shadows, professional product photography style. Screen content must relate to the product topic. 4:5 aspect ratio.`,

  detail: `Feminine hands with natural manicure holding iPad Pro in landscape displaying colorful {FORMAT} interface showing "{PRODUCT_TITLE}" content, cozy living room setting with cream knit blanket visible, warm ambient lighting from right side, shallow depth of field with soft bokeh background showing houseplants, lifestyle photography aesthetic. 4:5 aspect ratio.`,

  feature: `Bird's eye shot of iPad Pro on white marble surface with subtle gray veins displaying {FORMAT} layout for "{PRODUCT_TITLE}", small potted succulent in white ceramic pot upper right corner, gold pen diagonal lower left, soft even lighting from above with minimal shadows, clean minimalist product photography style. 4:5 aspect ratio.`,

  cascading: `Bird's eye flatlay of printed {FORMAT} pages for "{PRODUCT_TITLE}" fanned out diagonally on cream linen fabric background #F5F0E8, gold binder clips securing page corners, single dried eucalyptus stem placed organically across pages, soft natural window light from top creating subtle texture shadows, editorial product photography aesthetic. 4:5 aspect ratio.`,

  book: `Bird's eye flatlay of aesthetic workspace on warm wood desk #A08060, open ring binder showing {FORMAT} pages for "{PRODUCT_TITLE}" center frame, MacBook Pro corner visible upper left showing related content, white coffee mug with latte art right side, gold scissors and washi tape rolls scattered lower area, natural daylight from window left side, aspirational desk setup photography. 4:5 aspect ratio.`,

  index: `Bird's eye shot of single {FORMAT} printed page for "{PRODUCT_TITLE}" centered on smooth cream paper background #F5F0E6, slight natural paper texture visible, soft even diffused lighting from above creating no harsh shadows, ultra minimal composition with generous negative space all sides, clean product documentation style. 4:5 aspect ratio.`,

  cover_options: `Bird's eye lifestyle shot of feminine hands with light skin tone writing with black pen in open planner showing {FORMAT} layout for "{PRODUCT_TITLE}", cream chunky knit sweater sleeves visible, warm wood desk surface #A57C55 beneath, gold ring on finger catching light, soft warm lighting from upper right, cozy planning session aesthetic. 4:5 aspect ratio.`,

  features_layout: `45-degree angle shot of printed {FORMAT} pages for "{PRODUCT_TITLE}" in leather folio on organized white desk, silver laptop open to side showing related document, wireless keyboard lower frame, small green plant in white pot background right, natural office lighting from large window behind camera, professional home office context photography. 4:5 aspect ratio.`,

  floating: `Close-up macro shot of {FORMAT} printed page corner for "{PRODUCT_TITLE}" showing paper texture and print quality, selective focus with soft bokeh background of blurred desk items, natural side lighting emphasizing paper weight and premium feel, detail-oriented product photography for quality showcase. 4:5 aspect ratio.`,

  library: `45-degree shot of {FORMAT} pages for "{PRODUCT_TITLE}" bound with gold spiral binding, slight angle showing thickness of page stack approximately 50 pages, clean white background with soft shadow beneath binding, even studio lighting from both sides, product catalog photography style highlighting binding quality. 4:5 aspect ratio.`,

  desk_burgundy: `Bird's eye flatlay of iMac in silver displaying {FORMAT} for "{PRODUCT_TITLE}" on smooth burgundy leather desk pad #800020, small grid notepad with off-white pen to left, white cube candle upper left, beige ceramic mug and small jewelry dish with gold rings upper right, soft diffused overhead lighting, minimal shadows, warm sophisticated tones, executive desk aesthetic, professional product photography. 4:5 aspect ratio.`,

  smartphone_gift: `Bird's eye lifestyle shot of black smartphone displaying {FORMAT} interface for "{PRODUCT_TITLE}" on warm cream surface #F5F0E8, sheer brown organza ribbon #8B4513 tied in bow around phone, feminine hands with natural nails adjusting ribbon, soft natural lighting from top-right, minimal diffused shadows, warm celebratory tones, gift presentation aesthetic, professional product photography. 4:5 aspect ratio.`
};

const PINTEREST_PIN_PROMPTS = {
  quote: `Elegant minimalist Pinterest pin for "{PRODUCT_TITLE}", cream textured paper background #F5F0E8 with subtle linen texture, prominent text reading "{PIN_TEXT}" in elegant black serif font #1A1A1A centered, thin gold foil line accent beneath text, generous negative space above and below, soft even lighting with no shadows, typography-focused graphic design aesthetic. CRITICAL: The text "{PIN_TEXT}" must appear prominently and legibly on the image. Vertical 2:3 format.`,

  lifestyle: `Grid layout showing 16 {FORMAT} page thumbnails in 4x4 arrangement on cream background #F5F0E6 for "{PRODUCT_TITLE}", consistent sage green #9DBF82 and cream color scheme across all pages, slight drop shadow beneath each thumbnail, clean white borders between grid items, soft diffused lighting, product catalog overview style showing variety of included pages. Vertical 2:3 format.`,

  desk: `Feminine hands holding iPad Pro displaying {FORMAT} interface for "{PRODUCT_TITLE}" with pastel sections, seated on gray fabric couch with warm wooden floor visible below, cozy living room setting with soft natural window light from left, cream throw pillow partially visible, shallow depth of field, lifestyle product photography with human connection element. Vertical 2:3 format.`,

  mood: `Single {FORMAT} page design for "{PRODUCT_TITLE}" flat composition on cream background #F5F0E8, soft pastel color palette featuring pink #FFC0CB yellow #FFC45C mint #98FF98 and lavender #E6E6FA section headers, clean grid layout with rounded corners on content blocks, soft even lighting with no shadows, digital product mockup aesthetic showcasing page design details. Vertical 2:3 format.`,

  document_hands: `Minimalist {FORMAT} typography design on crumpled cream paper texture #F5F0E8, elegant black serif text centered reading "{PIN_TEXT}" in two lines, generous negative space surrounding text, subtle paper fold shadows at corners, soft warm lighting from above, motivational quote pin aesthetic matching high-engagement Pinterest typography style. CRITICAL: The text "{PIN_TEXT}" must appear prominently. Vertical 2:3 format.`,

  flatlay: `White sticky note pinned to cork board background #B8956E with orange pushpin #FF6B35 at top center, handwritten style black text reading "{PIN_TEXT}", authentic tactile texture of cork visible, warm natural lighting from upper left creating soft shadow beneath note, goal-oriented vision board aesthetic matching 25K repin sticky note pattern. CRITICAL: The text must be legible. Vertical 2:3 format.`,

  typography_bold: `Straight-on motivational typography design, bold dark red brush script text #8B0000 reading "{PIN_TEXT}" centered on smooth light gray background #D3D3D3, generous negative space above and below, energetic hand-lettered style, no decorative elements, high contrast, {FORMAT} cover design, Pinterest vertical format. CRITICAL: The text "{PIN_TEXT}" must appear prominently. Vertical 2:3 format.`
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Language code to full name mapping
const LANGUAGE_NAMES = {
  'en': 'English',
  'fr': 'French',
  'es': 'Spanish',
  'de': 'German',
  'id': 'Indonesian',
  'it': 'Italian',
  'pt': 'Portuguese',
  'nl': 'Dutch',
  'pl': 'Polish',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
  'ar': 'Arabic',
  'hi': 'Hindi'
};

// Get language name from code
function getLanguageName(code) {
  return LANGUAGE_NAMES[code] || 'English';
}

// Get language-specific prompt suffix for visual prompts
function getLanguagePromptSuffix(languageCode) {
  if (!languageCode || languageCode === 'en') {
    return '';
  }
  const langName = getLanguageName(languageCode);
  return ` Any visible text on product pages/screens must be in ${langName}.`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function validateKieRequest(aspectRatio, prompt) {
  const errors = [];

  if (!VALID_KIE_ASPECT_RATIOS.includes(aspectRatio)) {
    errors.push(`Invalid aspect ratio: ${aspectRatio}. Must be one of: ${VALID_KIE_ASPECT_RATIOS.join(', ')}`);
  }

  if (!prompt || prompt.trim().length === 0) {
    errors.push('Prompt cannot be empty');
  }

  if (prompt && prompt.length > 5000) {
    errors.push('Prompt too long (max 5000 characters)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Determine if error should be retried based on HTTP status code
 */
function shouldRetry(statusCode) {
  // Permanent errors - do NOT retry
  const permanentErrors = [400, 401, 402, 404, 422];
  if (permanentErrors.includes(statusCode)) {
    return false;
  }

  // Transient errors - DO retry
  const transientErrors = [429, 500, 502, 503, 504];
  return transientErrors.includes(statusCode);
}

// ============================================================
// KIE.AI API FUNCTIONS
// ============================================================

/**
 * Create an image generation task with kie.ai Nano Banana
 */
async function createImageTask(prompt, aspectRatio) {
  const response = await fetch(`${KIE_AI_BASE_URL}/createTask`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KIE_AI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/nano-banana',
      input: {
        prompt: prompt,
        output_format: 'png',
        image_size: aspectRatio
      }
    })
  });

  const data = await response.json();

  if (data.code !== 200) {
    const error = new Error(`kie.ai createTask failed: ${data.msg || 'Unknown error'}`);
    error.statusCode = data.code || response.status;
    throw error;
  }

  return data.data.taskId;
}

/**
 * Create a video generation task with kie.ai Grok image-to-video
 */
async function createVideoTask(sourceImageUrl, motionPrompt) {
  const response = await fetch(`${KIE_AI_BASE_URL}/createTask`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KIE_AI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'grok-imagine/image-to-video',
      input: {
        image_urls: [sourceImageUrl],
        prompt: motionPrompt,
        mode: 'normal'
      }
    })
  });

  const data = await response.json();

  if (data.code !== 200) {
    const error = new Error(`kie.ai video createTask failed: ${data.msg || 'Unknown error'}`);
    error.statusCode = data.code || response.status;
    throw error;
  }

  return data.data.taskId;
}

/**
 * Create an image edit task with kie.ai Nano Banana Edit API
 * Used for Slide 10 template overlay feature
 * @param {string} baseImageUrl - The template image to edit
 * @param {string} prompt - Edit instructions
 * @param {string} aspectRatio - Output aspect ratio
 * @param {string[]} referenceImageUrls - Optional reference images (e.g., completed slides)
 */
async function createEditImageTask(baseImageUrl, prompt, aspectRatio, referenceImageUrls = []) {
  // Combine base image with reference images (max 4 references to avoid API limits)
  const allImageUrls = [baseImageUrl, ...referenceImageUrls.slice(0, 4)];

  const response = await fetch(`${KIE_AI_BASE_URL}/createTask`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KIE_AI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/nano-banana-edit',
      input: {
        prompt: prompt,
        image_urls: allImageUrls,
        output_format: 'png',
        image_size: aspectRatio
      }
    })
  });

  const data = await response.json();

  if (data.code !== 200) {
    const error = new Error(`kie.ai Edit API failed: ${data.msg || 'Unknown error'}`);
    error.statusCode = data.code || response.status;
    throw error;
  }

  return data.data.taskId;
}

/**
 * Poll task status until complete or failed
 */
async function pollTaskStatus(taskId, maxAttempts = 120, intervalMs = 3000) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(
      `${KIE_AI_BASE_URL}/recordInfo?taskId=${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${KIE_AI_API_KEY}`
        }
      }
    );

    const data = await response.json();

    if (data.code !== 200) {
      throw new Error(`kie.ai poll failed: ${data.msg || 'Unknown error'}`);
    }

    const state = data.data.state;

    if (state === 'success') {
      const resultJson = JSON.parse(data.data.resultJson);
      return {
        success: true,
        url: resultJson.resultUrls[0]
      };
    }

    if (state === 'fail') {
      return {
        success: false,
        error: data.data.failMsg || 'Generation failed',
        failCode: data.data.failCode
      };
    }

    // Still processing (waiting, queuing, generating)
    await sleep(intervalMs);
  }

  throw new Error('kie.ai polling timeout exceeded');
}

// ============================================================
// DATABASE HELPER FUNCTIONS
// ============================================================

/**
 * Select a text framework from the database
 * Uses weighted random selection, never repeating same framework back-to-back
 * Frameworks are pre-filtered to only include those with fillable variables
 */
async function selectTextFramework(supabase) {
  try {
    const { data, error } = await supabase
      .rpc('select_text_framework', {
        p_exclude_code: lastTextFrameworkCode
      });

    if (error) throw error;

    if (data && data.length > 0) {
      const framework = data[0];
      lastTextFrameworkCode = framework.framework_code;
      console.log(`${LOG_TAG} Selected text framework: ${framework.framework_code}`);
      return framework;
    }

    throw new Error('No text framework returned');
  } catch (err) {
    console.warn(`${LOG_TAG} Text framework selection failed: ${err.message}`);
    // Fallback: return a simple template with only fillable variables
    return {
      framework_code: 'FALLBACK',
      template: '[NUMBER] [DELIVERABLE] That [RESULT]',
      variables: ['NUMBER', 'DELIVERABLE', 'RESULT']
    };
  }
}

/**
 * Generate hook text by filling in framework variables from product data
 * ONLY fills variables that can be derived from product data:
 * - NUMBER: extracted from product title
 * - DELIVERABLE: mapped from product format
 * - RESULT/OUTCOME: extracted from TLDR
 * - TOPIC: from product title
 * - ADJECTIVE: uses "Proven" (generic but appropriate)
 */
function generateHookText(framework, project) {
  const { product_title, product_format, tldr_text } = project;

  // Extract number from title (e.g., "12 Email Templates" -> "12")
  const numberMatch = product_title.match(/\d+/);
  const number = numberMatch ? numberMatch[0] : '7';

  // Map product format to deliverable type
  const formatToDeliverable = {
    'checklist': 'Checklist',
    'planner': 'Planner',
    'tracker': 'Tracker',
    'template': 'Templates',
    'templates': 'Templates',
    'swipe file': 'Scripts',
    'workbook': 'Workbook',
    'guide': 'Guide',
    'blueprint': 'Blueprint',
    'calendar': 'Calendar',
    'cheat sheet': 'Cheat Sheet'
  };
  const deliverable = formatToDeliverable[product_format?.toLowerCase()] || 'Templates';

  // Extract topic from product title (remove numbers and common words)
  const topic = product_title
    .replace(/\d+/g, '')
    .replace(/templates?|checklist|planner|tracker|guide|blueprint/gi, '')
    .trim() || product_format || 'productivity';

  // Extract result/outcome from TLDR (first meaningful phrase)
  const tldrClean = (tldr_text || '').split('.')[0].substring(0, 40).trim();
  const outcome = tldrClean || 'Get Results';

  // Replace ONLY the fillable variables
  let hookText = framework.template
    .replace(/\[NUMBER\]/g, number)
    .replace(/\[DELIVERABLE\]/g, deliverable)
    .replace(/\[RESULT\]/g, outcome)
    .replace(/\[OUTCOME\]/g, outcome)
    .replace(/\[TOPIC\]/g, topic)
    .replace(/\[ADJECTIVE\]/g, 'Proven');

  // Clean up any remaining unreplaced variables (shouldn't happen with filtered frameworks)
  hookText = hookText.replace(/\[[^\]]+\]/g, '');

  console.log(`${LOG_TAG} Generated hook text: "${hookText}"`);
  return hookText;
}

/**
 * Select a visual framework prompt from the database
 * Uses variation rotation and falls back to hardcoded prompts on DB failure
 */
async function selectVisualFramework(supabase, slideType) {
  // Get last used variation (default 0 -> starts at variation 1)
  const lastVariation = categoryVariationState.get(slideType) || 0;

  try {
    const { data, error } = await supabase
      .rpc('select_pinterest_framework', {
        p_category: slideType,
        p_last_variation: lastVariation
      });

    if (error) throw error;

    if (data && data.length > 0) {
      const framework = data[0];
      categoryVariationState.set(slideType, framework.next_variation);

      console.log(`${LOG_TAG} Selected framework: ${framework.variation_code}`);

      return {
        prompt_template: framework.prompt_template,
        variation_code: framework.variation_code,
        fromDb: true
      };
    }

    throw new Error('No framework returned');

  } catch (err) {
    // FALLBACK: Use hardcoded prompts
    console.warn(`${LOG_TAG} Falling back to hardcoded prompt for: ${slideType} (${err.message})`);

    // Map new categories back to old hardcoded prompts for fallback
    const fallbackMapping = {
      'lifestyle_hands': 'lifestyle',
      'typography_quote': 'quote',
      'desk_setup': 'desk',
      'flatlay': 'flatlay',
      'grid_preview': 'lifestyle',
      'device_mockup': 'desk'
    };

    const fallbackKey = fallbackMapping[slideType] || 'quote';
    const fallbackPrompt = PINTEREST_PIN_PROMPTS[fallbackKey];

    return {
      prompt_template: fallbackPrompt || 'Professional Pinterest pin for {FORMAT}. 2:3 format.',
      variation_code: `FALLBACK-${slideType}`,
      fromDb: false
    };
  }
}

async function buildPrompt(supabase, task, project) {
  const { task_type, slide_type } = task;
  const { product_title, tldr_text, product_format, detected_language } = project;

  const format = product_format || 'digital product';
  const langSuffix = getLanguagePromptSuffix(detected_language);
  const pinText = task.pin_text || product_title;

  let template;
  let hookText = pinText; // Default to pin_text from task

  if (task_type === 'pinterest_pin') {
    // Select text framework and generate hook text
    const textFramework = await selectTextFramework(supabase);
    hookText = generateHookText(textFramework, project);

    // Use Visual Framework system for Pinterest pins
    const visualFramework = await selectVisualFramework(supabase, slide_type);
    template = visualFramework.prompt_template;

    // === VARIETY INJECTION ===
    // Select random elements for this specific pin
    const surface = selectRandomFromArray(SURFACE_OPTIONS);
    const lighting = selectRandomFromArray(LIGHTING_OPTIONS);
    const colorTemp = selectWeightedRandom(COLOR_TEMP_WEIGHTS);
    const skinTone = selectRandomFromArray(SKIN_TONE_OPTIONS);
    const handStyle = selectRandomFromArray(HAND_STYLE_OPTIONS);

    // Log selections for debugging
    console.log(`${LOG_TAG} Pin variety selections:`, {
      visual: visualFramework.variation_code,
      text: textFramework.framework_code,
      surface: surface.description,
      lighting: lighting.description,
      colorTemp,
      skinTone
    });

    // Replace hardcoded surface hex codes with random selection
    template = template.replace(/#E3DCC9/gi, surface.hex);
    template = template.replace(/#D9CFC1/gi, surface.hex);
    template = template.replace(/#A08060/gi, surface.hex);
    template = template.replace(/#A57C55/gi, surface.hex);
    template = template.replace(/#C4A484/gi, surface.hex);
    template = template.replace(/#C4A077/gi, surface.hex);
    template = template.replace(/#E0E0E0/gi, surface.hex);

    // Replace surface descriptions
    template = template.replace(/warm wood surface beneath/gi, `${surface.description} surface beneath`);
    template = template.replace(/warm oak desk surface/gi, `${surface.description} surface`);
    template = template.replace(/warm beige linen surface beneath/gi, `${surface.description} surface beneath`);
    template = template.replace(/warm oak wood desk/gi, `${surface.description} desk`);
    template = template.replace(/warm terracotta surface beneath/gi, `${surface.description} surface beneath`);
    template = template.replace(/cream desk surface/gi, `${surface.description} desk surface`);
    template = template.replace(/clean white desk surface/gi, `${surface.description} desk surface`);
    template = template.replace(/white marble surface with subtle gray veins/gi, surface.description);
    template = template.replace(/smooth light gray surface beneath/gi, `${surface.description} surface beneath`);
    template = template.replace(/warm wood surface/gi, `${surface.description} surface`);
    template = template.replace(/warm wood desk surface/gi, `${surface.description} desk surface`);

    // Replace lighting patterns
    template = template.replace(/soft natural lighting from top-left/gi, lighting.description);
    template = template.replace(/soft window light from left side/gi, lighting.description);
    template = template.replace(/soft diffused overhead lighting/gi, lighting.description);
    template = template.replace(/soft natural lighting from right/gi, lighting.description);
    template = template.replace(/natural window light from left/gi, lighting.description);
    template = template.replace(/warm diffused overhead lighting/gi, lighting.description);
    template = template.replace(/soft natural lighting from above/gi, lighting.description);
    template = template.replace(/soft natural window light from left/gi, lighting.description);

    // Replace skin tone (only for lifestyle_hands and device_mockup categories)
    if (slide_type === 'lifestyle_hands' || slide_type === 'device_mockup') {
      template = template.replace(/hands with light skin tone/gi, `hands with ${skinTone}`);
      template = template.replace(/feminine hands/gi, handStyle);
      template = template.replace(/hands with natural manicure/gi, handStyle);
    }

    // Add color temperature modifier
    if (colorTemp !== 'warm') {
      template = template.replace(/warm color temperature/gi, `${colorTemp} color temperature`);
      template = template.replace(/cozy productive aesthetic/gi, `${colorTemp === 'cool' ? 'clean modern' : 'professional'} aesthetic`);
    }

    console.log(`${LOG_TAG} Using visual: ${visualFramework.variation_code}, text: ${textFramework.framework_code}`);
  } else {
    // Etsy slides use existing hardcoded prompts (UNCHANGED)
    template = ETSY_SLIDE_PROMPTS[slide_type];
  }

  if (!template) {
    return `Professional product mockup for "${product_title}" ${format}. 2:3 format.${langSuffix}`;
  }

  return template
    .replace(/{PRODUCT_TITLE}/g, product_title)
    .replace(/{FORMAT}/g, format)
    .replace(/{TLDR}/g, tldr_text || '')
    .replace(/{PIN_TEXT}/g, pinText)
    .replace(/{HOOK_TEXT}/g, hookText) + langSuffix;
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
    .select('id, task_type, slide_type, variation_number, pin_text')
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
    .select('id, user_id, product_title, tldr_text, product_format, manifestable_ratio, pinterest_enabled, video_enabled, slide10_template_id, overlay_count, detected_language')
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
  // Dimensions based on aspect ratio
  let dimensions;
  if (aspectRatio === '4:5') {
    dimensions = { width: 1080, height: 1350 }; // Etsy
  } else if (aspectRatio === '2:3') {
    dimensions = { width: 1080, height: 1620 }; // Pinterest
  } else {
    dimensions = { width: 1080, height: 1350 }; // Default
  }

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

/**
 * Get template by ID
 */
async function getTemplateById(supabase, templateId) {
  const { data, error } = await supabase
    .from('etsy_empire_templates')
    .select('id, public_url, width, height')
    .eq('id', templateId)
    .single();

  if (error) {
    console.error(`${LOG_TAG} Failed to fetch template:`, error);
    return null;
  }

  return data;
}

/**
 * Get completed Etsy slide tasks for overlay source
 */
async function getCompletedEtsySlides(supabase, projectId) {
  const { data, error } = await supabase
    .from('etsy_empire_tasks')
    .select('id, output_url, variation_number')
    .eq('project_id', projectId)
    .eq('task_type', 'etsy_slide')
    .eq('status', 'completed')
    .not('output_url', 'is', null);

  if (error) {
    console.error(`${LOG_TAG} Failed to fetch completed slides:`, error);
    return [];
  }

  return data || [];
}

/**
 * Select random items from array
 */
function selectRandom(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Process Slide 10 with template overlay (Edit API)
 * Replaces placeholder product pages with actual product mockups from slides 1-9
 */
async function processSlide10WithTemplate(supabase, task, project, template, completedSlides) {
  const overlayCount = project.overlay_count || 4;

  // Build Edit API prompt - FULLY REPLACE document content, not just overlay titles
  // Fix: Previous prompt caused AI to overlay titles on existing brain/wheel graphics
  // Now: Explicitly asks to REPLACE document content entirely with new content
  const prompt = `Edit this image: Replace the floating paper documents with COMPLETELY NEW documents. The new documents should show clean pages with "${project.product_title}" content - simple text lists, checkboxes, or bullet points on white paper. Remove ALL existing content from the documents including any charts, wheels, brain icons, or diagrams - the documents must show completely different content. The woman, her pose, her clothing, the background shapes, the "SHOP NOW" button, and the name at the bottom must stay EXACTLY the same and appear only once. Only the paper documents change to show the new product.`;

  try {
    await updateTaskStatus(supabase, task.id, 'processing');

    console.log(`${LOG_TAG} Slide 10 generation (simplified prompt, no reference images):`, {
      templateId: template.id,
      templateUrl: template.public_url,
      overlayCount: overlayCount,
      productTitle: project.product_title
    });

    // Create Edit API task with ONLY the template - no reference images
    // Reference images were confusing the API into blending/regenerating
    const kieTaskId = await createEditImageTask(
      template.public_url,
      prompt,
      ETSY_ASPECT_RATIO
      // NO reference images - edit the template directly
    );
    console.log(`${LOG_TAG} kie.ai Edit task created: ${kieTaskId}`);

    // Poll for completion
    const result = await pollTaskStatus(kieTaskId);

    if (!result.success) {
      throw new Error(result.error || 'Edit API generation failed');
    }

    // Download image and upload to Supabase
    const imageResponse = await fetch(result.url);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    const storagePath = `${project.user_id}/etsy-empire/${project.id}/etsy_slide/slide_10_template.png`;

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
    await createAssetRecord(supabase, task, project.id, project.user_id, storagePath, urlData.publicUrl, ETSY_ASPECT_RATIO);

    // Mark task completed with cost
    await updateTaskStatus(supabase, task.id, 'completed', {
      output_url: urlData.publicUrl,
      cost: COST_PER_IMAGE  // Track cost per task
    });

    // Update project progress
    await incrementProjectProgress(supabase, project.id);

    console.log(`${LOG_TAG} Slide 10 (template) completed successfully`);
    return { success: true, output_url: urlData.publicUrl };

  } catch (error) {
    console.error(`${LOG_TAG} Slide 10 template processing failed:`, error.message);
    await updateTaskStatus(supabase, task.id, 'permanent_failure', { last_error: error.message });
    return { success: false };
  }
}

async function incrementProjectProgress(supabase, projectId) {
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

/**
 * Process a single image task with retry logic
 */
async function processImageTaskWithRetry(supabase, task, project) {
  // Determine aspect ratio based on task type
  const aspectRatio = task.task_type === 'etsy_slide' ? ETSY_ASPECT_RATIO : PINTEREST_ASPECT_RATIO;

  // Build prompt (async for Pinterest Visual Framework lookup)
  const prompt = await buildPrompt(supabase, task, project);

  // Pre-validation
  const validation = validateKieRequest(aspectRatio, prompt);
  if (!validation.valid) {
    const errorMsg = `Validation failed: ${validation.errors.join(', ')}`;
    console.error(`${LOG_TAG} Task ${task.id} ${errorMsg}`);
    await updateTaskStatus(supabase, task.id, 'permanent_failure', { last_error: errorMsg });
    return { success: false };
  }

  for (let attempt = 0; attempt < RETRY_DELAYS.length; attempt++) {
    try {
      // Wait before retry (0 for first attempt)
      if (attempt > 0) {
        console.log(`${LOG_TAG} Task ${task.id} retry attempt ${attempt + 1} after ${RETRY_DELAYS[attempt]}ms`);
        await sleep(RETRY_DELAYS[attempt]);
      }

      // Update task status
      await updateTaskStatus(supabase, task.id, 'processing', { retry_count: attempt });

      console.log(`${LOG_TAG} Creating kie.ai task for ${task.task_type}/${task.slide_type} (attempt ${attempt + 1})`);

      // Create kie.ai task
      const kieTaskId = await createImageTask(prompt, aspectRatio);
      console.log(`${LOG_TAG} kie.ai task created: ${kieTaskId}`);

      // Poll for completion
      const result = await pollTaskStatus(kieTaskId);

      if (!result.success) {
        throw new Error(result.error || 'Image generation failed');
      }

      // Download image from kie.ai URL and upload to Supabase
      const imageResponse = await fetch(result.url);
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

      // Upload to Supabase Storage
      const storagePath = `${project.user_id}/etsy-empire/${project.id}/${task.task_type}/${task.slide_type}_${task.variation_number}.png`;

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

      // Mark task completed with cost
      await updateTaskStatus(supabase, task.id, 'completed', {
        output_url: urlData.publicUrl,
        cost: COST_PER_IMAGE  // Track cost per task
      });

      // Update project progress
      await incrementProjectProgress(supabase, project.id);

      console.log(`${LOG_TAG} Task ${task.id} completed successfully`);
      return { success: true, output_url: urlData.publicUrl };

    } catch (error) {
      console.error(`${LOG_TAG} Task ${task.id} attempt ${attempt + 1} failed:`, error.message);

      // Check if we should retry
      if (error.statusCode && !shouldRetry(error.statusCode)) {
        console.error(`${LOG_TAG} Task ${task.id} permanent failure (status ${error.statusCode})`);
        await updateTaskStatus(supabase, task.id, 'permanent_failure', { last_error: error.message });
        return { success: false };
      }

      if (attempt === RETRY_DELAYS.length - 1) {
        console.error(`${LOG_TAG} Task ${task.id} permanently failed after ${RETRY_DELAYS.length} attempts`);
        await updateTaskStatus(supabase, task.id, 'permanent_failure', { last_error: error.message });
        return { success: false };
      }
    }
  }

  return { success: false };
}

/**
 * Process a video task (depends on slide 1 being completed first)
 */
async function processVideoTask(supabase, task, project, sourceImageUrl) {
  const motionPrompt = 'Subtle elegant camera movement, soft zoom in, gentle lighting shifts across the surface, minimal motion, professional product showcase style, premium feel';

  try {
    await updateTaskStatus(supabase, task.id, 'processing');

    console.log(`${LOG_TAG} Creating video task using source image: ${sourceImageUrl}`);

    // Create video task
    const kieTaskId = await createVideoTask(sourceImageUrl, motionPrompt);
    console.log(`${LOG_TAG} kie.ai video task created: ${kieTaskId}`);

    // Poll for completion (videos take longer, use longer timeout)
    const result = await pollTaskStatus(kieTaskId, 180, 5000);

    if (!result.success) {
      throw new Error(result.error || 'Video generation failed');
    }

    // Download video and upload to Supabase
    const videoResponse = await fetch(result.url);
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

    const storagePath = `${project.user_id}/etsy-empire/${project.id}/etsy_video/slide_2_video.mp4`;

    const { error: uploadError } = await supabase.storage
      .from('visual-designs')
      .upload(storagePath, videoBuffer, {
        contentType: 'video/mp4',
        upsert: true
      });

    if (uploadError) {
      console.error(`${LOG_TAG} Video upload error:`, uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('visual-designs')
      .getPublicUrl(storagePath);

    // Create asset record for video
    const { error: assetError } = await supabase
      .from('etsy_empire_assets')
      .insert({
        project_id: project.id,
        user_id: project.user_id,
        task_id: task.id,
        asset_type: 'etsy_video',
        asset_category: 'video',
        variation_number: 2,
        storage_path: storagePath,
        public_url: urlData.publicUrl,
        width: 1080,
        height: 1350
      });

    if (assetError) {
      console.error(`${LOG_TAG} Failed to create video asset record:`, assetError);
      throw assetError;
    }

    // Mark task completed with cost
    await updateTaskStatus(supabase, task.id, 'completed', {
      output_url: urlData.publicUrl,
      cost: COST_PER_VIDEO  // Track cost per video task
    });

    // Update project progress
    await incrementProjectProgress(supabase, project.id);

    console.log(`${LOG_TAG} Video task ${task.id} completed successfully`);
    return { success: true };

  } catch (error) {
    console.error(`${LOG_TAG} Video task ${task.id} failed:`, error.message);
    await updateTaskStatus(supabase, task.id, 'permanent_failure', { last_error: error.message });
    return { success: false };
  }
}

/**
 * Process all tasks with rate limiting
 */
async function processTasksWithRateLimit(supabase, tasks, project) {
  const results = [];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];

    // Add rate limit delay between calls (skip first)
    if (i > 0) {
      await sleep(RATE_LIMIT_DELAY_MS);
    }

    const result = await processImageTaskWithRetry(supabase, task, project);
    results.push({ taskId: task.id, ...result });
  }

  return results;
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

    // 2. Get project details (includes video_enabled)
    const project = await getProject(supabase, project_id);
    console.log(`${LOG_TAG} Project: "${project.product_title}" (Pinterest: ${project.pinterest_enabled}, Video: ${project.video_enabled})`);

    // 3. Fetch all queued tasks
    const tasks = await getQueuedTasks(supabase, project_id);
    console.log(`${LOG_TAG} Found ${tasks.length} queued tasks`);

    if (tasks.length === 0) {
      console.log(`${LOG_TAG} No tasks to process, marking as completed`);
      await updateProjectStatus(supabase, project_id, 'completed');
      return successResponse;
    }

    // 4. Separate tasks by type
    const allEtsySlideTasks = tasks.filter(t => t.task_type === 'etsy_slide');
    const etsyVideoTasks = tasks.filter(t => t.task_type === 'etsy_video');
    const pinterestTasks = tasks.filter(t => t.task_type === 'pinterest_pin');

    // Separate Slide 10 from other slides (Slide 10 processes LAST for template feature)
    const slide10Task = allEtsySlideTasks.find(t => t.variation_number === 10);
    const etsySlideTasks = allEtsySlideTasks.filter(t => t.variation_number !== 10);

    console.log(`${LOG_TAG} Task breakdown:`);
    console.log(`${LOG_TAG}   - Etsy slides 1-9: ${etsySlideTasks.length}`);
    console.log(`${LOG_TAG}   - Etsy slide 10: ${slide10Task ? 1 : 0}`);
    console.log(`${LOG_TAG}   - Etsy videos: ${etsyVideoTasks.length}`);
    console.log(`${LOG_TAG}   - Pinterest pins: ${pinterestTasks.length}`);
    console.log(`${LOG_TAG}   - Slide 10 template: ${project.slide10_template_id || 'None (AI generates)'}`);

    // 5. Process slides 1-9 based on video_enabled flag
    if (project.video_enabled && etsyVideoTasks.length > 0) {
      console.log(`${LOG_TAG} Video enabled - processing slide 1 first`);

      // Find slide 1 task (variation_number = 1 for first slide)
      const slide1Task = etsySlideTasks.find(t => t.variation_number === 1);
      const otherSlideTasks = etsySlideTasks.filter(t => t.variation_number !== 1);

      if (slide1Task) {
        // Process slide 1 FIRST
        const slide1Result = await processImageTaskWithRetry(supabase, slide1Task, project);
        await sleep(RATE_LIMIT_DELAY_MS);

        // If slide 1 succeeded, process video
        if (slide1Result.success && slide1Result.output_url) {
          console.log(`${LOG_TAG} Slide 1 complete, starting video generation`);

          // Process video task
          const videoTask = etsyVideoTasks[0];
          await processVideoTask(supabase, videoTask, project, slide1Result.output_url);
          await sleep(RATE_LIMIT_DELAY_MS);
        } else {
          console.log(`${LOG_TAG} Slide 1 failed, skipping video`);
          // Mark video task as failed
          for (const vt of etsyVideoTasks) {
            await updateTaskStatus(supabase, vt.id, 'permanent_failure', { last_error: 'Slide 1 failed, cannot generate video' });
          }
        }

        // Process remaining slides (2-9) with rate limiting
        if (otherSlideTasks.length > 0) {
          await processTasksWithRateLimit(supabase, otherSlideTasks, project);
        }
      }
    } else {
      // No video - process slides 1-9 with rate limiting
      console.log(`${LOG_TAG} Processing slides 1-9 with rate limiting`);
      await processTasksWithRateLimit(supabase, etsySlideTasks, project);
    }

    // 6. Process Slide 10 LAST (after slides 1-9 complete)
    if (slide10Task) {
      await sleep(RATE_LIMIT_DELAY_MS);

      if (project.slide10_template_id) {
        // Template selected - use Edit API
        console.log(`${LOG_TAG} Processing Slide 10 with template (Edit API)`);

        const template = await getTemplateById(supabase, project.slide10_template_id);
        if (template) {
          const completedSlides = await getCompletedEtsySlides(supabase, project_id);
          await processSlide10WithTemplate(supabase, slide10Task, project, template, completedSlides);
        } else {
          console.error(`${LOG_TAG} Template not found, falling back to standard generation`);
          await processImageTaskWithRetry(supabase, slide10Task, project);
        }
      } else {
        // No template - use standard Create API
        console.log(`${LOG_TAG} Processing Slide 10 with standard Create API`);
        await processImageTaskWithRetry(supabase, slide10Task, project);
      }
    }

    // Process Pinterest tasks (always with rate limiting)
    if (pinterestTasks.length > 0) {
      console.log(`${LOG_TAG} Processing Pinterest tasks`);
      await sleep(RATE_LIMIT_DELAY_MS);
      await processTasksWithRateLimit(supabase, pinterestTasks, project);
    }

    // 6. Check final status
    const finalStatus = await checkAllTasksStatus(supabase, project_id);
    console.log(`${LOG_TAG} Final status: ${finalStatus.completedCount}/${finalStatus.totalCount} completed, ${finalStatus.failedCount} failed`);

    // 7. Calculate actual cost
    // Count completed tasks by type
    const { data: completedTasks } = await supabase
      .from('etsy_empire_tasks')
      .select('task_type')
      .eq('project_id', project_id)
      .eq('status', 'completed');

    const completedImages = (completedTasks || []).filter(t => t.task_type !== 'etsy_video').length;
    const completedVideos = (completedTasks || []).filter(t => t.task_type === 'etsy_video').length;
    const actualCost = (completedImages * COST_PER_IMAGE) + (completedVideos * COST_PER_VIDEO);

    if (finalStatus.allCompleted) {
      // Generate spintax (only if Pinterest was enabled)
      if (project.pinterest_enabled) {
        await generateSpintax(supabase, project_id, project);
      }

      // Update project as completed
      await updateProjectStatus(supabase, project_id, 'completed', {
        actual_cost: actualCost
      });

      console.log(`${LOG_TAG} Project ${project_id} completed successfully. Cost: $${actualCost.toFixed(2)}`);

    } else if (finalStatus.hasPermanentFailures) {
      // Still generate spintax for whatever was completed
      if (project.pinterest_enabled && finalStatus.completedCount > 0) {
        await generateSpintax(supabase, project_id, project);
      }

      // Mark as failed but preserve partial results
      await updateProjectStatus(supabase, project_id, 'failed', {
        last_error: `${finalStatus.failedCount} of ${finalStatus.totalCount} tasks failed permanently`,
        actual_cost: actualCost
      });

      console.log(`${LOG_TAG} Project ${project_id} partially failed. ${finalStatus.completedCount} completed, ${finalStatus.failedCount} failed.`);
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
