-- Admin Users Table
-- Tracks which users have admin privileges
-- Created: 2026-01-06
-- Architecture: ARCHITECTURE-admin-user-management-001.md

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  granted_by TEXT,  -- Email of admin who added them (or 'system' for initial)
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (service role key bypasses this for admin operations)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- NO select/insert/update/delete policies for regular users
-- Only service role key can access this table

-- Index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Seed initial admin
-- IMPORTANT: Replace this email with your actual admin email in Supabase
INSERT INTO admin_users (email, granted_by)
VALUES ('REPLACE_WITH_YOUR_EMAIL@example.com', 'system')
ON CONFLICT (email) DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE admin_users IS 'Tracks users with admin privileges. Only accessible via service role key.';
