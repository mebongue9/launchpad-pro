-- Pinterest Text Frameworks Migration
-- Source: ETSY-EMPIRE-FRAMEWORK-MASTER-v4.md
-- WEIGHTS: Pinterest=80, YouTube=15, Affirmation=5
-- FILTER: Only frameworks with fillable variables (NUMBER, DELIVERABLE, RESULT, OUTCOME, TOPIC)

-- ============================================================
-- TABLE: pinterest_text_frameworks
-- ============================================================
CREATE TABLE IF NOT EXISTS pinterest_text_frameworks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  framework_code TEXT NOT NULL UNIQUE,
  base_framework TEXT NOT NULL,
  category TEXT NOT NULL,
  framework_name TEXT NOT NULL,
  template TEXT NOT NULL,
  example TEXT NOT NULL,
  variables TEXT[],
  category_weight INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ptf_category ON pinterest_text_frameworks(category);
CREATE INDEX IF NOT EXISTS idx_ptf_framework_code ON pinterest_text_frameworks(framework_code);

-- ============================================================
-- PINTEREST FRAMEWORKS (Weight: 80)
-- Only including frameworks with fillable variables
-- ============================================================

-- P1: The Adjective Twist
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, variables, category_weight) VALUES
('P1a', 'P1', 'pinterest', 'Adjective Twist', '[NUMBER] [ADJECTIVE] [DELIVERABLE] To [OUTCOME]', '18 Dirty Little DM Scripts To Close Sales', ARRAY['NUMBER', 'ADJECTIVE', 'DELIVERABLE', 'OUTCOME'], 80),
('P1c', 'P1', 'pinterest', 'Adjective Twist Ways', 'The [ADJECTIVE] [DELIVERABLE]: [NUMBER] Ways To [OUTCOME]', 'The Lazy Swipe File: 18 Ways To Make Money', ARRAY['ADJECTIVE', 'DELIVERABLE', 'NUMBER', 'OUTCOME'], 80);

-- P3: The Simple Numbered Promise (ALL variants use fillable variables)
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, variables, category_weight) VALUES
('P3a', 'P3', 'pinterest', 'Simple Numbered Promise', '[NUMBER] [DELIVERABLE] That [RESULT]', '20 Email Templates That Get Replies', ARRAY['NUMBER', 'DELIVERABLE', 'RESULT'], 80),
('P3b', 'P3', 'pinterest', 'Copy-Paste Promise', '[NUMBER] Copy-Paste [DELIVERABLE] That [RESULT]', '20 Copy-Paste DM Scripts That Close Deals', ARRAY['NUMBER', 'DELIVERABLE', 'RESULT'], 80),
('P3c', 'P3', 'pinterest', 'Point Checklist Promise', 'My [NUMBER]-Point [DELIVERABLE] That [RESULT]', 'My 20-Point Sales Checklist That Converts', ARRAY['NUMBER', 'DELIVERABLE', 'RESULT'], 80),
('P3d', 'P3', 'pinterest', 'Sell Like Crazy', '[NUMBER] [DELIVERABLE] That Sell Like Crazy', '50 Digital Product Templates That Sell Like Crazy', ARRAY['NUMBER', 'DELIVERABLE'], 80),
('P3e', 'P3', 'pinterest', 'Topic Sell Like Crazy', '[NUMBER] [TOPIC] [DELIVERABLE] That Sell Like Crazy', '50 Etsy Listing Templates That Sell Like Crazy', ARRAY['NUMBER', 'TOPIC', 'DELIVERABLE'], 80);

-- P6: The Essential Items
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, variables, category_weight) VALUES
('P6a', 'P6', 'pinterest', 'Essential Items', '[NUMBER] [DELIVERABLE] You Need To [OUTCOME]', '7 Listing Templates You Need To Sell on Etsy', ARRAY['NUMBER', 'DELIVERABLE', 'OUTCOME'], 80),
('P6b', 'P6', 'pinterest', 'Essential Point', 'The [NUMBER]-Point [DELIVERABLE] You Need for [OUTCOME]', 'The 7-Point Checklist You Need for Etsy Success', ARRAY['NUMBER', 'DELIVERABLE', 'OUTCOME'], 80);

