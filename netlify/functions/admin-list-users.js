// /netlify/functions/admin-list-users.js
// List all users in the system (admin only)
// Architecture: ARCHITECTURE-admin-user-management-001.md

import { createClient } from '@supabase/supabase-js';
import { verifyAdmin, unauthorizedResponse } from './lib/admin-auth.js';

const LOG_TAG = '[ADMIN-LIST-USERS]';

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

    // Get all users from Supabase Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error(`${LOG_TAG} Error listing users:`, listError);
      throw listError;
    }

    // Get all admin emails for marking admin status
    const { data: adminUsers } = await supabase
      .from('admin_users')
      .select('email');

    const adminEmails = new Set(
      (adminUsers || []).map(a => a.email.toLowerCase())
    );

    // Format user data for response
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      is_admin: adminEmails.has(user.email?.toLowerCase()),
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      email_confirmed_at: user.email_confirmed_at
    }));

    // Sort by created_at descending (newest first)
    formattedUsers.sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
    );

    console.log(`${LOG_TAG} Found ${formattedUsers.length} users`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users: formattedUsers })
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
