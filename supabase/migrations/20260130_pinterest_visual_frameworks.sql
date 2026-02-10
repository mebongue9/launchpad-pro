-- Pinterest Visual Frameworks Migration
-- Creates table for 30 data-backed Pinterest pin prompts with rotation function
-- Source: ETSY-EMPIRE-VISUAL-FRAMEWORK-LIBRARY.md

-- ============================================================
-- TABLE: pinterest_visual_frameworks
-- ============================================================
CREATE TABLE IF NOT EXISTS pinterest_visual_frameworks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,           -- lifestyle_hands, typography_quote, desk_setup, flatlay, grid_preview, device_mockup
  variation INTEGER NOT NULL,       -- 1-5 per category
  variation_code TEXT NOT NULL,     -- LH-1, TQ-1, DS-1, FL-1, GP-1, DM-1 etc.
  display_name TEXT NOT NULL,       -- Human-readable name
  prompt_template TEXT NOT NULL,    -- Full prompt with {FORMAT} placeholder
  category_weight INTEGER NOT NULL, -- Weighted distribution (27, 26, 16, 14, 10, 8)
  camera_angle TEXT NOT NULL,       -- 45_degrees, straight_on, birds_eye
  color_temperature TEXT NOT NULL,  -- warm, neutral, cool
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(category, variation)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_pvf_category ON pinterest_visual_frameworks(category);
CREATE INDEX IF NOT EXISTS idx_pvf_variation_code ON pinterest_visual_frameworks(variation_code);

-- ============================================================
-- INSERT 30 PROMPTS (6 categories x 5 variations)
-- ============================================================

-- CATEGORY 1: lifestyle_hands (27% weight) - 45-degree angle, warm tones
INSERT INTO pinterest_visual_frameworks (category, variation, variation_code, display_name, prompt_template, category_weight, camera_angle, color_temperature)
VALUES
  ('lifestyle_hands', 1, 'LH-1', 'Hands Holding Open Product',
   '45-degree lifestyle shot of hands with light skin tone holding open {FORMAT} pages, cream-colored paper with visible text and sections, soft natural lighting from top-left, warm wood surface beneath #E3DCC9, soft diffused shadows falling right, fingers gently holding pages open, professional product photography, cozy productive aesthetic, 2:3 vertical Pinterest format',
   27, '45_degrees', 'warm'),

  ('lifestyle_hands', 2, 'LH-2', 'Hands Flipping Through Pages',
   '45-degree lifestyle shot of feminine hands flipping through {FORMAT} pages mid-motion, cream paper with pastel section tabs visible, soft window light from left side, warm beige linen surface beneath #D9CFC1, motion blur on turning page edge, gold ring on finger catching light, cozy morning planning aesthetic, professional lifestyle photography, 2:3 vertical Pinterest format',
   27, '45_degrees', 'warm'),

  ('lifestyle_hands', 3, 'LH-3', 'Hands Writing in Product',
   'Bird''s eye view of hands with natural manicure writing with black pen in open {FORMAT}, cream pages showing lined sections and checkboxes, warm oak desk surface #A08060, small potted succulent upper right corner, soft diffused overhead lighting, journaling session aesthetic, professional lifestyle photography, 2:3 vertical Pinterest format',
   27, 'birds_eye', 'warm'),

  ('lifestyle_hands', 4, 'LH-4', 'Hands Holding Closed Product',
   '45-degree shot of hands presenting closed {FORMAT} with visible cover design, cream cardstock cover with elegant typography, soft natural lighting from right, warm terracotta surface beneath #C4A484, shallow depth of field with soft background bokeh, product reveal moment, professional photography, 2:3 vertical Pinterest format',
   27, '45_degrees', 'warm'),

  ('lifestyle_hands', 5, 'LH-5', 'Hands with Coffee and Product',
   '45-degree cozy lifestyle shot of hands holding white ceramic mug near open {FORMAT} pages, steam rising from coffee, cream pages with visible content, warm chunky knit blanket visible, soft morning window light from left, hygge planning aesthetic, professional lifestyle photography, 2:3 vertical Pinterest format',
   27, '45_degrees', 'warm');

