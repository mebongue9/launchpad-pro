// netlify/functions/get-app-settings.js
// Returns all app settings for admin configuration
// Used by Settings page to display current retry configuration
// RELEVANT FILES: src/components/settings/GenerationSettingsSection.jsx

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LOG_TAG = '[GET-APP-SETTINGS]';

export async function handler(event) {
  console.log(`🔍 ${LOG_TAG} Function invoked`);

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { data: settings, error } = await supabase
      .from('app_settings')
      .select('*')
      .order('key');

    if (error) {
      console.error(`❌ ${LOG_TAG} Error fetching settings:`, error);
      throw error;
    }

    // Convert to key-value map
    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.key] = {
        value: s.value,
        description: s.description
      };
    });

    console.log(`✅ ${LOG_TAG} Returned ${settings.length} settings`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        settings: settingsMap,
        count: settings.length
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
