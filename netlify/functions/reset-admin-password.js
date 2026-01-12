// /netlify/functions/reset-admin-password.js
// ONE-TIME USE: Reset admin password when locked out
// DELETE THIS FILE AFTER USE for security

import { createClient } from '@supabase/supabase-js';

const LOG_TAG = '[RESET-ADMIN-PASSWORD]';

export async function handler(event) {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { secret_key, new_password } = JSON.parse(event.body || '{}');

    // Simple protection - requires a secret key
    if (secret_key !== 'reset-launchpad-2026') {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid secret key' })
      };
    }

    if (!new_password || new_password.length < 8) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Password must be at least 8 characters' })
      };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Find the admin user
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error(`${LOG_TAG} Error listing users:`, listError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to list users' })
      };
    }

    // Find user by email
    const adminUser = users.find(u => u.email === 'mebongue@hotmail.com');

    if (!adminUser) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Admin user not found' })
      };
    }

    console.log(`${LOG_TAG} Found admin user:`, adminUser.id);

    // Reset the password
    const { error: updateError } = await supabase.auth.admin.updateUserById(adminUser.id, {
      password: new_password
    });

    if (updateError) {
      console.error(`${LOG_TAG} Error updating password:`, updateError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: updateError.message })
      };
    }

    console.log(`${LOG_TAG} Password reset successfully for:`, adminUser.email);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: `Password reset for ${adminUser.email}. DELETE THIS FUNCTION NOW!`
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
