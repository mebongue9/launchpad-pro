// netlify/functions/cover-templates.js
// Returns all cover templates (defaults + user's own)
// Used by Visual Builder to display template selection
// RELEVANT FILES: src/pages/VisualBuilder.jsx, src/components/visual-builder/TemplateSelector.jsx

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LOG_TAG = '[COVER-TEMPLATES]';

export async function handler(event) {
  console.log(`🎨 ${LOG_TAG} Function invoked`);

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get authorization header to identify user (optional - for user's own templates)
    const authHeader = event.headers.authorization || event.headers.Authorization;
    let userId = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        userId = user.id;
      }
    }

    // Build query - get default templates + user's own
    let query = supabase
      .from('cover_templates')
      .select('id, name, description, primary_color, secondary_color, tertiary_color, font_family, font_family_url, is_default, is_gradient, html_template, css_styles, created_at')
      .order('is_default', { ascending: false })
      .order('name');

    // If user is logged in, also get their custom templates
    if (userId) {
      query = query.or(`is_default.eq.true,created_by.eq.${userId}`);
    } else {
      query = query.eq('is_default', true);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error(`❌ ${LOG_TAG} Error fetching templates:`, error);
      throw error;
    }

    console.log(`✅ ${LOG_TAG} Returned ${templates.length} templates`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templates,
        count: templates.length
      })
    };

  } catch (error) {
    console.error(`❌ ${LOG_TAG} Error:`, error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
}
