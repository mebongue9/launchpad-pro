-- Etsy Empire Tables
-- Created: January 27, 2026
-- Purpose: Visual content factory for Etsy listing mockups and Pinterest pins
-- Source of Truth: LAUNCHPAD-PRO-VISION-v1_4-FINAL.md (Part 13)

-- ============================================
-- TABLE 1: ETSY_EMPIRE_PROJECTS
-- Main job tracker for visual generation projects
-- ============================================
CREATE TABLE IF NOT EXISTS etsy_empire_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Input Data
  pdf_url TEXT NOT NULL,
  product_title TEXT NOT NULL,
  tldr_text TEXT NOT NULL,
  secondary_benefits TEXT[] DEFAULT '{}',

  -- Linkage (optional audit trail)
  funnel_id UUID REFERENCES funnels(id) ON DELETE SET NULL,
  product_type TEXT CHECK (product_type IS NULL OR product_type IN ('lead_magnet', 'front_end', 'bump', 'upsell_1', 'upsell_2')),

  -- Configuration
  pinterest_enabled BOOLEAN DEFAULT TRUE,
  manifestable_ratio DECIMAL(3,2) DEFAULT 0.70 CHECK (manifestable_ratio >= 0.50 AND manifestable_ratio <= 0.90),

  -- Status Tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

  -- Progress Counters
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  failed_tasks INTEGER DEFAULT 0,

  -- Cost Tracking
  estimated_cost DECIMAL(10,4) DEFAULT 0,
  actual_cost DECIMAL(10,4) DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Error Logging
  last_error TEXT,
  error_count INTEGER DEFAULT 0
);

-- ============================================
-- TABLE 2: ETSY_EMPIRE_TASKS
-- Individual image generation tasks
-- ============================================
CREATE TABLE IF NOT EXISTS etsy_empire_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES etsy_empire_projects(id) ON DELETE CASCADE,

  -- Task Identification
  task_type TEXT NOT NULL CHECK (task_type IN ('etsy_slide', 'pinterest_pin')),
  slide_type TEXT NOT NULL,
  variation_number INTEGER DEFAULT 1,

  -- Generation Parameters
  prompt TEXT NOT NULL,

  -- Retry Logic
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 5,
  next_retry_at TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'permanent_failure')),

  -- Output
  output_url TEXT,
  output_metadata JSONB,

  -- Error Tracking
  last_error TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- ============================================
-- TABLE 3: ETSY_EMPIRE_ASSETS
-- Final output files (generated images)
-- ============================================
CREATE TABLE IF NOT EXISTS etsy_empire_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES etsy_empire_projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES etsy_empire_tasks(id) ON DELETE SET NULL,

  -- Asset Type
  asset_type TEXT NOT NULL CHECK (asset_type IN ('etsy_slide', 'pinterest_pin')),
  asset_category TEXT NOT NULL,

  -- Storage
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,

  -- Dimensions
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,

  -- Pinterest Metadata (NULL for Etsy slides)
  pin_description TEXT,
  pin_alt_text TEXT,
  pin_spintax TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE 4: ETSY_EMPIRE_SPINTAX
