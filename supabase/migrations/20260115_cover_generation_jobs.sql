-- Migration: Create cover_generation_jobs table for background task processing
-- Date: 2026-01-15
-- Purpose: Store job state for async cover variation generation

-- Create the table
CREATE TABLE IF NOT EXISTS cover_generation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Job tracking
  status TEXT NOT NULL DEFAULT 'pending',
  -- Status values: 'pending', 'processing', 'completed', 'failed'

  -- Input (what the user submitted)
  analysis_result JSONB NOT NULL,
  -- Contains: colors, fonts, layout_description, verdict, etc.

  -- Output (what Claude generated)
  variations JSONB,
  -- Contains: array of 4 variation objects with html_template, css_styles, etc.

  -- Error handling
  error_message TEXT,
  attempt_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Cleanup
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Index for polling queries
CREATE INDEX IF NOT EXISTS idx_cover_jobs_status ON cover_generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_cover_jobs_expires ON cover_generation_jobs(expires_at);

-- RLS Policy
ALTER TABLE cover_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Anyone can create jobs" ON cover_generation_jobs;
DROP POLICY IF EXISTS "Anyone can read jobs" ON cover_generation_jobs;
DROP POLICY IF EXISTS "System can update jobs" ON cover_generation_jobs;

-- Create policies
CREATE POLICY "Anyone can create jobs" ON cover_generation_jobs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read jobs" ON cover_generation_jobs
  FOR SELECT USING (true);

CREATE POLICY "System can update jobs" ON cover_generation_jobs
  FOR UPDATE USING (true);

-- Grant access to service role for background function updates
GRANT ALL ON cover_generation_jobs TO service_role;
