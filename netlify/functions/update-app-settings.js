// netlify/functions/update-app-settings.js
// Updates app settings (retry configuration)
// Used by Settings page to save new retry delays
// RELEVANT FILES: src/components/settings/GenerationSettingsSection.jsx, lib/retry-engine.js

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LOG_TAG = '[UPDATE-APP-SETTINGS]';

export async function handler(event) {
  console.log(`🔧 ${LOG_TAG} Function invoked`);

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { settings } = JSON.parse(event.body || '{}');

    if (!settings || typeof settings !== 'object') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid settings format' })
      };
    }

    console.log(`📝 ${LOG_TAG} Updating ${Object.keys(settings).length} settings`);

    // Update each setting
    const updates = [];
    for (const [key, value] of Object.entries(settings)) {
      const { error } = await supabase
        .from('app_settings')
        .update({
          value: value.toString(),
          updated_at: new Date().toISOString()
        })
        .eq('key', key);

      if (error) {
        console.error(`❌ ${LOG_TAG} Error updating ${key}:`, error);
        throw error;
      }

      updates.push(key);
    }

    console.log(`✅ ${LOG_TAG} Updated settings:`, updates);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        updated: updates,
        message: 'Settings updated successfully'
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