-- CATEGORY 2: typography_quote (26% weight) - straight-on, warm tones
INSERT INTO pinterest_visual_frameworks (category, variation, variation_code, display_name, prompt_template, category_weight, camera_angle, color_temperature)
VALUES
  ('typography_quote', 1, 'TQ-1', 'Bold Text with Product at Bottom',
   'Straight-on typography pin with bold black sans-serif text upper portion, {FORMAT} pages displayed at bottom third of frame, smooth cream background #F5F0E8, clean minimal composition, product pages slightly angled showing content structure, even diffused lighting, no shadows, professional and clean aesthetic, warm color temperature, 2:3 vertical Pinterest format',
   26, 'straight_on', 'warm'),

  ('typography_quote', 2, 'TQ-2', 'Elegant Serif on Textured Paper',
   'Straight-on motivational typography on cream textured linen paper background #F5F0E8 with subtle fabric texture, elegant black serif text centered, thin gold foil accent line beneath text, {FORMAT} corner visible bottom right, generous negative space, soft even lighting, premium stationery aesthetic, 2:3 vertical Pinterest format',
   26, 'straight_on', 'warm'),

  ('typography_quote', 3, 'TQ-3', 'Handwritten Style with Product',
   'Straight-on pin with handwritten-style black script text upper half, {FORMAT} pages fanned out lower portion showing multiple sections, warm cream background #EDE5D8, authentic hand-lettered aesthetic, soft diffused lighting, Pinterest typography style matching 25K+ repin patterns, 2:3 vertical Pinterest format',
   26, 'straight_on', 'warm'),

  ('typography_quote', 4, 'TQ-4', 'Minimal Text Block Design',
   'Straight-on minimalist typography design with bold dark text in clean sans-serif font, {FORMAT} displayed at angle beneath text, light gray background #E8E4E0, geometric minimal composition, even studio lighting, modern professional aesthetic, warm undertones, 2:3 vertical Pinterest format',
   26, 'straight_on', 'warm'),

  ('typography_quote', 5, 'TQ-5', 'Quote Card with Shadow',
   'Straight-on quote card design with black text on cream paper card #F5F0E8, soft drop shadow beneath card, {FORMAT} pages partially visible behind, clean white background, layered paper aesthetic, even diffused lighting, premium stationery brand feel, 2:3 vertical Pinterest format',
   26, 'straight_on', 'warm');

-- CATEGORY 3: desk_setup (16% weight) - 45-degree or birds-eye, warm tones
INSERT INTO pinterest_visual_frameworks (category, variation, variation_code, display_name, prompt_template, category_weight, camera_angle, color_temperature)
VALUES
  ('desk_setup', 1, 'DS-1', 'Minimal White Desk',
   'Bird''s eye flatlay of {FORMAT} pages on clean white desk surface, gold paperclips scattered naturally, small succulent in white pot upper corner, wireless keyboard edge visible, soft diffused overhead lighting, minimal shadows, aspirational home office aesthetic, professional product photography, 2:3 vertical Pinterest format',
   16, 'birds_eye', 'warm'),

  ('desk_setup', 2, 'DS-2', 'Warm Wood Desk Setup',
   '45-degree shot of {FORMAT} open on warm oak wood desk #A57C55, MacBook corner visible, white ceramic mug with latte art, small notepad with gold pen, natural window light from left, soft shadows falling right, productive workspace aesthetic, professional photography, 2:3 vertical Pinterest format',
   16, '45_degrees', 'warm'),

  ('desk_setup', 3, 'DS-3', 'Cozy Home Office',
   '45-degree lifestyle shot of {FORMAT} on cream desk surface, desk lamp providing warm glow, small framed artwork in background, potted plant adding greenery, soft ambient lighting, cozy productive home office aesthetic, shallow depth of field, professional photography, 2:3 vertical Pinterest format',
   16, '45_degrees', 'warm'),

  ('desk_setup', 4, 'DS-4', 'Marble Surface Elegance',
   'Bird''s eye flatlay of {FORMAT} on white marble surface with subtle gray veins, gold scissors and washi tape rolls arranged naturally, dried eucalyptus stem, even overhead lighting, minimal shadows, luxury stationery brand aesthetic, professional product photography, 2:3 vertical Pinterest format',
   16, 'birds_eye', 'neutral'),

  ('desk_setup', 5, 'DS-5', 'Burgundy Leather Desk',
   'Bird''s eye flatlay of {FORMAT} on burgundy leather desk pad #800020, silver pen placed diagonally, small white candle upper left, beige ceramic dish with gold jewelry, warm diffused overhead lighting, executive workspace aesthetic, professional photography, 2:3 vertical Pinterest format',
   16, 'birds_eye', 'warm');

