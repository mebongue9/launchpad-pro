// /netlify/functions/lib/admin-auth.js
// Shared middleware for admin JWT verification
// All admin endpoints must use this to verify the requester is an admin
// Architecture: ARCHITECTURE-admin-user-management-001.md

import { createClient } from '@supabase/supabase-js';

const LOG_TAG = '[ADMIN-AUTH]';

/**
 * Verify that the request is from an authenticated admin user
 * @param {Object} event - Netlify function event
 * @param {Object} supabase - Supabase client with service role key
 * @returns {Object} { authorized: boolean, user?: Object, error?: string, status?: number }
 */
export async function verifyAdmin(event, supabase) {
  // 1. Extract JWT from Authorization header
  const authHeader = event.headers.authorization || event.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log(`${LOG_TAG} Missing or invalid Authorization header`);
    return {
      authorized: false,
      status: 401,
      error: 'Authorization header required'
    };
  }

  const token = authHeader.replace('Bearer ', '');

  // 2. Verify JWT and get user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    console.log(`${LOG_TAG} Invalid token:`, authError?.message);
    return {
      authorized: false,
      status: 401,
      error: 'Invalid or expired token'
    };
  }

  console.log(`${LOG_TAG} Token verified for user:`, user.email);

  // 3. Check if user is in admin_users table
  const normalizedEmail = user.email.toLowerCase().trim();

  const { data: adminRecord, error: adminError } = await supabase
    .from('admin_users')
    .select('id, email, granted_at')
    .eq('email', normalizedEmail)
    .single();

  if (adminError || !adminRecord) {
    console.log(`${LOG_TAG} User is not an admin:`, user.email);
    return {
      authorized: false,
      status: 403,
      error: 'Admin access required'
    };
  }

  console.log(`${LOG_TAG} Admin verified:`, user.email);

  return {
    authorized: true,
    user: {
      ...user,
      email: normalizedEmail,
      adminRecord
    }
  };
}

/**
 * Create error response for unauthorized requests
 * @param {number} status - HTTP status code
 * @param {string} error - Error message
 * @returns {Object} Netlify function response
 */
export function unauthorizedResponse(status, error) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error })
  };
}

/**
 * Check if user is the last admin (prevent self-demotion)
 * @param {Object} supabase - Supabase client with service role key
 * @param {string} email - Email to check
 * @returns {boolean} True if this is the last admin
 */
export async function isLastAdmin(supabase, email) {
  const normalizedEmail = email.toLowerCase().trim();

  const { count } = await supabase
    .from('admin_users')
    .select('*', { count: 'exact', head: true });

  if (count <= 1) {
    // Check if the email being removed/demoted is in admin_users
    const { data } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    return !!data; // True if this is the last admin
  }

  return false;
}
