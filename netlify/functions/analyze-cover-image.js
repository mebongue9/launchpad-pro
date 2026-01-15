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

// System prompt for cover analysis
const COVER_ANALYST_PROMPT = `You are an expert CSS/HTML designer who analyzes book cover designs to determine if they can be reproduced using pure CSS/HTML.

Your job is to:
1. Evaluate if the design can be recreated with CSS/HTML (no images, no photos, no complex illustrations)
2. Extract the 3 most prominent colors from the design
3. Identify the layout type
4. Suggest Google Fonts that match the typography style

## WHAT CSS/HTML CAN RECREATE:
- Solid color backgrounds
- Gradient backgrounds (linear, radial)
- Geometric shapes (rectangles, circles, triangles via CSS)
- Text effects (shadows, glows, outlines via text-shadow and CSS filters)
- Borders, lines, dividers
- Simple patterns (stripes, dots via CSS gradients or pseudo-elements)
- Any typography style (fonts can be matched with Google Fonts)

## WHAT CSS/HTML CANNOT RECREATE:
- Photographs or photos
- Complex illustrations or drawings
- 3D rendered objects
- AI-generated imagery
- Text behind subject (text masking with photos)
- Complex textures (wood, marble, fabric)
- Hand-drawn elements
- Stock images integrated into design

## VERDICT RULES:
- "doable": ALL elements can be CSS/HTML (solid colors, gradients, shapes, text)
- "partially_doable": MOST elements can be done, some will be simplified (e.g., complex pattern → simple pattern)
- "not_doable": Contains photos, 3D objects, complex illustrations, or AI-generated imagery

## OUTPUT FORMAT (JSON ONLY):
{
  "verdict": "doable" | "partially_doable" | "not_doable",
  "explanation": "Brief explanation of what you see and why you gave this verdict",
  "warnings": ["List of any elements that may not match exactly", "Empty array if none"],
  "extractedColors": {
    "primary": "#XXXXXX",
    "secondary": "#XXXXXX",
    "tertiary": "#XXXXXX"
  },
  "suggestedFonts": ["Font Name 1", "Font Name 2"],
  "layoutType": "centered" | "left-aligned" | "right-aligned" | "split"
}

IMPORTANT:
- Return ONLY valid JSON, no other text
- Colors must be in hex format (#XXXXXX)
- Suggest 2-3 Google Fonts that match the style
- Layout type describes where the title is positioned`;

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
                text: 'Analyze this book cover design. Determine if it can be reproduced with CSS/HTML, extract the colors, suggest matching fonts, and identify the layout type. Return ONLY valid JSON.'
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
