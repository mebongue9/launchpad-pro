// /netlify/functions/admin-reset-password.js
// Reset a user's password (admin only)

import { createClient } from '@supabase/supabase-js';
import { verifyAdmin, unauthorizedResponse } from './lib/admin-auth.js';

const LOG_TAG = '[ADMIN-RESET-PASSWORD]';

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
    // Verify admin access
    const authResult = await verifyAdmin(event, supabase);
    if (!authResult.authorized) {
      return unauthorizedResponse(authResult.status, authResult.error);
    }

    console.log(`${LOG_TAG} Admin verified:`, authResult.user.email);

    // Parse request body
    const { user_id, new_password } = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!user_id) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'user_id is required' })
      };
    }

    if (!new_password || new_password.length < 8) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Password must be at least 8 characters' })
      };
    }

    // Get current user info to verify they exist
    const { data: { user: targetUser }, error: getUserError } = await supabase.auth.admin.getUserById(user_id);

    if (getUserError || !targetUser) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    console.log(`${LOG_TAG} Resetting password for:`, targetUser.email);

    // Update the password
    const { error: updateError } = await supabase.auth.admin.updateUserById(user_id, {
      password: new_password
    });

    if (updateError) {
      console.error(`${LOG_TAG} Error updating password:`, updateError);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: updateError.message })
      };
    }

    console.log(`${LOG_TAG} Password reset successfully for user:`, user_id);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: `Password reset for ${targetUser.email}`
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