-- P8: The Actually Works Promise
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, variables, category_weight) VALUES
('P8a', 'P8', 'pinterest', 'Actually Works', '[NUMBER] [DELIVERABLE] That Actually [RESULT]', '13 Email Templates That Actually Get Opens', ARRAY['NUMBER', 'DELIVERABLE', 'RESULT'], 80),
('P8c', 'P8', 'pinterest', 'Actually Copy', '[NUMBER] [DELIVERABLE] That Actually [RESULT] (Copy These)', '12 Headlines That Actually Convert (Copy These)', ARRAY['NUMBER', 'DELIVERABLE', 'RESULT'], 80);

-- P10: The Only Thing You Need
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, variables, category_weight) VALUES
('P10a', 'P10', 'pinterest', 'Only Thing Needed', 'The Only [NUMBER] [DELIVERABLE] You Need', 'The Only 5 Email Templates You Need', ARRAY['NUMBER', 'DELIVERABLE'], 80),
('P10b', 'P10', 'pinterest', 'Only Point Needed', 'The Only [NUMBER]-Point [DELIVERABLE] You Need To [OUTCOME]', 'The Only 5-Point Checklist You Need To Close Sales', ARRAY['NUMBER', 'DELIVERABLE', 'OUTCOME'], 80);

-- P14: The Step By Step Guide
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, variables, category_weight) VALUES
('P14a', 'P14', 'pinterest', 'Step By Step Inside', 'How To [OUTCOME] Step By Step: [DELIVERABLE] Inside', 'How To Launch on Etsy Step By Step: Checklist Inside', ARRAY['OUTCOME', 'DELIVERABLE'], 80),
('P14b', 'P14', 'pinterest', 'Step By Step Point', '[OUTCOME] Step By Step: My [NUMBER]-Point [DELIVERABLE]', 'Build Your Funnel Step By Step: My 14-Point Blueprint', ARRAY['OUTCOME', 'NUMBER', 'DELIVERABLE'], 80),
('P14c', 'P14', 'pinterest', 'Step By Step Outcome', 'The Step By Step [DELIVERABLE] To [OUTCOME]', 'The Step By Step Checklist To Your First $1K', ARRAY['DELIVERABLE', 'OUTCOME'], 80);

-- ============================================================
-- YOUTUBE FRAMEWORKS (Weight: 15)
-- Only including frameworks with fillable variables
-- ============================================================

-- Y1: The Boring Paradox
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, variables, category_weight) VALUES
('Y1a', 'Y1', 'youtube', 'Boring Paradox', '[NUMBER] "Boring" [DELIVERABLE] That [RESULT]', '5 Boring Email Templates That Make $3K/Month', ARRAY['NUMBER', 'DELIVERABLE', 'RESULT'], 15),
('Y1c', 'Y1', 'youtube', 'Boring But', '[NUMBER] Boring But Effective [DELIVERABLE]', '5 Boring But Effective Email Templates', ARRAY['NUMBER', 'DELIVERABLE'], 15),
('Y1d', 'Y1', 'youtube', 'Stupid Simple', '[NUMBER] Stupid Simple [DELIVERABLE] That [RESULT]', '6 Stupid Simple Email Scripts That Pay $3K/Month', ARRAY['NUMBER', 'DELIVERABLE', 'RESULT'], 15),
('Y1e', 'Y1', 'youtube', 'Stupid Simple Topic', '[NUMBER] Stupid Simple [TOPIC] [DELIVERABLE]', '6 Stupid Simple Etsy Listing Templates', ARRAY['NUMBER', 'TOPIC', 'DELIVERABLE'], 15);

-- Y3: The Percentage Fix
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, variables, category_weight) VALUES
('Y3a', 'Y3', 'youtube', 'Percentage Fix', '[NUMBER] [DELIVERABLE] That Fix 90% of [TOPIC] Issues', '4 Morning Templates That Fix 90% of Productivity Issues', ARRAY['NUMBER', 'DELIVERABLE', 'TOPIC'], 15);

