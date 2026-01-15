// netlify/functions/process-cover-generation-background.js
// Background function that does the heavy lifting - calls Claude, saves results
// CRITICAL: Named with -background suffix for Netlify Background Functions
// Can run up to 15 minutes without timeout
// PART OF: Cover Lab background task system
// RELEVANT FILES: start-cover-generation.js, check-cover-generation.js

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const LOG_TAG = '[PROCESS-COVER-GENERATION-BG]';

// System prompt for generating CSS cover variations
const COVER_GENERATOR_PROMPT = `You are an expert CSS/HTML designer who creates book cover templates.

Your task is to generate 4 unique HTML/CSS variations of a book cover design based on a design analysis.

## COVER SPECIFICATIONS:
- Size: 8.5 inches wide x 11 inches tall (Letter size)
- Must work at 150 DPI for PDF generation
- All styling must be pure CSS (no external images)
- Use the exact colors provided in the analysis

## TEMPLATE PLACEHOLDERS (REQUIRED):
The HTML must include these exact placeholders:
- {{title}} - Main product title
- {{subtitle}} - Product subtitle
- {{author}} - Author name
- {{handle}} - Social media handle (e.g., @username)
- {{year}} - Current year

## THE 4 VARIATIONS:
1. **Exact Match**: Faithful reproduction of the described design
2. **Typography Variation**: Same colors/layout, different font weight or text styling
3. **Layout Variation**: Same colors/fonts, different element positioning
4. **Effect Variation**: Same core design, different shadows/glows/gradient angles

## CSS REQUIREMENTS:
- Use Google Fonts (include @import in css_styles)
- Use flexbox or grid for layout
- Background can be solid, gradient, or pattern (CSS only)
- Text effects via text-shadow, CSS filters, or transforms

## HTML STRUCTURE:
\`\`\`html
<div class="cover">
  <div class="cover-content">
    <h1 class="title">{{title}}</h1>
    <h2 class="subtitle">{{subtitle}}</h2>
    <div class="author">{{author}}</div>
    <div class="handle">{{handle}}</div>
    <div class="year">{{year}}</div>
  </div>
</div>
\`\`\`

## OUTPUT FORMAT (JSON ONLY):
[
  {
    "name": "Exact Match",
    "description": "Brief description",
    "html_template": "<div class=\\"cover\\">...</div>",
    "css_styles": ".cover { ... }",
    "is_gradient": true
  }
]

## IMPORTANT RULES:
1. Return ONLY valid JSON array, no other text
2. All 4 variations must be complete and functional
3. HTML must be properly escaped for JSON
4. CSS must include the Google Font @import at the top
5. Each variation should be noticeably different
6. Preserve the overall aesthetic feel described`;

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
    const variations = await generateVariations(anthropic, analysisResult);
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

async function generateVariations(anthropic, analysisResult) {
  const { extractedColors, suggestedFonts, layoutType, explanation, elements } = analysisResult;

  // Build colors object from analysis
  const colors = extractedColors || {};
  const fonts = {
    suggested: suggestedFonts?.[0] || 'Inter',
    fallback: suggestedFonts?.[1] || 'system-ui, sans-serif'
  };

  const prompt = `Based on this analysis of a cover design, generate 4 HTML/CSS variations.

DESIGN ANALYSIS:
- Layout Description: ${explanation || 'Modern cover design'}
- Layout Type: ${layoutType || 'centered'}
- Primary Color: ${colors.primary || '#000000'}
- Secondary Color: ${colors.secondary || '#666666'}
- Tertiary Color: ${colors.tertiary || '#CCCCCC'}
- Font: ${fonts.suggested} (fallback: ${fonts.fallback})
- Design Elements: ${elements?.join(', ') || 'clean typography, modern layout'}

REQUIREMENTS:
1. Variation 1 (Exact Match): Reproduce the described design as closely as possible
2. Variation 2 (Typography): Same layout, different font weights or letter-spacing
3. Variation 3 (Layout): Same colors, different element positioning
4. Variation 4 (Effects): Add or modify shadows, glows, or gradient angles

Each variation must:
- Use the exact colors above as CSS values
- Include all placeholders: {{title}}, {{subtitle}}, {{author}}, {{handle}}, {{year}}
- Be complete, standalone HTML/CSS
- Use CSS gradients (no images)

OUTPUT: Return ONLY a JSON array with 4 objects. No markdown, no explanation, no code blocks.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    system: COVER_GENERATOR_PROMPT,
    messages: [{ role: 'user', content: prompt }]
  });

  const content = response.content[0].text;
  console.log(`${LOG_TAG} Claude response length: ${content.length} chars`);

  // Parse JSON (handle potential markdown code blocks)
  let jsonStr = content;
  if (content.includes('```json')) {
    jsonStr = content.split('```json')[1].split('```')[0];
  } else if (content.includes('```')) {
    jsonStr = content.split('```')[1].split('```')[0];
  }

  const variations = JSON.parse(jsonStr.trim());

  // Validate we got variations
  if (!Array.isArray(variations) || variations.length < 1) {
    throw new Error('Did not receive valid variations array');
  }

  // Add colors and font to each variation for reference
  return variations.map((v, i) => ({
    id: i + 1,
    ...v,
    colors: {
      primary: colors.primary,
      secondary: colors.secondary,
      tertiary: colors.tertiary
    },
    font_family: fonts.suggested,
    font_family_url: `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fonts.suggested)}:wght@400;700;900&display=swap`
  }));
}
