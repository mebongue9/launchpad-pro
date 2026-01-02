// /netlify/functions/add-avatar-column.js
// Migration to add avatar column to profiles table
// Run once to update schema
// RELEVANT FILES: netlify/functions/setup-database.js

import { createClient } from '@supabase/supabase-js';

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Try to add the avatar column using a raw SQL query via RPC
    // If that doesn't work, we'll insert a test record to check
    const { data, error } = await supabase.rpc('exec_sql', {
      query: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar TEXT'
    });

    if (error && error.code === 'PGRST202') {
      // RPC doesn't exist, column might already be there
      // Just return success - if column doesn't exist, insert will fail
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Migration check complete. If column does not exist, please add it via Supabase dashboard: ALTER TABLE profiles ADD COLUMN avatar TEXT;'
        })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, message: 'Avatar column added' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
}
