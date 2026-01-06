// /netlify/functions/admin-create-user.js
// Create a new user (admin only)
// Architecture: ARCHITECTURE-admin-user-management-001.md

import { createClient } from '@supabase/supabase-js';
import { verifyAdmin, unauthorizedResponse } from './lib/admin-auth.js';

const LOG_TAG = '[ADMIN-CREATE-USER]';

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
    const { email, password, make_admin } = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!email || !password) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Email and password are required' })
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid email format' })
      };
    }

    // Validate password length
    if (password.length < 6) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Password must be at least 6 characters' })
      };
    }

    const normalizedEmail = email.toLowerCase().trim();

    console.log(`${LOG_TAG} Creating user:`, normalizedEmail, 'make_admin:', !!make_admin);

    // Create user in Supabase Auth
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: password,
      email_confirm: true // Auto-confirm email for internal users
    });

    if (createError) {
      console.error(`${LOG_TAG} Error creating user:`, createError);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: createError.message })
      };
    }

    console.log(`${LOG_TAG} User created:`, newUser.user.id);

    // If make_admin is true, add to admin_users table
    let adminGranted = false;
    if (make_admin) {
      const { error: adminError } = await supabase
        .from('admin_users')
        .insert({
          email: normalizedEmail,
          granted_by: authResult.user.email
        });

      if (adminError) {
        console.error(`${LOG_TAG} Error adding admin status:`, adminError);
        // User was created but admin status failed - report actual status
      } else {
        console.log(`${LOG_TAG} Admin status granted to:`, normalizedEmail);
        adminGranted = true;
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        user: {
          id: newUser.user.id,
          email: normalizedEmail,
          is_admin: adminGranted
        },
        warning: make_admin && !adminGranted ? 'User created but admin status could not be granted' : undefined
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
