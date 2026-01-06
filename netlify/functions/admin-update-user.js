// /netlify/functions/admin-update-user.js
// Update user email and/or admin status (admin only)
// Architecture: ARCHITECTURE-admin-user-management-001.md

import { createClient } from '@supabase/supabase-js';
import { verifyAdmin, unauthorizedResponse, isLastAdmin } from './lib/admin-auth.js';

const LOG_TAG = '[ADMIN-UPDATE-USER]';

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
    const { user_id, new_email, make_admin } = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!user_id) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'user_id is required' })
      };
    }

    // Get current user info
    const { data: { user: targetUser }, error: getUserError } = await supabase.auth.admin.getUserById(user_id);

    if (getUserError || !targetUser) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    const currentEmail = targetUser.email.toLowerCase();

    // Check if user is currently an admin
    const { data: currentAdminRecord } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', currentEmail)
      .single();

    const isCurrentlyAdmin = !!currentAdminRecord;

    // Prevent removing last admin
    if (isCurrentlyAdmin && make_admin === false) {
      const lastAdmin = await isLastAdmin(supabase, currentEmail);
      if (lastAdmin) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Cannot remove the last admin' })
        };
      }
    }

    // Update email if provided
    if (new_email && new_email.toLowerCase() !== currentEmail) {
      const normalizedNewEmail = new_email.toLowerCase().trim();

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedNewEmail)) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Invalid email format' })
        };
      }

      console.log(`${LOG_TAG} Updating email from ${currentEmail} to ${normalizedNewEmail}`);

      const { error: updateError } = await supabase.auth.admin.updateUserById(user_id, {
        email: normalizedNewEmail
      });

      if (updateError) {
        console.error(`${LOG_TAG} Error updating email:`, updateError);
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: updateError.message })
        };
      }

      // Update admin_users table if user was admin
      if (isCurrentlyAdmin) {
        await supabase
          .from('admin_users')
          .update({ email: normalizedNewEmail })
          .eq('email', currentEmail);
      }
    }

    // Update admin status if specified
    if (make_admin !== undefined && make_admin !== isCurrentlyAdmin) {
      const emailToUse = new_email ? new_email.toLowerCase().trim() : currentEmail;

      if (make_admin && !isCurrentlyAdmin) {
        // Promote to admin
        console.log(`${LOG_TAG} Promoting to admin:`, emailToUse);
        await supabase
          .from('admin_users')
          .insert({
            email: emailToUse,
            granted_by: authResult.user.email
          });
      } else if (!make_admin && isCurrentlyAdmin) {
        // Demote from admin (already checked for last admin above)
        console.log(`${LOG_TAG} Removing admin status:`, emailToUse);
        await supabase
          .from('admin_users')
          .delete()
          .eq('email', currentEmail);
      }
    }

    console.log(`${LOG_TAG} User updated successfully:`, user_id);

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
