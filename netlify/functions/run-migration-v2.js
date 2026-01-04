// /netlify/functions/run-migration-v2.js
// Alternative migration using Supabase REST API
// Uses service role key instead of direct postgres connection
// RELEVANT FILES: supabase/migrations/add-update-features.sql

import { createClient } from '@supabase/supabase-js';

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing Supabase credentials' })
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Run migrations using Supabase's rpc function or direct SQL
    // Note: For ALTER TABLE operations, we need to use the SQL editor in Supabase dashboard
    // or a direct postgres connection. The REST API doesn't support DDL.

    // Let's at least verify connection works
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message, hint: 'Connection test failed' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Supabase connection verified. For schema changes, please run the SQL in Supabase Dashboard.',
        sql_location: 'supabase/migrations/add-update-features.sql',
        instructions: [
          '1. Go to Supabase Dashboard: https://supabase.com/dashboard',
          '2. Open your project',
          '3. Go to SQL Editor',
          '4. Paste the contents of add-update-features.sql',
          '5. Run the SQL'
        ]
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
}
