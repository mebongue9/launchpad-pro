-- Migration: Create funnel_idea_tasks table for background task processing
-- Date: 2026-01-26
-- Purpose: Store job state for async funnel idea generation
-- Spec: /Users/martinebongue/Downloads/BACKGROUND-TASK-SPEC.md

-- Create the table
CREATE TABLE IF NOT EXISTS funnel_idea_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Task identification
  task_type TEXT NOT NULL DEFAULT 'funnel_idea',
  status TEXT NOT NULL DEFAULT 'pending',
  -- Status values: 'pending', 'processing', 'completed', 'failed'

  -- Input data (what the user submitted)
  input_data JSONB NOT NULL,
  -- Contains: profile, audience, existing_product, user_id

  -- Output data (the generated funnel idea)
  output_data JSONB,
  -- Contains: funnel_name, front_end, bump, upsell_1, upsell_2, upsell_3

  -- Progress tracking
  attempt_count INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Error handling
  error_message TEXT,

  -- Validation results (for title validation)
  validation_results JSONB,
  -- Contains: results from validateGeneratedTitles()

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for polling queries
CREATE INDEX IF NOT EXISTS idx_funnel_idea_tasks_status ON funnel_idea_tasks(status);
CREATE INDEX IF NOT EXISTS idx_funnel_idea_tasks_created ON funnel_idea_tasks(created_at);

-- Enable Row Level Security
ALTER TABLE funnel_idea_tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Anyone can create funnel idea tasks" ON funnel_idea_tasks;
DROP POLICY IF EXISTS "Anyone can read funnel idea tasks" ON funnel_idea_tasks;
DROP POLICY IF EXISTS "System can update funnel idea tasks" ON funnel_idea_tasks;

-- Create policies (permissive for now, can tighten later with user_id)
CREATE POLICY "Anyone can create funnel idea tasks" ON funnel_idea_tasks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read funnel idea tasks" ON funnel_idea_tasks
  FOR SELECT USING (true);

CREATE POLICY "System can update funnel idea tasks" ON funnel_idea_tasks
  FOR UPDATE USING (true);

-- Grant access to service role for background function updates
GRANT ALL ON funnel_idea_tasks TO service_role;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_funnel_idea_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the update function
DROP TRIGGER IF EXISTS funnel_idea_tasks_updated_at ON funnel_idea_tasks;
CREATE TRIGGER funnel_idea_tasks_updated_at
  BEFORE UPDATE ON funnel_idea_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_funnel_idea_tasks_updated_at();

-- Add helpful comment
COMMENT ON TABLE funnel_idea_tasks IS 'Tracks background funnel idea generation tasks. Enables async processing with 10+ minute timeout.';
