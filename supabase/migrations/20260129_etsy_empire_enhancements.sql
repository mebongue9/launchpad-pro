-- Etsy Empire Enhancements Migration
-- Date: 2026-01-29
-- Purpose: Add columns for pin text, test mode, cost tracking

-- FIX 2: Add pin_text column for product-specific Pinterest text
ALTER TABLE etsy_empire_tasks
ADD COLUMN IF NOT EXISTS pin_text TEXT;

-- FIX 3: Add test_mode column for cheap testing
ALTER TABLE etsy_empire_projects
ADD COLUMN IF NOT EXISTS test_mode BOOLEAN DEFAULT FALSE;

-- FIX 4: Add cost column for per-task cost tracking
ALTER TABLE etsy_empire_tasks
ADD COLUMN IF NOT EXISTS cost DECIMAL(10,4) DEFAULT 0.02;

-- FIX 4: Create cost summary function
CREATE OR REPLACE FUNCTION get_etsy_empire_costs(p_user_id UUID)
RETURNS TABLE (
  today DECIMAL,
  this_week DECIMAL,
  this_month DECIMAL,
  all_time DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN p.created_at >= CURRENT_DATE THEN p.actual_cost END), 0)::DECIMAL as today,
    COALESCE(SUM(CASE WHEN p.created_at >= date_trunc('week', CURRENT_DATE) THEN p.actual_cost END), 0)::DECIMAL as this_week,
    COALESCE(SUM(CASE WHEN p.created_at >= date_trunc('month', CURRENT_DATE) THEN p.actual_cost END), 0)::DECIMAL as this_month,
    COALESCE(SUM(p.actual_cost), 0)::DECIMAL as all_time
  FROM etsy_empire_projects p
  WHERE p.user_id = p_user_id
    AND p.status = 'completed';
END;
$$ LANGUAGE plpgsql;