-- CATEGORY 4: flatlay (14% weight) - birds-eye, warm tones
INSERT INTO pinterest_visual_frameworks (category, variation, variation_code, display_name, prompt_template, category_weight, camera_angle, color_temperature)
VALUES
  ('flatlay', 1, 'FL-1', 'Cascading Pages Diagonal',
   'Bird''s eye flatlay of {FORMAT} pages cascading diagonally across frame, cream-colored pages #F5F5DC fanning from top-left to bottom-right, each page showing different section or content, slight overlapping creating depth and volume, smooth light gray surface beneath #E0E0E0, soft diffused overhead lighting, minimal shadows, showing the breadth of content included, professional product photography, warm color temperature, 2:3 vertical Pinterest format',
   14, 'birds_eye', 'warm'),

  ('flatlay', 2, 'FL-2', 'Styled with Accessories',
   'Bird''s eye flatlay of {FORMAT} pages center frame on cream linen background #F5F0E8, gold binder clips securing corners, dried lavender sprigs arranged naturally, small ceramic dish with gold rings, soft diffused overhead lighting, feminine editorial aesthetic, professional styled photography, 2:3 vertical Pinterest format',
   14, 'birds_eye', 'warm'),

  ('flatlay', 3, 'FL-3', 'Grid Arrangement',
   'Bird''s eye flatlay of {FORMAT} pages arranged in neat grid pattern, cream pages with consistent margins between each, showing variety of content types across pages, clean white surface beneath, even overhead lighting, no shadows, organized and comprehensive product showcase, professional photography, 2:3 vertical Pinterest format',
   14, 'birds_eye', 'neutral'),

  ('flatlay', 4, 'FL-4', 'Scattered Creative Style',
   'Bird''s eye flatlay of {FORMAT} pages scattered creatively on warm wood surface #C4A077, pages at various angles showing different content, small potted succulent corner, gold paperclips scattered naturally, soft natural lighting from above, creative workspace aesthetic, professional photography, 2:3 vertical Pinterest format',
   14, 'birds_eye', 'warm'),

  ('flatlay', 5, 'FL-5', 'Minimal Single Focus',
   'Bird''s eye flatlay of single {FORMAT} page centered on smooth cream background #F5F0E6, generous negative space all sides, slight natural paper texture visible, soft even diffused lighting, no shadows, ultra minimal composition highlighting content design, professional product photography, 2:3 vertical Pinterest format',
   14, 'birds_eye', 'warm');

-- CATEGORY 5: grid_preview (10% weight) - straight-on, neutral tones
INSERT INTO pinterest_visual_frameworks (category, variation, variation_code, display_name, prompt_template, category_weight, camera_angle, color_temperature)
VALUES
  ('grid_preview', 1, 'GP-1', '4x4 Page Thumbnails',
   'Straight-on grid layout showing 16 {FORMAT} page thumbnails in 4x4 arrangement, cream background #F5F0E6, consistent sage green and cream color scheme across all pages, slight drop shadow beneath each thumbnail, clean white borders between grid items, soft diffused lighting, product catalog overview style, 2:3 vertical Pinterest format',
   10, 'straight_on', 'neutral'),

  ('grid_preview', 2, 'GP-2', '3x4 Page Grid',
   'Straight-on grid layout showing 12 {FORMAT} page thumbnails in 3x4 arrangement, light gray background #E8E4E0, each page showing different content section, thin white borders between items, even lighting across all thumbnails, comprehensive content preview style, professional layout, 2:3 vertical Pinterest format',
   10, 'straight_on', 'neutral'),

  ('grid_preview', 3, 'GP-3', 'Staggered Grid Layout',
   'Straight-on staggered grid showing {FORMAT} pages at varied sizes, larger feature pages mixed with smaller thumbnails, cream background #F5F0E8, creating visual hierarchy and interest, soft consistent lighting, modern magazine layout aesthetic, professional design, 2:3 vertical Pinterest format',
   10, 'straight_on', 'warm'),

  ('grid_preview', 4, 'GP-4', 'Overlapping Pages Preview',
   'Straight-on view of {FORMAT} pages slightly overlapping in cascading arrangement, showing depth and volume of content, cream pages with visible section headers, light background, soft drop shadows creating dimension, content-rich product showcase, professional photography, 2:3 vertical Pinterest format',
   10, 'straight_on', 'warm'),

  ('grid_preview', 5, 'GP-5', 'Feature Highlight Grid',
   'Straight-on grid with one large {FORMAT} page center surrounded by 8 smaller thumbnails, cream background #F5F0E6, highlighting key feature page while showing variety, thin borders and consistent spacing, even diffused lighting, premium product catalog style, 2:3 vertical Pinterest format',
   10, 'straight_on', 'neutral');

