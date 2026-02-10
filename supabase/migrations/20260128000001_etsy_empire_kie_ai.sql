-- Migration: Etsy Empire kie.ai Integration
-- Date: January 28, 2026
-- Purpose: Add video support and update task types for kie.ai migration
--
-- Changes:
-- 1. Add video_enabled column to etsy_empire_projects
-- 2. Capture pinterest_pin_count column (may already exist in live DB)
-- 3. Update task_type CHECK constraint to include 'etsy_video'

-- ============================================
-- STEP 1: Add video_enabled column
-- When TRUE, slide 2 becomes a 6-second video using slide 1 as source
-- ============================================
ALTER TABLE etsy_empire_projects
ADD COLUMN IF NOT EXISTS video_enabled BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN etsy_empire_projects.video_enabled IS
'When TRUE, slide 2 becomes a 6-second video using slide 1 as source image. Cost: $0.10 per video.';

-- ============================================
-- STEP 2: Capture pinterest_pin_count column
-- This column may already exist in live DB (added via console)
-- Using IF NOT EXISTS makes this migration idempotent
-- ============================================
ALTER TABLE etsy_empire_projects
ADD COLUMN IF NOT EXISTS pinterest_pin_count INTEGER DEFAULT 32;

COMMENT ON COLUMN etsy_empire_projects.pinterest_pin_count IS
'Number of Pinterest pins to generate. Valid values: 8, 16, or 32. Default: 32.';

-- ============================================
-- STEP 3: Update task_type CHECK constraint
-- Add 'etsy_video' as valid task type for video generation
-- ============================================

-- Remove old constraint if exists (idempotent)
ALTER TABLE etsy_empire_tasks
DROP CONSTRAINT IF EXISTS etsy_empire_tasks_task_type_check;

-- Add updated constraint with explicit name
ALTER TABLE etsy_empire_tasks
ADD CONSTRAINT etsy_empire_tasks_task_type_check
CHECK (task_type IN ('etsy_slide', 'etsy_video', 'pinterest_pin'));

-- ============================================
-- DOCUMENTATION
-- ============================================
COMMENT ON CONSTRAINT etsy_empire_tasks_task_type_check ON etsy_empire_tasks IS
'Valid task types: etsy_slide (AI image), etsy_video (Grok video from slide 1), pinterest_pin (Pinterest image)';
