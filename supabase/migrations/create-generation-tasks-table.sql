-- supabase/migrations/create-generation-tasks-table.sql
-- Creates generation_tasks table to track progress of 14 batched generation tasks
-- Enables resume capability and retry tracking for funnel generation
-- RELEVANT FILES: netlify/functions/lib/task-orchestrator.js, netlify/functions/lib/retry-engine.js

-- Create generation_tasks table
CREATE TABLE IF NOT EXISTS generation_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  funnel_id UUID NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,              -- '1' through '14'
  task_name TEXT NOT NULL,            -- 'lead_magnet_part_1', 'all_tldrs', etc.
  status TEXT DEFAULT 'pending',      -- 'pending' | 'in_progress' | 'completed' | 'failed'
  attempt_count INTEGER DEFAULT 0,    -- How many times we've tried this task
  last_attempt_at TIMESTAMPTZ,        -- When last attempt happened
  completed_at TIMESTAMPTZ,           -- When successfully completed
  error_message TEXT,                 -- Error if failed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_funnel_task UNIQUE(funnel_id, task_id),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  CONSTRAINT valid_task_id CHECK (task_id IN ('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_generation_tasks_funnel_id ON generation_tasks(funnel_id);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_status ON generation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_funnel_status ON generation_tasks(funnel_id, status);

-- Enable Row Level Security
ALTER TABLE generation_tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own funnel's tasks
CREATE POLICY "Users can view their own generation tasks"
  ON generation_tasks
  FOR SELECT
  USING (
    funnel_id IN (
      SELECT id FROM funnels WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert tasks for their own funnels
CREATE POLICY "Users can insert their own generation tasks"
  ON generation_tasks
  FOR INSERT
  WITH CHECK (
    funnel_id IN (
      SELECT id FROM funnels WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update their own funnel's tasks
CREATE POLICY "Users can update their own generation tasks"
  ON generation_tasks
  FOR UPDATE
  USING (
    funnel_id IN (
      SELECT id FROM funnels WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete their own funnel's tasks (cascade handles this mostly)
CREATE POLICY "Users can delete their own generation tasks"
  ON generation_tasks
  FOR DELETE
  USING (
    funnel_id IN (
      SELECT id FROM funnels WHERE user_id = auth.uid()
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_generation_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the update function
CREATE TRIGGER generation_tasks_updated_at
  BEFORE UPDATE ON generation_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_generation_tasks_updated_at();

-- Add helpful comment
COMMENT ON TABLE generation_tasks IS 'Tracks progress of 14 batched generation tasks per funnel. Enables resume capability and automatic retry.';
