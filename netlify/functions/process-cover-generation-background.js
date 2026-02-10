// netlify/functions/process-cover-generation-background.js
// Background function that does the heavy lifting - calls Claude, saves results
// CRITICAL: Named with -background suffix for Netlify Background Functions
// Can run up to 15 minutes without timeout
// PART OF: Cover Lab background task system
// RELEVANT FILES: start-cover-generation.js, check-cover-generation.js

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const LOG_TAG = '[PROCESS-COVER-GENERATION-BG]';

// System prompt removed - now using detailed prompt in generateVariationsWithDetailedPrompt

export async function handler(event) {
  console.log(`${LOG_TAG} Background function invoked`);

  // Background functions still receive events but don't return to client
  const { jobId } = JSON.parse(event.body || '{}');

  if (!jobId) {
    console.error(`${LOG_TAG} No jobId provided`);
    return { statusCode: 400 };
  }

  console.log(`${LOG_TAG} Processing job: ${jobId}`);

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Mark job as processing
    await supabase
      .from('cover_generation_jobs')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
        attempt_count: 1
      })
      .eq('id', jobId);

    console.log(`${LOG_TAG} Job marked as processing`);

    // Get job details
    const { data: job, error: fetchError } = await supabase
      .from('cover_generation_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (fetchError || !job) {
      throw new Error('Job not found');
    }

    const analysisResult = job.analysis_result;
    console.log(`${LOG_TAG} Analysis result loaded:`, JSON.stringify(analysisResult).substring(0, 200));

    // Initialize Claude
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    // Generate variations
    console.log(`${LOG_TAG} Calling Claude API...`);
    const variations = await generateVariationsWithDetailedPrompt(anthropic, analysisResult);
    console.log(`${LOG_TAG} Generated ${variations.length} variations`);

    // Save results
    await supabase
      .from('cover_generation_jobs')
      .update({
        status: 'completed',
        variations: variations,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);

    console.log(`${LOG_TAG} Job ${jobId} completed successfully`);

  } catch (error) {
    console.error(`${LOG_TAG} Job ${jobId} failed:`, error.message);

    // Mark job as failed
    await supabase
      .from('cover_generation_jobs')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);
  }

  return { statusCode: 200 };
}

