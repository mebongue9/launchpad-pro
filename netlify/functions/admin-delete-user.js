// /netlify/functions/admin-delete-user.js
// Delete a user from the system (admin only)
// Architecture: ARCHITECTURE-admin-user-management-001.md

import { createClient } from '@supabase/supabase-js';
import { verifyAdmin, unauthorizedResponse, isLastAdmin } from './lib/admin-auth.js';

const LOG_TAG = '[ADMIN-DELETE-USER]';

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
    const { user_id } = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!user_id) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'user_id is required' })
      };
    }

    // Get user info to check if they're an admin
    const { data: { user: targetUser }, error: getUserError } = await supabase.auth.admin.getUserById(user_id);

    if (getUserError || !targetUser) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    const targetEmail = targetUser.email.toLowerCase();

    // Prevent self-deletion
    if (targetEmail === authResult.user.email.toLowerCase()) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Cannot delete yourself' })
      };
    }

    // Check if target is an admin
    const { data: adminRecord } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', targetEmail)
      .single();

    // Prevent deleting the last admin
    if (adminRecord) {
      const lastAdmin = await isLastAdmin(supabase, targetEmail);
      if (lastAdmin) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Cannot delete the last admin' })
        };
      }

      // Remove from admin_users table first
      await supabase
        .from('admin_users')
        .delete()
        .eq('email', targetEmail);

      console.log(`${LOG_TAG} Removed admin status for:`, targetEmail);
    }

    // Delete the user from Supabase Auth
    // Note: This will cascade delete their data if foreign keys are set up that way
    console.log(`${LOG_TAG} Deleting user:`, user_id, targetEmail);

    const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id);

    if (deleteError) {
      console.error(`${LOG_TAG} Error deleting user:`, deleteError);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: deleteError.message })
      };
    }

    console.log(`${LOG_TAG} User deleted successfully:`, user_id);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true })
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
