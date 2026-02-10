// netlify/functions/create-etsy-empire-project.js
// Creates a project record and task records, triggers background processing, returns immediately
// PART OF: Etsy Empire visual generation system
// RELEVANT FILES: process-etsy-empire-background.js, get-etsy-empire-project.js

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const LOG_TAG = '[CREATE-ETSY-EMPIRE-PROJECT]';

// 12 Etsy slide types (expanded with data-backed variants)
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
  'library',        // Grid of items showing volume of content
  'desk_burgundy',  // iMac on burgundy leather desk pad
  'smartphone_gift' // Phone with ribbon bow, gift aesthetic
];

// 6 Pinterest pin categories with weighted distribution (research-backed)
// Source: ETSY-EMPIRE-VISUAL-FRAMEWORK-LIBRARY.md
const PINTEREST_CATEGORIES_WEIGHTED = [
  { category: 'lifestyle_hands',  weight: 27 },  // 27% - highest engagement
  { category: 'typography_quote', weight: 26 },  // 26% - bold statements
  { category: 'desk_setup',       weight: 16 },  // 16% - aspirational
  { category: 'flatlay',          weight: 14 },  // 14% - shows volume
  { category: 'grid_preview',     weight: 10 },  // 10% - overview
  { category: 'device_mockup',    weight: 8  }   // 8%  - lowest
];

/**
 * Calculate exact category distribution for a given pin count
 * @param {number} pinCount - Total pins to distribute
 * @returns {Array} Array of {category, count} objects
 */
function calculateCategoryDistribution(pinCount) {
  const totalWeight = PINTEREST_CATEGORIES_WEIGHTED.reduce((sum, c) => sum + c.weight, 0);
  const distribution = [];
  let remaining = pinCount;

  for (let i = 0; i < PINTEREST_CATEGORIES_WEIGHTED.length; i++) {
    const cat = PINTEREST_CATEGORIES_WEIGHTED[i];
    let count;

    if (i === PINTEREST_CATEGORIES_WEIGHTED.length - 1) {
      count = remaining;
    } else {
      count = Math.round((cat.weight / totalWeight) * pinCount);
      count = Math.min(count, remaining);
    }

    if (count > 0) {
      distribution.push({ category: cat.category, count });
      remaining -= count;
    }
  }

  return distribution;
}

/**
 * Create interleaved Pinterest tasks (round-robin across categories)
 * Prevents consecutive same-category pins which cause angle monotony
 * @param {string} projectId - Project UUID
 * @param {number} pinCount - Total pins to create
 * @param {Array} pinTexts - Generated pin texts
 * @param {string} productTitle - Fallback text
 * @returns {Array} Array of task objects ready for insertion
 */
function createInterleavedPinterestTasks(projectId, pinCount, pinTexts, productTitle) {
  const distribution = calculateCategoryDistribution(pinCount);
  const tasks = [];

  // Track remaining count per category
  const categoryCounters = {};
  for (const { category, count } of distribution) {
    categoryCounters[category] = { total: count, used: 0, variation: 0 };
  }

  // Round-robin through categories until all pins created
  let pinIndex = 0;
  let categoriesExhausted = false;

  while (!categoriesExhausted && pinIndex < pinCount) {
    categoriesExhausted = true;

    for (const { category } of distribution) {
      const counter = categoryCounters[category];

      if (counter.used < counter.total) {
        categoriesExhausted = false;
        counter.variation = (counter.variation % 5) + 1; // Rotate 1->2->3->4->5->1
        counter.used++;

        tasks.push({
          project_id: projectId,
          task_type: 'pinterest_pin',
          slide_type: category,
          variation_number: counter.variation,
          pin_text: pinTexts[pinIndex] || productTitle,
          prompt: '',
          status: 'queued'
        });

        pinIndex++;
        if (pinIndex >= pinCount) break;
      }
    }
  }

  return tasks;
}

// Cost constants (kie.ai pricing)
const COST_PER_IMAGE = 0.02;
const COST_PER_VIDEO = 0.10;

