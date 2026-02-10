// netlify/functions/analyze-cover-image.js
// Analyzes uploaded cover image using Claude Vision API
// Returns feasibility verdict, extracted colors, and suggested fonts
// PART OF: Cover Lab (Creative Lab) feature
// RELEVANT FILES: src/components/visual-builder/CreativeLab.jsx, src/components/visual-builder/ImageUploader.jsx

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const LOG_TAG = '[ANALYZE-COVER-IMAGE]';

// Initialize clients
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// System prompt for cover analysis - EXPLICIT LEFT/RIGHT EDGE COLORS
const COVER_ANALYST_PROMPT = `You are analyzing a book cover design. Extract PRECISE spatial details.

CRITICAL: Pay attention to which side of the image each color appears on.

## WHAT CSS/HTML CAN RECREATE:
- Solid color backgrounds, gradient backgrounds
- Geometric shapes, text effects, borders, lines
- Any typography style with Google Fonts

## WHAT CSS/HTML CANNOT RECREATE:
- Photographs, complex illustrations, 3D objects, AI-generated imagery
- Text behind photos, complex textures, hand-drawn elements

## VERDICT RULES:
- "doable": ALL elements can be CSS/HTML
- "partially_doable": MOST elements can be done, some simplified
- "not_doable": Contains photos, 3D objects, complex illustrations

## OUTPUT FORMAT (JSON ONLY):
{
  "verdict": "doable" | "partially_doable" | "not_doable",
  "verdict_reason": "Why this verdict",

  "colors": {
    "primary": "#HEX - the main accent/brand color",
    "secondary": "#HEX - second color",
    "tertiary": "#HEX - third color or white/light for text"
  },

  "background": {
    "type": "gradient" | "solid" | "split",

    "left_side_color": "#HEX - what color is on the LEFT edge of the image",
    "right_side_color": "#HEX - what color is on the RIGHT edge of the image",
    "left_side_brightness": "dark" | "light",
    "right_side_brightness": "dark" | "light",

    "gradient_direction": "left-to-right" | "right-to-left" | "top-to-bottom" | "diagonal-tlbr" | "diagonal-trbl",
    "gradient_css": "linear-gradient(90deg, #LEFT_COLOR 0%, #RIGHT_COLOR 100%)"
  },

  "text_placement": {
    "horizontal_position": "left" | "center" | "right",
    "vertical_position": "top" | "middle" | "bottom",
    "sits_over_brightness": "dark" | "light",
    "text_alignment": "left" | "center" | "right"
  },

  "typography": {
    "headline_color": "#HEX",
    "subtitle_color": "#HEX",
    "author_color": "#HEX"
  },

  "fonts": {
    "suggested": "Font Name",
    "fallback": "sans-serif"
  },

  "decorative_elements": [
    {"type": "logo-circle", "position": "top-right"},
    {"type": "year-badge", "position": "top-left"}
  ],

  "css_reconstruction": "Write the EXACT CSS gradient needed. Example: background: linear-gradient(90deg, #1a1a1a 0%, #9AC032 100%);"
}

## CRITICAL INSTRUCTIONS:
1. Look at the LEFT EDGE of the image - what color is there? That's left_side_color.
2. Look at the RIGHT EDGE of the image - what color is there? That's right_side_color.
3. Is the LEFT side dark or light? Is the RIGHT side dark or light?
4. Where is the text positioned? LEFT side, CENTER, or RIGHT side?
5. Does the text sit over a DARK area or LIGHT area?
6. Write the actual CSS gradient that would recreate this background.

For the css_reconstruction field, write working CSS like:
- "background: linear-gradient(90deg, #000000 0%, #9AC032 100%);" for dark-left to green-right
- "background: linear-gradient(270deg, #000000 0%, #9AC032 100%);" for green-left to dark-right
- "background: linear-gradient(135deg, #000000 0%, #9AC032 100%);" for diagonal top-left to bottom-right

Output ONLY valid JSON. No markdown, no explanation.`;

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
    const { imageBase64, userId } = JSON.parse(event.body);

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

    // MANDATORY: Image size check (4MB max for base64 string)
    if (imageBase64.length > 4 * 1024 * 1024) {
      console.log(`${LOG_TAG} Image too large: ${(imageBase64.length / 1024 / 1024).toFixed(2)}MB`);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Image too large. Max 4MB after compression. Please try a smaller image.'
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
    console.log(`${LOG_TAG} Calling Claude Vision API...`);

    // Call Claude Vision API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: COVER_ANALYST_PROMPT,
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
                text: 'Analyze this book cover design. Extract PRECISE spatial details:\n\n1. What color is on the LEFT EDGE of the image?\n2. What color is on the RIGHT EDGE of the image?\n3. Is the LEFT side dark or light?\n4. Is the RIGHT side dark or light?\n5. Where is the text? LEFT side, CENTER, or RIGHT side?\n6. Does the text sit over a DARK or LIGHT area?\n7. Write the EXACT CSS gradient to recreate this background.\n\nReturn ONLY valid JSON matching the format in your instructions.'
              }
            ]
          }
        ]
      }, { signal: controller.signal });

      clearTimeout(timeoutId);

      console.log(`${LOG_TAG} Claude API response received`);
      console.log(`${LOG_TAG} Token usage: input=${response.usage?.input_tokens}, output=${response.usage?.output_tokens}`);

      // Parse the response
      const responseText = response.content[0].text;
      console.log(`${LOG_TAG} Raw response:`, responseText.substring(0, 200) + '...');

      const analysis = parseJSON(responseText);
      console.log(`${LOG_TAG} Parsed analysis - verdict: ${analysis.verdict}`);

      // Validate the response structure
      if (!analysis.verdict || !analysis.extractedColors || !analysis.suggestedFonts) {
        throw new Error('Invalid response structure from Claude');
      }

      // Ensure warnings is always an array
      if (!analysis.warnings) {
        analysis.warnings = [];
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          ...analysis
        })
      };

    } catch (apiError) {
      clearTimeout(timeoutId);

      if (apiError.name === 'AbortError') {
        console.error(`${LOG_TAG} API call timed out`);
        return {
          statusCode: 408,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            error: 'Analysis timed out. Please try again.'
          })
        };
      }
      throw apiError;
    }

  } catch (error) {
    console.error(`${LOG_TAG} Error:`, error.message);
    console.error(`${LOG_TAG} Stack:`, error.stack);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to analyze image'
      })
    };
  }
}