-- Automation payload for Pinterest scheduling
-- ============================================
CREATE TABLE IF NOT EXISTS etsy_empire_spintax (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES etsy_empire_projects(id) ON DELETE CASCADE,

  -- Master Spintax
  master_description TEXT NOT NULL,
  master_alt_text TEXT NOT NULL,

  -- JSON payload for automation
  full_payload JSONB NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_etsy_empire_projects_user_id ON etsy_empire_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_etsy_empire_projects_status ON etsy_empire_projects(status);
CREATE INDEX IF NOT EXISTS idx_etsy_empire_projects_funnel_id ON etsy_empire_projects(funnel_id);
CREATE INDEX IF NOT EXISTS idx_etsy_empire_projects_created_at ON etsy_empire_projects(created_at DESC);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_etsy_empire_tasks_project_id ON etsy_empire_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_etsy_empire_tasks_status ON etsy_empire_tasks(status);
CREATE INDEX IF NOT EXISTS idx_etsy_empire_tasks_next_retry ON etsy_empire_tasks(next_retry_at);
CREATE INDEX IF NOT EXISTS idx_etsy_empire_tasks_project_status ON etsy_empire_tasks(project_id, status);

-- Assets indexes
CREATE INDEX IF NOT EXISTS idx_etsy_empire_assets_project_id ON etsy_empire_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_etsy_empire_assets_asset_type ON etsy_empire_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_etsy_empire_assets_task_id ON etsy_empire_assets(task_id);

-- Spintax indexes
CREATE INDEX IF NOT EXISTS idx_etsy_empire_spintax_project_id ON etsy_empire_spintax(project_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE etsy_empire_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE etsy_empire_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE etsy_empire_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE etsy_empire_spintax ENABLE ROW LEVEL SECURITY;

-- Projects RLS: Standard user ownership pattern
CREATE POLICY "Users can view own projects"
  ON etsy_empire_projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON etsy_empire_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON etsy_empire_projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON etsy_empire_projects FOR DELETE
  USING (auth.uid() = user_id);

-- Tasks RLS: Users can only SELECT via project ownership
-- INSERT/UPDATE/DELETE handled by service_role (bypasses RLS)
CREATE POLICY "Users can view own tasks"
  ON etsy_empire_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM etsy_empire_projects
      WHERE etsy_empire_projects.id = etsy_empire_tasks.project_id
      AND etsy_empire_projects.user_id = auth.uid()
    )
  );

-- Assets RLS: Users can only SELECT via project ownership
-- INSERT/UPDATE/DELETE handled by service_role (bypasses RLS)
CREATE POLICY "Users can view own assets"
  ON etsy_empire_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM etsy_empire_projects
      WHERE etsy_empire_projects.id = etsy_empire_assets.project_id
      AND etsy_empire_projects.user_id = auth.uid()
    )
  );

-- Spintax RLS: Users can only SELECT via project ownership
-- INSERT/UPDATE/DELETE handled by service_role (bypasses RLS)
CREATE POLICY "Users can view own spintax"
  ON etsy_empire_spintax FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM etsy_empire_projects
      WHERE etsy_empire_projects.id = etsy_empire_spintax.project_id
      AND etsy_empire_projects.user_id = auth.uid()
    )
  );

-- ============================================
-- SERVICE ROLE GRANTS
-- ============================================
GRANT ALL ON etsy_empire_projects TO service_role;
GRANT ALL ON etsy_empire_tasks TO service_role;
GRANT ALL ON etsy_empire_assets TO service_role;
GRANT ALL ON etsy_empire_spintax TO service_role;

-- ============================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_etsy_empire_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER etsy_empire_projects_updated_at
  BEFORE UPDATE ON etsy_empire_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_etsy_empire_projects_updated_at();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE etsy_empire_projects IS 'Main job tracker for Etsy Empire visual generation. Each project generates 10 Etsy slides + 32 Pinterest pins (optional).';
COMMENT ON TABLE etsy_empire_tasks IS 'Individual image generation tasks. 10 etsy_slide tasks + 32 pinterest_pin tasks per project (if Pinterest enabled).';
COMMENT ON TABLE etsy_empire_assets IS 'Generated image files stored in Supabase Storage. Links to visual-designs bucket.';
COMMENT ON TABLE etsy_empire_spintax IS 'Spintax automation payload for Pinterest scheduling tools like n8n or Make.com.';

COMMENT ON COLUMN etsy_empire_projects.manifestable_ratio IS 'Prompt aesthetic ratio: 0.50-0.90. Higher = cleaner/minimalist, Lower = lifestyle/marketing style.';
COMMENT ON COLUMN etsy_empire_projects.pinterest_enabled IS 'If TRUE, generates 32 Pinterest pins in addition to 10 Etsy slides.';
COMMENT ON COLUMN etsy_empire_tasks.slide_type IS 'Etsy: hero/detail/feature/cascading/book/index/cover_options/features_layout/floating/library. Pinterest: quote/lifestyle/desk/mood/planner_hands/flatlay.';
COMMENT ON COLUMN etsy_empire_tasks.status IS 'queued → processing → completed/failed/permanent_failure. permanent_failure after 5 retries.';
