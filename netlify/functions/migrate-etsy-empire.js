// /netlify/functions/migrate-etsy-empire.js
// One-time migration for Etsy Empire tables
// Creates 4 tables: projects, tasks, assets, spintax
// Run via POST request after deployment

import pg from 'pg';
const { Client } = pg;

const sql = `
-- Etsy Empire Tables Migration
-- Created: January 27, 2026

-- ============================================
-- TABLE 1: ETSY_EMPIRE_PROJECTS
-- ============================================
CREATE TABLE IF NOT EXISTS etsy_empire_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pdf_url TEXT NOT NULL,
  product_title TEXT NOT NULL,
  tldr_text TEXT NOT NULL,
  secondary_benefits TEXT[] DEFAULT '{}',
  funnel_id UUID REFERENCES funnels(id) ON DELETE SET NULL,
  product_type TEXT CHECK (product_type IS NULL OR product_type IN ('lead_magnet', 'front_end', 'bump', 'upsell_1', 'upsell_2')),
  product_format TEXT DEFAULT 'digital product',
  pinterest_enabled BOOLEAN DEFAULT TRUE,
  manifestable_ratio DECIMAL(3,2) DEFAULT 0.70 CHECK (manifestable_ratio >= 0.50 AND manifestable_ratio <= 0.90),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  failed_tasks INTEGER DEFAULT 0,
  estimated_cost DECIMAL(10,4) DEFAULT 0,
  actual_cost DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_error TEXT,
  error_count INTEGER DEFAULT 0
);

-- ============================================
-- TABLE 2: ETSY_EMPIRE_TASKS
-- ============================================
CREATE TABLE IF NOT EXISTS etsy_empire_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES etsy_empire_projects(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL CHECK (task_type IN ('etsy_slide', 'pinterest_pin')),
  slide_type TEXT NOT NULL,
  variation_number INTEGER DEFAULT 1,
  prompt TEXT NOT NULL,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 5,
  next_retry_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'permanent_failure')),
  output_url TEXT,
  output_metadata JSONB,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- ============================================
-- TABLE 3: ETSY_EMPIRE_ASSETS
-- ============================================
CREATE TABLE IF NOT EXISTS etsy_empire_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES etsy_empire_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES etsy_empire_tasks(id) ON DELETE SET NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('etsy_slide', 'pinterest_pin')),
  asset_category TEXT NOT NULL,
  variation_number INTEGER DEFAULT 1,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  pin_description TEXT,
  pin_alt_text TEXT,
  pin_spintax TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE 4: ETSY_EMPIRE_SPINTAX
-- ============================================
CREATE TABLE IF NOT EXISTS etsy_empire_spintax (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES etsy_empire_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  master_description TEXT NOT NULL,
  master_alt_text TEXT NOT NULL,
  full_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_etsy_empire_projects_user_id ON etsy_empire_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_etsy_empire_projects_status ON etsy_empire_projects(status);
CREATE INDEX IF NOT EXISTS idx_etsy_empire_projects_funnel_id ON etsy_empire_projects(funnel_id);
CREATE INDEX IF NOT EXISTS idx_etsy_empire_projects_created_at ON etsy_empire_projects(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_etsy_empire_tasks_project_id ON etsy_empire_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_etsy_empire_tasks_status ON etsy_empire_tasks(status);
CREATE INDEX IF NOT EXISTS idx_etsy_empire_tasks_next_retry ON etsy_empire_tasks(next_retry_at);
CREATE INDEX IF NOT EXISTS idx_etsy_empire_tasks_project_status ON etsy_empire_tasks(project_id, status);

CREATE INDEX IF NOT EXISTS idx_etsy_empire_assets_project_id ON etsy_empire_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_etsy_empire_assets_asset_type ON etsy_empire_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_etsy_empire_assets_task_id ON etsy_empire_assets(task_id);

CREATE INDEX IF NOT EXISTS idx_etsy_empire_spintax_project_id ON etsy_empire_spintax(project_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE etsy_empire_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE etsy_empire_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE etsy_empire_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE etsy_empire_spintax ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Users can view own projects" ON etsy_empire_projects;
DROP POLICY IF EXISTS "Users can create own projects" ON etsy_empire_projects;
DROP POLICY IF EXISTS "Users can update own projects" ON etsy_empire_projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON etsy_empire_projects;
DROP POLICY IF EXISTS "Users can view own tasks" ON etsy_empire_tasks;
DROP POLICY IF EXISTS "Users can view own assets" ON etsy_empire_assets;
DROP POLICY IF EXISTS "Users can view own spintax" ON etsy_empire_spintax;

-- Projects RLS
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

-- Tasks RLS (SELECT only, service_role handles INSERT/UPDATE/DELETE)
CREATE POLICY "Users can view own tasks"
  ON etsy_empire_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM etsy_empire_projects
      WHERE etsy_empire_projects.id = etsy_empire_tasks.project_id
      AND etsy_empire_projects.user_id = auth.uid()
    )
  );

-- Assets RLS (SELECT only)
CREATE POLICY "Users can view own assets"
  ON etsy_empire_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM etsy_empire_projects
      WHERE etsy_empire_projects.id = etsy_empire_assets.project_id
      AND etsy_empire_projects.user_id = auth.uid()
    )
  );

-- Spintax RLS (SELECT only)
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

DROP TRIGGER IF EXISTS etsy_empire_projects_updated_at ON etsy_empire_projects;
CREATE TRIGGER etsy_empire_projects_updated_at
  BEFORE UPDATE ON etsy_empire_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_etsy_empire_projects_updated_at();

SELECT 'Etsy Empire migration complete!' as status;
`;

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Extract project ref from SUPABASE_URL
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase/)?.[1];

  if (!projectRef) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Could not extract project ref from SUPABASE_URL' })
    };
  }

  // Use session mode pooler (port 5432) with correct username format
  const connectionString = `postgresql://postgres.${projectRef}:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@aws-0-us-west-1.pooler.supabase.com:5432/postgres`;
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('[MIGRATE-ETSY-EMPIRE] Connecting to database...');
    await client.connect();

    console.log('[MIGRATE-ETSY-EMPIRE] Running migration...');
    const result = await client.query(sql);

    await client.end();
    console.log('[MIGRATE-ETSY-EMPIRE] Migration complete!');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Etsy Empire tables created successfully',
        tables: ['etsy_empire_projects', 'etsy_empire_tasks', 'etsy_empire_assets', 'etsy_empire_spintax']
      })
    };
  } catch (error) {
    console.error('[MIGRATE-ETSY-EMPIRE] Error:', error.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
}
