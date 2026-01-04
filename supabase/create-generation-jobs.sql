-- /supabase/create-generation-jobs.sql
-- Creates the generation_jobs table for background AI content generation
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/psfgnelrxzdckucvytzj/sql

-- ============================================
-- 1. CREATE GENERATION_JOBS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL, -- 'lead_magnet_content', 'funnel_product', 'funnel', 'lead_magnet_ideas'
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'complete', 'failed')),

  -- Chunked generation tracking
  total_chunks INTEGER,
  completed_chunks INTEGER DEFAULT 0,
  current_chunk_name TEXT, -- e.g., "Generating Chapter 3: The Framework"
  chunks_data JSONB DEFAULT '[]'::jsonb, -- Array of completed chunks

  -- Input and output
  input_data JSONB NOT NULL, -- All input needed for generation
  result JSONB, -- Final assembled result when complete

  -- Error handling and retry
  error_message TEXT,
  failed_at_chunk INTEGER, -- Which chunk failed (for resume)
  retry_count INTEGER DEFAULT 0,
  last_error_code INTEGER, -- HTTP error code from Claude API

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- 2. CREATE INDEX FOR FASTER QUERIES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_generation_jobs_user_id ON generation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_created_at ON generation_jobs(created_at DESC);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES
-- ============================================

-- Users can view their own jobs
CREATE POLICY "Users can view own generation jobs"
  ON generation_jobs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create jobs for themselves
CREATE POLICY "Users can create own generation jobs"
  ON generation_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own jobs
CREATE POLICY "Users can update own generation jobs"
  ON generation_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own jobs
CREATE POLICY "Users can delete own generation jobs"
  ON generation_jobs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 5. CREATE TRIGGER FOR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_generation_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_generation_jobs_updated_at ON generation_jobs;
CREATE TRIGGER trigger_update_generation_jobs_updated_at
  BEFORE UPDATE ON generation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_generation_jobs_updated_at();

-- ============================================
-- VERIFICATION
-- ============================================

-- Check that table was created
SELECT 'generation_jobs table created successfully!' as status;
