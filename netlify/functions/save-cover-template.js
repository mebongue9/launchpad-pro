// netlify/functions/save-cover-template.js
// Saves a cover variation to user's cover library
// Inserts into cover_templates table with created_by = userId
// PART OF: Cover Lab (Creative Lab) feature
// RELEVANT FILES: src/components/visual-builder/SaveTemplateDialog.jsx, src/hooks/useCoverTemplates.js

import { createClient } from '@supabase/supabase-js';

const LOG_TAG = '[SAVE-COVER-TEMPLATE]';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Validate hex color format
function isValidHexColor(color) {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
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
    const { userId, name, variation } = JSON.parse(event.body);

    console.log(`${LOG_TAG} Request received - userId: ${userId || 'not provided'}, name: ${name}`);

    // Validate required fields
    if (!userId) {
      console.log(`${LOG_TAG} Missing userId`);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'User ID is required' })
      };
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      console.log(`${LOG_TAG} Missing or invalid name`);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Template name is required' })
      };
    }

    // Validate name length
    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      console.log(`${LOG_TAG} Name too long: ${trimmedName.length} characters`);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Template name must be 100 characters or less' })
      };
    }

    if (!variation) {
      console.log(`${LOG_TAG} Missing variation data`);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Variation data is required' })
      };
    }

    // Validate variation has required fields
    if (!variation.html_template) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'HTML template is required' })
      };
    }

    if (!variation.css_styles) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'CSS styles are required' })
      };
    }

    // Extract and validate colors
    const colors = variation.colors || {};
    const primaryColor = colors.primary || '#000000';
    const secondaryColor = colors.secondary || '#333333';
    const tertiaryColor = colors.tertiary || '#666666';

    // Validate hex color format
    if (!isValidHexColor(primaryColor)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Invalid primary color format. Must be #XXXXXX' })
      };
    }
    if (!isValidHexColor(secondaryColor)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Invalid secondary color format. Must be #XXXXXX' })
      };
    }
    if (!isValidHexColor(tertiaryColor)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Invalid tertiary color format. Must be #XXXXXX' })
      };
    }

    console.log(`${LOG_TAG} Validation passed, inserting template...`);

    // Build the template record
    const templateRecord = {
      name: trimmedName,
      description: variation.description || `Custom template created in Cover Lab`,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      tertiary_color: tertiaryColor,
      font_family: variation.font_family || 'Inter',
      font_family_url: variation.font_family_url || null,
      html_template: variation.html_template,
      css_styles: variation.css_styles,
      is_default: false, // User-created templates are NEVER default
      is_gradient: Boolean(variation.is_gradient),
      created_by: userId
    };

    console.log(`${LOG_TAG} Template record:`, {
      name: templateRecord.name,
      font_family: templateRecord.font_family,
      is_gradient: templateRecord.is_gradient,
      colors: { primary: primaryColor, secondary: secondaryColor, tertiary: tertiaryColor }
    });

    // Insert into database
    const { data: template, error } = await supabase
      .from('cover_templates')
      .insert(templateRecord)
      .select('id, name, created_at')
      .single();

    if (error) {
      console.error(`${LOG_TAG} Database error:`, error);
      throw new Error(error.message || 'Failed to save template');
    }

    console.log(`${LOG_TAG} Template saved successfully:`, template.id);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        template: {
          id: template.id,
          name: template.name,
          created_at: template.created_at
        }
      })
    };

  } catch (error) {
    console.error(`${LOG_TAG} Error:`, error.message);
    console.error(`${LOG_TAG} Stack:`, error.stack);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to save template'
      })
    };
  }
}