-- Y7: The No BS Promise
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, variables, category_weight) VALUES
('Y7a', 'Y7', 'youtube', 'No BS', '[NUMBER] No BS [DELIVERABLE] To [OUTCOME]', '6 No BS Email Scripts To Get Sales', ARRAY['NUMBER', 'DELIVERABLE', 'OUTCOME'], 15),
('Y7b', 'Y7', 'youtube', 'No BS Point', 'My [NUMBER]-Point No BS [DELIVERABLE] To [OUTCOME]', 'My 6-Point No BS Checklist To Close Clients', ARRAY['NUMBER', 'DELIVERABLE', 'OUTCOME'], 15);

-- Y8: The Copy Invitation
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, variables, category_weight) VALUES
('Y8a', 'Y8', 'youtube', 'Copy These', '[NUMBER] [DELIVERABLE] That [RESULT] (Copy These)', '9 Product Descriptions That Sell (Copy These)', ARRAY['NUMBER', 'DELIVERABLE', 'RESULT'], 15),
('Y8b', 'Y8', 'youtube', 'Copy-Paste', '[NUMBER] Copy-Paste [DELIVERABLE] That [RESULT]', '9 Copy-Paste Email Templates That Convert', ARRAY['NUMBER', 'DELIVERABLE', 'RESULT'], 15);

-- Y12: The Tested Results
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, variables, category_weight) VALUES
('Y12a', 'Y12', 'youtube', 'Tested Results', 'I Tried [NUMBER] [TOPIC] Items. These [DELIVERABLE] Work', 'I Tried 50 Hooks. These 7 Headline Templates Work', ARRAY['NUMBER', 'TOPIC', 'DELIVERABLE'], 15);

-- Y18: The Actually Works
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, variables, category_weight) VALUES
('Y18a', 'Y18', 'youtube', 'Actually How', 'How To Actually [OUTCOME]: My [NUMBER]-Point [DELIVERABLE]', 'How To Actually Get Clients: My 7-Point Checklist', ARRAY['OUTCOME', 'NUMBER', 'DELIVERABLE'], 15),
('Y18b', 'Y18', 'youtube', 'Actually Number', '[NUMBER] [DELIVERABLE] That Actually [RESULT]', '7 Scripts That Actually Close Sales', ARRAY['NUMBER', 'DELIVERABLE', 'RESULT'], 15);

-- Y22: The Discovery Secret
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, variables, category_weight) VALUES
('Y22a', 'Y22', 'youtube', 'Discovery Secret', '[NUMBER] [TOPIC] [DELIVERABLE] You Didn''t Know Existed', '15 Etsy Listing Templates You Didn''t Know Existed', ARRAY['NUMBER', 'TOPIC', 'DELIVERABLE'], 15),
('Y22c', 'Y22', 'youtube', 'Hidden', '[NUMBER] Hidden [DELIVERABLE] for [OUTCOME]', '7 Hidden Email Scripts for Getting Replies', ARRAY['NUMBER', 'DELIVERABLE', 'OUTCOME'], 15);

-- Y23: The Underrated Gem
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, variables, category_weight) VALUES
('Y23a', 'Y23', 'youtube', 'Underrated Gem', 'The Most Underrated [DELIVERABLE] To [OUTCOME]', 'The Most Underrated Checklist To Double Your Sales', ARRAY['DELIVERABLE', 'OUTCOME'], 15),
('Y23b', 'Y23', 'youtube', 'Underrated Number', '[NUMBER] Underrated [DELIVERABLE] for [OUTCOME]', '5 Underrated Templates for Getting Clients', ARRAY['NUMBER', 'DELIVERABLE', 'OUTCOME'], 15);

-- Y24: The Impossible to Fail
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, variables, category_weight) VALUES
('Y24c', 'Y24', 'youtube', 'Fail-Proof', '[NUMBER] Fail-Proof [DELIVERABLE] for [OUTCOME]', '7 Fail-Proof Templates for Landing Clients', ARRAY['NUMBER', 'DELIVERABLE', 'OUTCOME'], 15);