// EXPLICIT LEFT/RIGHT EDGE VERSION - Prevents gradient reversal
async function generateVariationsWithDetailedPrompt(anthropic, analysisResult) {
  // Extract fields from the new v3 analysis format
  const { colors, background, text_placement, typography, fonts, decorative_elements, css_reconstruction } = analysisResult;

  // Build the EXPLICIT prompt with left/right edge colors
  const prompt = `You are an expert CSS developer. Create book cover templates that EXACTLY match the specifications.

## BACKGROUND SPECIFICATION (CRITICAL - DO NOT REVERSE)

The background has these EXACT colors on each side:
- LEFT EDGE of cover: ${background?.left_side_color || '#1a1a1a'} (${background?.left_side_brightness || 'dark'})
- RIGHT EDGE of cover: ${background?.right_side_color || '#9AC032'} (${background?.right_side_brightness || 'light'})

Gradient direction: ${background?.gradient_direction || 'left-to-right'}

USE THIS EXACT CSS FOR THE BACKGROUND:
${css_reconstruction || background?.gradient_css || `background: linear-gradient(90deg, ${background?.left_side_color || '#1a1a1a'} 0%, ${background?.right_side_color || '#9AC032'} 100%);`}

⚠️ DO NOT REVERSE THE GRADIENT ⚠️
The LEFT side must be ${background?.left_side_brightness || 'dark'} and the RIGHT side must be ${background?.right_side_brightness || 'light'}.

## TEXT PLACEMENT (CRITICAL)

- Text is positioned on the ${text_placement?.horizontal_position || 'left'} side of the cover
- Text is ${text_placement?.text_alignment || 'left'}-aligned
- Text sits over the ${text_placement?.sits_over_brightness || 'dark'} area
- Vertical position: ${text_placement?.vertical_position || 'middle'}

## COLORS

- Primary/Brand: ${colors?.primary || '#9AC032'}
- Secondary: ${colors?.secondary || '#1a1a1a'}
- Tertiary: ${colors?.tertiary || '#FFFFFF'}

## TYPOGRAPHY

- Headline: ${typography?.headline_color || '#FFFFFF'}
- Subtitle: ${typography?.subtitle_color || '#FFD700'}
- Author: ${typography?.author_color || '#FFFFFF'}
- Font: ${fonts?.suggested || 'Montserrat'}

## DECORATIVE ELEMENTS

${decorative_elements?.map(el => `- ${el.type} at ${el.position}`).join('\n') || '- Year badge at top-left\n- Logo circle at top-right'}

## YOUR TASK

Create 4 cover variations as a JSON array:

1. **Exact Match**: Use the EXACT CSS background provided. Do not modify the gradient direction.
2. **Typography Variation**: Same background, different font weight/spacing
3. **Layout Variation**: Same background, slightly adjusted text positions
4. **Effects Variation**: Same background, add subtle shadows/effects

## CRITICAL CSS RULES

Cover dimensions: 600px width × 800px height

For the background, copy this EXACTLY:
${css_reconstruction || background?.gradient_css || `background: linear-gradient(90deg, ${background?.left_side_color || '#1a1a1a'} 0%, ${background?.right_side_color || '#9AC032'} 100%);`}

Text positioning for LEFT side placement:
.text-container {
  position: absolute;
  left: 40px;           /* LEFT side */
  top: 50%;
  transform: translateY(-50%);
  text-align: left;
  max-width: 45%;
}

Text positioning for RIGHT side placement:
.text-container {
  position: absolute;
  right: 40px;          /* RIGHT side */
  top: 50%;
  transform: translateY(-50%);
  text-align: left;
  max-width: 45%;
}

Use placeholders: {{title}}, {{subtitle}}, {{author}}, {{handle}}, {{year}}

## OUTPUT FORMAT

Return ONLY a JSON array with 4 objects:
[
  {
    "name": "Exact Match",
    "description": "Faithful reproduction with ${background?.left_side_brightness || 'dark'} left side and ${background?.right_side_brightness || 'light'} right side",
    "html_template": "<div class=\\"cover\\">...</div>",
    "css_styles": ".cover { width: 600px; height: 800px; ${css_reconstruction || background?.gradient_css || 'background: linear-gradient(90deg, #1a1a1a 0%, #9AC032 100%);'} ... }",
    "is_gradient": true
  },
  ...
]

CRITICAL:
- First character must be [
- Last character must be ]
- No markdown, no explanation
- LEFT side of cover must be ${background?.left_side_brightness || 'dark'}
- RIGHT side of cover must be ${background?.right_side_brightness || 'light'}
- ⚠️ DO NOT REVERSE THE GRADIENT ⚠️`;

  console.log(`${LOG_TAG} Calling Claude with detailed prompt...`);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000, // Plenty of room for 4 detailed variations
    messages: [{ role: 'user', content: prompt }]
  });

  const content = response.content[0].text;
  console.log(`${LOG_TAG} Claude response length: ${content.length} chars`);

  // Parse JSON - handle potential markdown wrapping
  let jsonStr = content.trim();

  // Remove markdown code blocks if present
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
  }

  // Find the JSON array boundaries
  const startIndex = jsonStr.indexOf('[');
  const endIndex = jsonStr.lastIndexOf(']');

  if (startIndex === -1 || endIndex === -1) {
    console.error(`${LOG_TAG} Could not find JSON array in response:`, content.substring(0, 500));
    throw new Error('Could not find JSON array in response');
  }

  jsonStr = jsonStr.substring(startIndex, endIndex + 1);

  const variations = JSON.parse(jsonStr);

  if (!Array.isArray(variations)) {
    throw new Error('Response is not an array');
  }

  if (variations.length < 4) {
    console.warn(`${LOG_TAG} Expected 4 variations, got ${variations.length}`);
  }

  // Ensure all required fields are present and add colors/fonts
  return variations.map((v, i) => ({
    id: i + 1,
    name: v.name || `Variation ${i + 1}`,
    description: v.description || '',
    html_template: v.html_template || '',
    css_styles: v.css_styles || '',
    is_gradient: v.is_gradient ?? true,
    colors: {
      primary: colors?.primary || '#9AC032',
      secondary: colors?.secondary || '#1a1a1a',
      tertiary: colors?.tertiary || '#FFFFFF'
    },
    font_family: fonts?.suggested || 'Montserrat',
    font_family_url: `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fonts?.suggested || 'Montserrat')}:wght@400;700;900&display=swap`
  }));
}
