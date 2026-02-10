-- Migration: Slide 10 Template System
-- Date: January 28, 2026
-- Purpose: Add template support for Slide 10 branding overlays
--
-- MANUAL STEP REQUIRED:
-- Create storage bucket 'etsy-empire-templates' in Supabase Dashboard
-- Settings: Public bucket (required for kie.ai Edit API to access images)

-- ============================================
-- TABLE: ETSY_EMPIRE_TEMPLATES
-- User-uploaded branding templates for Slide 10
-- ============================================
CREATE TABLE IF NOT EXISTS etsy_empire_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Template Info
  name TEXT NOT NULL,

  -- Storage
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,

  -- Dimensions (captured on upload)
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_etsy_templates_user ON etsy_empire_templates(user_id);

-- Enable Row Level Security
ALTER TABLE etsy_empire_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own templates
CREATE POLICY "Users can manage their own templates"
ON etsy_empire_templates
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Grant service role access
GRANT ALL ON etsy_empire_templates TO service_role;

-- ============================================
-- ALTER: ETSY_EMPIRE_PROJECTS
-- Add Slide 10 template configuration columns
-- ============================================
ALTER TABLE etsy_empire_projects
ADD COLUMN IF NOT EXISTS slide10_template_id UUID REFERENCES etsy_empire_templates(id),
ADD COLUMN IF NOT EXISTS overlay_count INTEGER DEFAULT 4 CHECK (overlay_count >= 2 AND overlay_count <= 6);

-- Documentation
COMMENT ON TABLE etsy_empire_templates IS 'User-uploaded branding templates for Slide 10. Template image is used as base for Edit API overlay.';
COMMENT ON COLUMN etsy_empire_templates.storage_path IS 'Path in etsy-empire-templates storage bucket';
COMMENT ON COLUMN etsy_empire_templates.public_url IS 'Public URL for kie.ai Edit API access';
COMMENT ON COLUMN etsy_empire_projects.slide10_template_id IS 'Optional template for Slide 10. NULL = use standard AI generation.';
COMMENT ON COLUMN etsy_empire_projects.overlay_count IS 'Number of product mockups to overlay on template (2-6). Only applies when template selected.';