-- CATEGORY 6: device_mockup (8% weight) - birds-eye or 45-degree, neutral tones
INSERT INTO pinterest_visual_frameworks (category, variation, variation_code, display_name, prompt_template, category_weight, camera_angle, color_temperature)
VALUES
  ('device_mockup', 1, 'DM-1', 'iPad on Desk',
   'Bird''s eye shot of iPad Pro in space gray displaying {FORMAT} interface, warm wood desk surface #A08060 beneath, small succulent in white pot corner, gold paperclips scattered, soft natural lighting from above, professional product mockup aesthetic, device screen clearly showing content, 2:3 vertical Pinterest format',
   8, 'birds_eye', 'warm'),

  ('device_mockup', 2, 'DM-2', 'iPad in Hands',
   '45-degree shot of feminine hands holding iPad displaying {FORMAT} content, cozy setting with cream blanket visible, soft natural window light from left, shallow depth of field with soft bokeh background, lifestyle product mockup, device screen clearly legible, 2:3 vertical Pinterest format',
   8, '45_degrees', 'warm'),

  ('device_mockup', 3, 'DM-3', 'Dual Device Display',
   'Bird''s eye flatlay of iPad and iPhone both displaying {FORMAT} pages, cream desk surface beneath, showing cross-device compatibility, small notepad and pen beside, soft diffused overhead lighting, modern digital product aesthetic, screens clearly visible, 2:3 vertical Pinterest format',
   8, 'birds_eye', 'neutral'),

  ('device_mockup', 4, 'DM-4', 'Laptop Screen Display',
   '45-degree shot of MacBook Pro displaying {FORMAT} on screen, warm wood desk surface, small plant and coffee mug in background, natural window lighting from left, shallow depth of field, professional workspace mockup, screen content clearly visible, 2:3 vertical Pinterest format',
   8, '45_degrees', 'warm'),

  ('device_mockup', 5, 'DM-5', 'Phone Gift Presentation',
   'Bird''s eye shot of smartphone displaying {FORMAT} interface, sheer brown organza ribbon #8B4513 tied in bow around phone, cream surface beneath #F5F0E8, soft natural lighting from top-right, gift presentation aesthetic, device screen clearly showing content, 2:3 vertical Pinterest format',
   8, 'birds_eye', 'warm');

-- ============================================================
-- FUNCTION: select_pinterest_framework
-- Rotates through variations 1-5, returns next variation to use
-- ============================================================
CREATE OR REPLACE FUNCTION select_pinterest_framework(
  p_category TEXT,
  p_last_variation INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  variation_code TEXT,
  prompt_template TEXT,
  camera_angle TEXT,
  next_variation INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_next_variation INTEGER;
BEGIN
  -- Calculate next variation (1-5, wrapping around)
  v_next_variation := CASE
    WHEN p_last_variation >= 5 OR p_last_variation < 1 THEN 1
    ELSE p_last_variation + 1
  END;

  RETURN QUERY
  SELECT
    pvf.id,
    pvf.variation_code,
    pvf.prompt_template,
    pvf.camera_angle,
    v_next_variation as next_variation
  FROM pinterest_visual_frameworks pvf
  WHERE pvf.category = p_category
    AND pvf.variation = v_next_variation;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE pinterest_visual_frameworks ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read frameworks (prompts are not sensitive)
CREATE POLICY "Allow read access for authenticated users"
  ON pinterest_visual_frameworks
  FOR SELECT
  TO authenticated
  USING (true);

-- Service role can do anything
CREATE POLICY "Service role full access"
  ON pinterest_visual_frameworks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant execute on function
GRANT EXECUTE ON FUNCTION select_pinterest_framework(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION select_pinterest_framework(TEXT, INTEGER) TO service_role;
