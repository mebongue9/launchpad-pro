-- supabase/migrations/create-app-settings-table.sql
-- Creates app_settings table for admin-configurable retry delays and system settings
-- Allows Settings UI to control retry behavior without code changes
-- RELEVANT FILES: src/pages/Settings.jsx, netlify/functions/lib/retry-engine.js

-- Create app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  setting_type TEXT DEFAULT 'string',  -- 'string' | 'number' | 'boolean' | 'json'
  category TEXT DEFAULT 'general',      -- 'general' | 'generation' | 'retry' | 'ui'
  is_admin_only BOOLEAN DEFAULT false,  -- Only admins can modify
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_setting_type CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
  CONSTRAINT valid_category CHECK (category IN ('general', 'generation', 'retry', 'ui'))
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);
CREATE INDEX IF NOT EXISTS idx_app_settings_category ON app_settings(category);

-- Enable Row Level Security
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read settings (needed for retry logic)
CREATE POLICY "Anyone can read app settings"
  ON app_settings
  FOR SELECT
  USING (true);

-- Policy: Only authenticated users can view all settings
-- (Service role key will bypass RLS for admin operations)
CREATE POLICY "Authenticated users can view settings"
  ON app_settings
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Insert default retry settings
INSERT INTO app_settings (key, value, description, setting_type, category, is_admin_only) VALUES
  ('retry_attempt_2_delay', '5', 'Seconds to wait before retry attempt 2', 'number', 'retry', true),
  ('retry_attempt_3_delay', '30', 'Seconds to wait before retry attempt 3', 'number', 'retry', true),
  ('retry_attempt_4_delay', '120', 'Seconds to wait before retry attempt 4 (2 minutes)', 'number', 'retry', true),
  ('retry_attempt_5_delay', '300', 'Seconds to wait before retry attempt 5 (5 minutes)', 'number', 'retry', true),
  ('retry_attempt_6_delay', '300', 'Seconds to wait before retry attempt 6 (5 minutes)', 'number', 'retry', true),
  ('retry_attempt_7_delay', '300', 'Seconds to wait before retry attempt 7 (5 minutes)', 'number', 'retry', true),
  ('max_retry_attempts', '7', 'Maximum retry attempts before failing a task', 'number', 'retry', true),
  ('enable_batched_generation', 'true', 'Use new batched generation system (14 tasks instead of 51+)', 'boolean', 'generation', true),
  ('generation_timeout_seconds', '900', 'Timeout for each generation task (15 minutes)', 'number', 'generation', true)
ON CONFLICT (key) DO NOTHING;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the update function
CREATE TRIGGER app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_app_settings_updated_at();

-- Helper function to get a setting value by key
CREATE OR REPLACE FUNCTION get_app_setting(setting_key TEXT)
RETURNS TEXT AS $$
  SELECT value FROM app_settings WHERE key = setting_key LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Helper function to get a setting as integer
CREATE OR REPLACE FUNCTION get_app_setting_int(setting_key TEXT, default_value INTEGER DEFAULT 0)
RETURNS INTEGER AS $$
  SELECT COALESCE(
    (SELECT value::INTEGER FROM app_settings WHERE key = setting_key LIMIT 1),
    default_value
  );
$$ LANGUAGE sql STABLE;

-- Helper function to get a setting as boolean
CREATE OR REPLACE FUNCTION get_app_setting_bool(setting_key TEXT, default_value BOOLEAN DEFAULT false)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT value::BOOLEAN FROM app_settings WHERE key = setting_key LIMIT 1),
    default_value
  );
$$ LANGUAGE sql STABLE;

-- Add helpful comment
COMMENT ON TABLE app_settings IS 'System-wide settings configurable by admins. Includes retry delays, generation timeouts, and feature flags.';