// Language detection using Claude Haiku (fast and cheap)
// Detects language from TLDR text (which is already in the correct language from funnel)
async function detectLanguage(text) {
  if (!text || text.length < 20) {
    return 'en'; // Default to English if not enough text
  }

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 10,
      messages: [{
        role: 'user',
        content: `What language is this text written in? Reply with ONLY the ISO 639-1 language code (e.g., 'en', 'fr', 'id', 'es', 'de', 'ja', 'zh', 'pt', 'it', 'nl', 'ko', 'th', 'vi', 'ar', 'hi', 'ru').

Text: "${text.substring(0, 500)}"`
      }]
    });

    const langCode = response.content[0].text.trim().toLowerCase();

    // Validate it's a real language code (2 letters)
    if (/^[a-z]{2}$/.test(langCode)) {
      console.log(`${LOG_TAG} Detected language: ${langCode}`);
      return langCode;
    }

    console.log(`${LOG_TAG} Invalid language code response: ${langCode}, defaulting to en`);
    return 'en';
  } catch (err) {
    console.error(`${LOG_TAG} Language detection failed:`, err.message);
    return 'en'; // Default to English on error
  }
}

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
      product_format = 'digital product',
      pinterest_enabled = true,
      pinterest_pin_count = 32,
      manifestable_ratio = 0.70,
      video_enabled = false,  // NEW: default OFF
      test_mode = false,  // Test mode: 1 Etsy + 1 Pinterest
      slide10_template_id = null,  // Slide 10 template feature
      overlay_count = 4,  // Slide 10 overlay count (2-6)
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

    // Initialize Supabase client (must be before any supabase usage)
    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Validate manifestable_ratio range
    const ratio = Math.max(0.50, Math.min(0.90, manifestable_ratio));

    // Validate overlay_count (2-6, default 4)
    const validOverlayCount = Math.max(2, Math.min(6, overlay_count || 4));

    // Validate slide10_template_id if provided
    let validatedTemplateId = null;
    if (slide10_template_id) {
      const { data: template, error: templateError } = await supabase
        .from('etsy_empire_templates')
        .select('id, user_id')
        .eq('id', slide10_template_id)
        .single();

      if (templateError || !template) {
        console.log(`${LOG_TAG} Template not found: ${slide10_template_id}`);
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Template not found' })
        };
      }

      if (template.user_id !== user_id) {
        console.log(`${LOG_TAG} Template does not belong to user`);
        return {
          statusCode: 403,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Template access denied' })
        };
      }

      validatedTemplateId = slide10_template_id;
      console.log(`${LOG_TAG} Using template for Slide 10: ${validatedTemplateId}`);
    }

    // Validate pinterest_pin_count (must be 8, 16, or 32)
    const validPinCount = [8, 16, 32].includes(pinterest_pin_count) ? pinterest_pin_count : 32;

    // Calculate task counts
    let etsyImageCount, etsyVideoCount, pinterestCount;

    if (test_mode) {
      // Test mode: 1 Etsy + 1 Pinterest = $0.04
      etsyImageCount = 1;
      etsyVideoCount = 0;
      pinterestCount = pinterest_enabled ? 1 : 0;
      console.log(`${LOG_TAG} TEST MODE enabled - generating minimal set`);
    } else {
      // Normal mode: 10 images if video OFF, 9 images + 1 video if video ON
      etsyImageCount = 10;
      etsyVideoCount = 0;

      if (video_enabled) {
        etsyImageCount = 9;  // Slide 1 + Slides 3-10
        etsyVideoCount = 1;  // Slide 2 is video
      }

      // Pinterest tasks
      pinterestCount = pinterest_enabled ? validPinCount : 0;
    }

    // Total tasks
    const totalTasks = etsyImageCount + etsyVideoCount + pinterestCount;

    // Calculate estimated cost
    const imageCost = (etsyImageCount + pinterestCount) * COST_PER_IMAGE;
    const videoCost = etsyVideoCount * COST_PER_VIDEO;
    const estimatedCost = imageCost + videoCost;

    console.log(`${LOG_TAG} Creating project: "${product_title}"`);
    console.log(`${LOG_TAG} Pinterest: ${pinterest_enabled}, Video: ${video_enabled}, Test: ${test_mode}, Total tasks: ${totalTasks}, Est. cost: $${estimatedCost.toFixed(2)}`);

    // Detect language from TLDR (which is already in the correct language from funnel)
    let detectedLanguage = 'en'; // Default fallback
    if (tldr_text && tldr_text.length > 20) {
      detectedLanguage = await detectLanguage(tldr_text);
    }
    console.log(`${LOG_TAG} Detected language from TLDR: ${detectedLanguage}`);

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
        product_format,
        pinterest_enabled,
        pinterest_pin_count: validPinCount,
        manifestable_ratio: ratio,
        video_enabled: test_mode ? false : video_enabled,  // Disable video in test mode
        test_mode,  // Store test mode flag
        detected_language: detectedLanguage,  // Language auto-detected from PDF
        slide10_template_id: validatedTemplateId,  // Slide 10 template feature
        overlay_count: validatedTemplateId ? validOverlayCount : null,  // Only set if template selected
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

    // Generate pin texts BEFORE creating tasks (only if Pinterest enabled)
    let pinTexts = [];
    const actualPinCount = test_mode ? 1 : (pinterest_enabled ? validPinCount : 0);
    if (actualPinCount > 0) {
      try {
        console.log(`${LOG_TAG} Generating ${actualPinCount} product-specific pin texts...`);
        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY
        });

        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          messages: [{
            role: 'user',
            content: `Generate ${actualPinCount} short, punchy Pinterest pin texts (4-6 words max each) for this product:

Title: ${product_title}
Description: ${tldr_text}

Requirements:
- Each text should make people want to click
- Include numbers if the product has numbers (e.g., "7 Proven Formulas")
- Use action words (Get, Grab, Master, Transform, etc.)
- Be specific to this product (not generic like "Plan Your Success")
- Vary the style: some questions, some statements, some with numbers
- Make them feel personal and achievable

Return ONLY a valid JSON array of strings, no explanation. Example format:
["Text 1", "Text 2", "Text 3"]`
          }]
        });

        const responseText = response.content[0].text.trim();
        // Parse JSON, handling potential markdown code blocks
        const jsonText = responseText.replace(/```json\n?|\n?```/g, '').trim();
        pinTexts = JSON.parse(jsonText);
        console.log(`${LOG_TAG} Generated ${pinTexts.length} pin texts`);
      } catch (pinTextError) {
        console.error(`${LOG_TAG} Failed to generate pin texts, using product title as fallback:`, pinTextError.message);
        // Fallback: use product title for all pins
        pinTexts = Array(actualPinCount).fill(product_title);
      }
    }

    // Create task records
    const tasks = [];

    // Select 10 random slide types from the 12 available
    const shuffledSlideTypes = [...ETSY_SLIDE_TYPES].sort(() => Math.random() - 0.5);
    const selectedSlideTypes = shuffledSlideTypes.slice(0, 10);

    // Create Etsy slide tasks
    if (test_mode) {
      // Test mode: 1 Etsy slide only (hero)
      tasks.push({
        project_id: project.id,
        task_type: 'etsy_slide',
        slide_type: 'hero',  // Always use hero for test mode
        variation_number: 1,
        prompt: '',
        status: 'queued'
      });
    } else if (video_enabled) {
      // Video enabled: Slide 1 = image, Slide 2 = video, Slides 3-10 = images

      // Slide 1 (image)
      tasks.push({
        project_id: project.id,
        task_type: 'etsy_slide',
        slide_type: selectedSlideTypes[0],
        variation_number: 1,
        prompt: '',
        status: 'queued'
      });

      // Slide 2 (video task)
      tasks.push({
        project_id: project.id,
        task_type: 'etsy_video',
        slide_type: 'video',
        variation_number: 2,
        prompt: 'subtle zoom and pan',
        status: 'queued'
      });

      // Slides 3-10 (images)
      for (let i = 1; i < 9; i++) {
        tasks.push({
          project_id: project.id,
          task_type: 'etsy_slide',
          slide_type: selectedSlideTypes[i],
          variation_number: i + 2,  // 3, 4, 5, 6, 7, 8, 9, 10
          prompt: '',
          status: 'queued'
        });
      }
    } else {
      // Video disabled: All 10 slides are images
      for (let i = 0; i < 10; i++) {
        tasks.push({
          project_id: project.id,
          task_type: 'etsy_slide',
          slide_type: selectedSlideTypes[i],
          variation_number: i + 1,  // 1-10
          prompt: '',
          status: 'queued'
        });
      }
    }

    // Create Pinterest pin tasks
    if (test_mode && pinterestCount > 0) {
      // Test mode: 1 Pinterest pin only (quote category)
      tasks.push({
        project_id: project.id,
        task_type: 'pinterest_pin',
        slide_type: 'quote',  // Always use quote for test mode
        variation_number: 1,
        pin_text: pinTexts[0] || product_title,
        prompt: '',
        status: 'queued'
      });
    } else if (pinterest_enabled && validPinCount > 0) {
      // Normal mode: weighted distribution with round-robin interleaving
      const pinterestTasks = createInterleavedPinterestTasks(
        project.id,
        validPinCount,
        pinTexts,
        product_title
      );

      console.log(`${LOG_TAG} Created ${pinterestTasks.length} interleaved Pinterest tasks`);
      tasks.push(...pinterestTasks);
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

    // Trigger background function (must await to ensure request is sent)
    const backgroundUrl = `${process.env.URL || 'http://localhost:8888'}/.netlify/functions/process-etsy-empire-background`;

    console.log(`${LOG_TAG} Triggering background function at: ${backgroundUrl}`);

    try {
      const bgResponse = await fetch(backgroundUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: project.id })
      });
      console.log(`${LOG_TAG} Background function triggered, status: ${bgResponse.status}`);
    } catch (err) {
      console.error(`${LOG_TAG} Failed to trigger background task:`, err.message);
      // Don't fail the main request, just log the error
    }

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
        video_enabled,  // NEW: include in response
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