-- Y29: The Easier Thanks To
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, variables, category_weight) VALUES
('Y29a', 'Y29', 'youtube', 'Just Got Easier', '[OUTCOME] Just Got Easier: The [DELIVERABLE] That Changes Everything', 'Getting Clients Just Got Easier: The Outreach Checklist That Changes Everything', ARRAY['OUTCOME', 'DELIVERABLE'], 15),
('Y29c', 'Y29', 'youtube', 'Made Easy', 'The [DELIVERABLE] That Made [OUTCOME] Easy', 'The Checklist That Made Mornings Easy', ARRAY['DELIVERABLE', 'OUTCOME'], 15);

-- Y30: The Transformation Proof
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, variables, category_weight) VALUES
('Y30b', 'Y30', 'youtube', 'Made Me Transformation', 'The [NUMBER] [DELIVERABLE] That [RESULT]', 'The 7 Templates That Made Me Debt-Free', ARRAY['NUMBER', 'DELIVERABLE', 'RESULT'], 15);

-- ============================================================
-- AFFIRMATION FRAMEWORKS (Weight: 5)
-- Only including frameworks with fillable variables
-- ============================================================

-- A1: The "I Can" Declaration
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, variables, category_weight) VALUES
('A1b', 'A1', 'affirmation', 'I Can Number', 'I Can [OUTCOME]: [NUMBER] [DELIVERABLE] Inside', 'I Can Save Money: 12 Budget Templates Inside', ARRAY['OUTCOME', 'NUMBER', 'DELIVERABLE'], 5);

-- A3: The "I Have The Power" Statement
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, variables, category_weight) VALUES
('A3a', 'A3', 'affirmation', 'I Have Power', 'I Have The Power To [OUTCOME]. [DELIVERABLE] Inside', 'I Have The Power To Change My Life. Planner Inside', ARRAY['OUTCOME', 'DELIVERABLE'], 5),
('A3b', 'A3', 'affirmation', 'Power Number', 'I Have The Power To [OUTCOME]: [NUMBER] [DELIVERABLE] To Help', 'I Have The Power To Get Rich: 10 Budget Templates To Help', ARRAY['OUTCOME', 'NUMBER', 'DELIVERABLE'], 5),
('A3c', 'A3', 'affirmation', 'You Have Power', 'You Have The Power To [OUTCOME]. Here''s The [DELIVERABLE]', 'You Have The Power To Get Organized. Here''s The Checklist', ARRAY['OUTCOME', 'DELIVERABLE'], 5);

-- A6: The "I Am A" Identity
INSERT INTO pinterest_text_frameworks (framework_code, base_framework, category, framework_name, template, example, variables, category_weight) VALUES
('A6c', 'A6', 'affirmation', 'Become A', 'Become [OUTCOME] With This [DELIVERABLE]', 'Become A Morning Person With This Routine Planner', ARRAY['OUTCOME', 'DELIVERABLE'], 5);

-- ============================================================
-- FUNCTION: select_text_framework
-- Randomly selects based on category weights, excludes last used
-- ============================================================
CREATE OR REPLACE FUNCTION select_text_framework(
  p_exclude_code TEXT DEFAULT NULL
)
RETURNS TABLE (
  framework_code TEXT,
  category TEXT,
  template TEXT,
  example TEXT,
  variables TEXT[]
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ptf.framework_code,
    ptf.category,
    ptf.template,
    ptf.example,
    ptf.variables
  FROM pinterest_text_frameworks ptf
  WHERE (p_exclude_code IS NULL OR ptf.framework_code != p_exclude_code)
  ORDER BY RANDOM() * ptf.category_weight DESC
  LIMIT 1;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE pinterest_text_frameworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for authenticated users"
  ON pinterest_text_frameworks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role full access"
  ON pinterest_text_frameworks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT EXECUTE ON FUNCTION select_text_framework(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION select_text_framework(TEXT) TO service_role;
