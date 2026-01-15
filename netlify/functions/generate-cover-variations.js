// netlify/functions/generate-cover-variations.js
// Generates 4 HTML/CSS cover variations based on image analysis
// Uses Claude Vision to create CSS-based reproductions of uploaded cover designs
// PART OF: Cover Lab (Creative Lab) feature
// RELEVANT FILES: src/components/visual-builder/CreativeLab.jsx, src/components/visual-builder/VariationsGrid.jsx

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const LOG_TAG = '[GENERATE-COVER-VARIATIONS]';

// Initialize clients
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// System prompt for generating CSS cover variations
const COVER_GENERATOR_PROMPT = `You are an expert CSS/HTML designer who creates book cover templates.

Your task is to generate 4 unique HTML/CSS variations of a book cover design based on an uploaded reference image.

## COVER SPECIFICATIONS:
- Size: 8.5 inches wide x 11 inches tall (Letter size)
- Must work at 150 DPI for PDF generation
- All styling must be pure CSS (no external images)
- Use CSS variables for colors: var(--primary-color), var(--secondary-color), var(--tertiary-color)

## TEMPLATE PLACEHOLDERS (REQUIRED):
The HTML must include these exact placeholders:
- {{title}} - Main product title
- {{subtitle}} - Product subtitle (optional)
- {{author}} - Author name
- {{handle}} - Social media handle (e.g., @username)
- {{year}} - Current year

## THE 2 VARIATIONS:
1. **Exact Match**: Faithful reproduction of the original design
2. **Style Variation**: Same colors, different typography weight or layout positioning

## CSS REQUIREMENTS:
- Use Google Fonts (suggest appropriate ones)
- Include @import for Google Fonts in css_styles
- Use flexbox or grid for layout
- All colors via CSS variables
- Background can be solid, gradient, or pattern (CSS only)
- Text effects via text-shadow, CSS filters, or transforms

## HTML STRUCTURE:
\`\`\`html
<div class="cover">
  <div class="cover-content">
    <!-- Design elements here -->
    <h1 class="title">{{title}}</h1>
    <h2 class="subtitle">{{subtitle}}</h2>
    <div class="author">{{author}}</div>
    <div class="handle">{{handle}}</div>
    <div class="year">{{year}}</div>
  </div>
</div>
\`\`\`

## OUTPUT FORMAT (JSON ONLY):
{
  "variations": [
    {
      "id": 1,
      "name": "Exact Match",
      "description": "Brief description of this variation",
      "html_template": "<div class=\\"cover\\">...</div>",
      "css_styles": ".cover { ... }",
      "colors": {
        "primary": "#XXXXXX",
        "secondary": "#XXXXXX",
        "tertiary": "#XXXXXX"
      },
      "font_family": "Font Name",
      "font_family_url": "https://fonts.googleapis.com/css2?family=...",
      "is_gradient": true
    },
    // ... 1 more variation
  ]
}

## IMPORTANT RULES:
1. Return ONLY valid JSON, no other text
2. Both variations must be complete and functional
3. HTML must be properly escaped for JSON (use \\" for quotes)
4. CSS must include the Google Font @import at the top
5. Each variation should be noticeably different
6. Preserve the overall aesthetic feel of the original
7. All placeholders ({{title}}, etc.) must be present in each variation`;

