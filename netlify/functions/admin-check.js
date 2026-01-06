// /netlify/functions/admin-check.js
// Check if current user is an admin
// Architecture: ARCHITECTURE-admin-user-management-001.md

import { createClient } from '@supabase/supabase-js';
import { verifyAdmin, unauthorizedResponse } from './lib/admin-auth.js';

const LOG_TAG = '[ADMIN-CHECK]';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function handler(event) {
  console.log(`${LOG_TAG} Function invoked`);

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Verify the user's JWT and check admin status
    const authResult = await verifyAdmin(event, supabase);

    // Return admin status (don't expose error details for security)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        is_admin: authResult.authorized,
        email: authResult.authorized ? authResult.user.email : undefined
      })
    };
  } catch (error) {
    console.error(`${LOG_TAG} Error:`, error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}