// Retry logic with exponential backoff
async function callWithRetry(fn, maxRetries = 2) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      console.log(`${LOG_TAG} Attempt ${attempt} failed: ${error.message}`);
      if (attempt === maxRetries) throw error;
      const delay = 1000 * attempt; // Exponential backoff
      console.log(`${LOG_TAG} Retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// Parse Claude's JSON response
function parseJSON(text) {
  try {
    // Try direct parse first
    return JSON.parse(text);
  } catch (e) {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    // Try to find JSON object in text
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]);
    }
    throw new Error('Could not parse JSON from response');
  }
}

export async function handler(event) {
  console.log(`${LOG_TAG} Function invoked`);

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    const { imageBase64, analysis, userId } = JSON.parse(event.body);

    console.log(`${LOG_TAG} Request received - userId: ${userId || 'anonymous'}`);

    // Validate required fields
    if (!imageBase64) {
      console.log(`${LOG_TAG} Missing imageBase64`);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Image is required' })
      };
    }

    if (!analysis) {
      console.log(`${LOG_TAG} Missing analysis from previous step`);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Analysis data is required' })
      };
    }

    // Check if design was deemed not doable
    if (analysis.verdict === 'not_doable') {
      console.log(`${LOG_TAG} Design marked as not doable, cannot generate variations`);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'This design cannot be reproduced with CSS/HTML. Please try a different image.'
        })
      };
    }

    // MANDATORY: Image size check (4MB max for base64 string)
    if (imageBase64.length > 4 * 1024 * 1024) {
      console.log(`${LOG_TAG} Image too large: ${(imageBase64.length / 1024 / 1024).toFixed(2)}MB`);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Image too large. Max 4MB after compression.'
        })
      };
    }

    console.log(`${LOG_TAG} Image size: ${(imageBase64.length / 1024).toFixed(2)}KB`);

    // Extract media type and base64 data
    let mediaType = 'image/jpeg';
    let base64Data = imageBase64;

    if (imageBase64.startsWith('data:')) {
      const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mediaType = match[1];
        base64Data = match[2];
      }
    }

    console.log(`${LOG_TAG} Media type: ${mediaType}`);

    // Build context from analysis
    const analysisContext = `
## ANALYSIS FROM PREVIOUS STEP:
- Verdict: ${analysis.verdict}
- Extracted Colors: Primary ${analysis.extractedColors?.primary}, Secondary ${analysis.extractedColors?.secondary}, Tertiary ${analysis.extractedColors?.tertiary}
- Suggested Fonts: ${(analysis.suggestedFonts || []).join(', ')}
- Layout Type: ${analysis.layoutType}
- Explanation: ${analysis.explanation}
${analysis.warnings?.length > 0 ? `- Warnings: ${analysis.warnings.join(', ')}` : ''}

Use these colors and fonts as the basis for your variations.`;

    console.log(`${LOG_TAG} Calling Claude Vision API with retry logic...`);

    // Call Claude API with retry logic and timeout
    const generateVariations = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      try {
        const response = await anthropic.messages.create({
          model: 'claude-3-5-haiku-20241022', // Using Haiku for faster response (Sonnet times out on netlify dev)
          max_tokens: 8192, // Higher limit for 4 complete HTML/CSS templates
          system: COVER_GENERATOR_PROMPT,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mediaType,
                    data: base64Data
                  }
                },
                {
                  type: 'text',
                  text: `${analysisContext}

Generate 2 HTML/CSS cover variations based on this reference image. Each variation should:
1. Use the extracted colors as CSS variables
2. Match the suggested fonts (use Google Fonts)
3. Include all required placeholders ({{title}}, {{subtitle}}, {{author}}, {{handle}}, {{year}})
4. Be complete and ready to render

Return ONLY valid JSON with the variations array.`
                }
              ]
            }
          ]
        }, { signal: controller.signal });

        clearTimeout(timeoutId);
        return response;

      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Generation timed out. Please try again.');
        }
        throw error;
      }
    };

    const response = await callWithRetry(generateVariations, 2);

    console.log(`${LOG_TAG} Claude API response received`);
    console.log(`${LOG_TAG} Token usage: input=${response.usage?.input_tokens}, output=${response.usage?.output_tokens}`);

    // Parse the response
    const responseText = response.content[0].text;
    console.log(`${LOG_TAG} Response length: ${responseText.length} characters`);

    const result = parseJSON(responseText);

    // Validate the response structure
    if (!result.variations || !Array.isArray(result.variations)) {
      throw new Error('Invalid response structure: missing variations array');
    }

    if (result.variations.length < 2) {
      console.warn(`${LOG_TAG} Warning: Only ${result.variations.length} variations returned (expected 2)`);
    }

    // Validate each variation has required fields
    result.variations.forEach((variation, index) => {
      if (!variation.html_template) {
        throw new Error(`Variation ${index + 1} missing html_template`);
      }
      if (!variation.css_styles) {
        throw new Error(`Variation ${index + 1} missing css_styles`);
      }
      if (!variation.colors) {
        // Use analysis colors as fallback
        variation.colors = analysis.extractedColors;
      }
      if (!variation.font_family) {
        variation.font_family = analysis.suggestedFonts?.[0] || 'Inter';
      }
      // Ensure is_gradient is boolean
      variation.is_gradient = Boolean(variation.is_gradient);
      // Ensure id is set
      variation.id = variation.id || (index + 1);
    });

    console.log(`${LOG_TAG} Generated ${result.variations.length} variations`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        variations: result.variations
      })
    };

  } catch (error) {
    console.error(`${LOG_TAG} Error:`, error.message);
    console.error(`${LOG_TAG} Stack:`, error.stack);

    // Check if it's a timeout error
    if (error.message.includes('timed out')) {
      return {
        statusCode: 408,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Generation timed out. Please try again.'
        })
      };
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate variations'
      })
    };
  }
}
