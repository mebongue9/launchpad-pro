-- Add {HOOK_TEXT} placeholder to all 30 visual prompts
-- Text placement varies by category type

-- ============================================================
-- LIFESTYLE_HANDS: Text appears on the pages being held
-- ============================================================
UPDATE pinterest_visual_frameworks SET prompt_template =
'45-degree lifestyle shot of hands with light skin tone holding open {FORMAT} pages with visible heading "{HOOK_TEXT}", cream-colored paper with visible text and sections, soft natural lighting from top-left, warm wood surface beneath #E3DCC9, soft diffused shadows falling right, fingers gently holding pages open, professional product photography, cozy productive aesthetic, 2:3 vertical Pinterest format. CRITICAL: The {FORMAT} pages must show the text "{HOOK_TEXT}" prominently.'
WHERE variation_code = 'LH-1';

UPDATE pinterest_visual_frameworks SET prompt_template =
'45-degree lifestyle shot of feminine hands flipping through {FORMAT} pages mid-motion with visible text "{HOOK_TEXT}" on pages, cream paper with pastel section tabs visible, soft window light from left side, warm beige linen surface beneath #D9CFC1, motion blur on turning page edge, gold ring on finger catching light, cozy morning planning aesthetic, professional lifestyle photography, 2:3 vertical Pinterest format. CRITICAL: Pages must display the text "{HOOK_TEXT}".'
WHERE variation_code = 'LH-2';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Bird''s eye view of hands with natural manicure writing with black pen in open {FORMAT} with heading "{HOOK_TEXT}" visible, cream pages showing lined sections and checkboxes, warm oak desk surface #A08060, small potted succulent upper right corner, soft diffused overhead lighting, journaling session aesthetic, professional lifestyle photography, 2:3 vertical Pinterest format. CRITICAL: The text "{HOOK_TEXT}" must be visible on the pages.'
WHERE variation_code = 'LH-3';

UPDATE pinterest_visual_frameworks SET prompt_template =
'45-degree shot of hands presenting closed {FORMAT} with visible cover text "{HOOK_TEXT}", cream cardstock cover with elegant typography, soft natural lighting from right, warm terracotta surface beneath #C4A484, shallow depth of field with soft background bokeh, product reveal moment, professional photography, 2:3 vertical Pinterest format. CRITICAL: Cover must show "{HOOK_TEXT}" text.'
WHERE variation_code = 'LH-4';

UPDATE pinterest_visual_frameworks SET prompt_template =
'45-degree cozy lifestyle shot of hands holding white ceramic mug near open {FORMAT} pages displaying "{HOOK_TEXT}", steam rising from coffee, cream pages with visible content, warm chunky knit blanket visible, soft morning window light from left, hygge planning aesthetic, professional lifestyle photography, 2:3 vertical Pinterest format. CRITICAL: The pages must show "{HOOK_TEXT}" text.'
WHERE variation_code = 'LH-5';

-- ============================================================
-- TYPOGRAPHY_QUOTE: Text is the main focus, product at bottom
-- ============================================================
UPDATE pinterest_visual_frameworks SET prompt_template =
'Straight-on typography pin with bold black sans-serif text "{HOOK_TEXT}" prominently displayed in upper portion, {FORMAT} pages displayed at bottom third of frame, smooth cream background #F5F0E8, clean minimal composition, product pages slightly angled showing content structure, even diffused lighting, no shadows, professional and clean aesthetic, warm color temperature, 2:3 vertical Pinterest format. CRITICAL: The text "{HOOK_TEXT}" must be the main visual focus.'
WHERE variation_code = 'TQ-1';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Straight-on motivational typography "{HOOK_TEXT}" on cream textured linen paper background #F5F0E8 with subtle fabric texture, elegant black serif text centered, thin gold foil accent line beneath text, {FORMAT} corner visible bottom right, generous negative space, soft even lighting, premium stationery aesthetic, 2:3 vertical Pinterest format. CRITICAL: "{HOOK_TEXT}" must be prominently displayed.'
WHERE variation_code = 'TQ-2';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Straight-on pin with handwritten-style black script text "{HOOK_TEXT}" in upper half, {FORMAT} pages fanned out lower portion showing multiple sections, warm cream background #EDE5D8, authentic hand-lettered aesthetic, soft diffused lighting, Pinterest typography style matching 25K+ repin patterns, 2:3 vertical Pinterest format. CRITICAL: The handwritten text "{HOOK_TEXT}" must be clearly legible.'
WHERE variation_code = 'TQ-3';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Straight-on minimalist typography design with bold dark text "{HOOK_TEXT}" in clean sans-serif font, {FORMAT} displayed at angle beneath text, light gray background #E8E4E0, geometric minimal composition, even studio lighting, modern professional aesthetic, warm undertones, 2:3 vertical Pinterest format. CRITICAL: Text "{HOOK_TEXT}" must be the dominant element.'
WHERE variation_code = 'TQ-4';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Straight-on quote card design with black text "{HOOK_TEXT}" on cream paper card #F5F0E8, soft drop shadow beneath card, {FORMAT} pages partially visible behind, clean white background, layered paper aesthetic, even diffused lighting, premium stationery brand feel, 2:3 vertical Pinterest format. CRITICAL: The quote card must display "{HOOK_TEXT}" clearly.'
WHERE variation_code = 'TQ-5';

-- ============================================================
-- DESK_SETUP: Text visible on product
-- ============================================================
UPDATE pinterest_visual_frameworks SET prompt_template =
'Bird''s eye flatlay of {FORMAT} pages with visible title "{HOOK_TEXT}" on clean white desk surface, gold paperclips scattered naturally, small succulent in white pot upper corner, wireless keyboard edge visible, soft diffused overhead lighting, minimal shadows, aspirational home office aesthetic, professional product photography, 2:3 vertical Pinterest format. CRITICAL: The {FORMAT} must show "{HOOK_TEXT}" text.'
WHERE variation_code = 'DS-1';

UPDATE pinterest_visual_frameworks SET prompt_template =
'45-degree shot of {FORMAT} open on warm oak wood desk #A57C55 showing page with "{HOOK_TEXT}" heading, MacBook corner visible, white ceramic mug with latte art, small notepad with gold pen, natural window light from left, soft shadows falling right, productive workspace aesthetic, professional photography, 2:3 vertical Pinterest format. CRITICAL: Pages must display "{HOOK_TEXT}".'
WHERE variation_code = 'DS-2';

UPDATE pinterest_visual_frameworks SET prompt_template =
'45-degree lifestyle shot of {FORMAT} on cream desk surface with visible "{HOOK_TEXT}" title, desk lamp providing warm glow, small framed artwork in background, potted plant adding greenery, soft ambient lighting, cozy productive home office aesthetic, shallow depth of field, professional photography, 2:3 vertical Pinterest format. CRITICAL: The product must show "{HOOK_TEXT}" text.'
WHERE variation_code = 'DS-3';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Bird''s eye flatlay of {FORMAT} with cover displaying "{HOOK_TEXT}" on white marble surface with subtle gray veins, gold scissors and washi tape rolls arranged naturally, dried eucalyptus stem, even overhead lighting, minimal shadows, luxury stationery brand aesthetic, professional product photography, 2:3 vertical Pinterest format. CRITICAL: The cover text "{HOOK_TEXT}" must be visible.'
WHERE variation_code = 'DS-4';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Bird''s eye flatlay of {FORMAT} pages showing "{HOOK_TEXT}" on burgundy leather desk pad #800020, silver pen placed diagonally, small white candle upper left, beige ceramic dish with gold jewelry, warm diffused overhead lighting, executive workspace aesthetic, professional photography, 2:3 vertical Pinterest format. CRITICAL: Pages must display "{HOOK_TEXT}" text.'
WHERE variation_code = 'DS-5';

-- ============================================================
-- FLATLAY: Text visible on the pages spread out
-- ============================================================
UPDATE pinterest_visual_frameworks SET prompt_template =
'Bird''s eye flatlay of {FORMAT} pages cascading diagonally across frame with visible title "{HOOK_TEXT}" on top page, cream-colored pages #F5F5DC fanning from top-left to bottom-right, each page showing different section or content, slight overlapping creating depth and volume, smooth light gray surface beneath #E0E0E0, soft diffused overhead lighting, minimal shadows, showing the breadth of content included, professional product photography, warm color temperature, 2:3 vertical Pinterest format. CRITICAL: The text "{HOOK_TEXT}" must be visible on the pages.'
WHERE variation_code = 'FL-1';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Bird''s eye flatlay of {FORMAT} pages with "{HOOK_TEXT}" visible center frame on cream linen background #F5F0E8, gold binder clips securing corners, dried lavender sprigs arranged naturally, small ceramic dish with gold rings, soft diffused overhead lighting, feminine editorial aesthetic, professional styled photography, 2:3 vertical Pinterest format. CRITICAL: The "{HOOK_TEXT}" text must appear prominently.'
WHERE variation_code = 'FL-2';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Bird''s eye flatlay of {FORMAT} pages showing "{HOOK_TEXT}" heading arranged in neat grid pattern, cream pages with consistent margins between each, showing variety of content types across pages, clean white surface beneath, even overhead lighting, no shadows, organized and comprehensive product showcase, professional photography, 2:3 vertical Pinterest format. CRITICAL: "{HOOK_TEXT}" must be visible on pages.'
WHERE variation_code = 'FL-3';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Bird''s eye flatlay of {FORMAT} pages with "{HOOK_TEXT}" title scattered creatively on warm wood surface #C4A077, pages at various angles showing different content, small potted succulent corner, gold paperclips scattered naturally, soft natural lighting from above, creative workspace aesthetic, professional photography, 2:3 vertical Pinterest format. CRITICAL: The text "{HOOK_TEXT}" must appear on the pages.'
WHERE variation_code = 'FL-4';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Bird''s eye flatlay of single {FORMAT} page with "{HOOK_TEXT}" centered on smooth cream background #F5F0E6, generous negative space all sides, slight natural paper texture visible, soft even diffused lighting, no shadows, ultra minimal composition highlighting content design, professional product photography, 2:3 vertical Pinterest format. CRITICAL: "{HOOK_TEXT}" must be prominently displayed on the page.'
WHERE variation_code = 'FL-5';

-- ============================================================
-- GRID_PREVIEW: Text as header/title above grid
-- ============================================================
UPDATE pinterest_visual_frameworks SET prompt_template =
'Straight-on grid layout with bold header text "{HOOK_TEXT}" at top, showing 16 {FORMAT} page thumbnails in 4x4 arrangement below, cream background #F5F0E6, consistent sage green and cream color scheme across all pages, slight drop shadow beneath each thumbnail, clean white borders between grid items, soft diffused lighting, product catalog overview style, 2:3 vertical Pinterest format. CRITICAL: The header "{HOOK_TEXT}" must be prominently displayed above the grid.'
WHERE variation_code = 'GP-1';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Straight-on grid layout with title text "{HOOK_TEXT}" at top, showing 12 {FORMAT} page thumbnails in 3x4 arrangement, light gray background #E8E4E0, each page showing different content section, thin white borders between items, even lighting across all thumbnails, comprehensive content preview style, professional layout, 2:3 vertical Pinterest format. CRITICAL: "{HOOK_TEXT}" must appear as header text.'
WHERE variation_code = 'GP-2';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Straight-on staggered grid with heading "{HOOK_TEXT}" showing {FORMAT} pages at varied sizes, larger feature pages mixed with smaller thumbnails, cream background #F5F0E8, creating visual hierarchy and interest, soft consistent lighting, modern magazine layout aesthetic, professional design, 2:3 vertical Pinterest format. CRITICAL: The text "{HOOK_TEXT}" must be the heading.'
WHERE variation_code = 'GP-3';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Straight-on view with title "{HOOK_TEXT}" above {FORMAT} pages slightly overlapping in cascading arrangement, showing depth and volume of content, cream pages with visible section headers, light background, soft drop shadows creating dimension, content-rich product showcase, professional photography, 2:3 vertical Pinterest format. CRITICAL: "{HOOK_TEXT}" must appear as the title.'
WHERE variation_code = 'GP-4';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Straight-on grid with bold header "{HOOK_TEXT}" and one large {FORMAT} page center surrounded by 8 smaller thumbnails, cream background #F5F0E6, highlighting key feature page while showing variety, thin borders and consistent spacing, even diffused lighting, premium product catalog style, 2:3 vertical Pinterest format. CRITICAL: The header text "{HOOK_TEXT}" must be prominent.'
WHERE variation_code = 'GP-5';

-- ============================================================
-- DEVICE_MOCKUP: Text on screen display
-- ============================================================
UPDATE pinterest_visual_frameworks SET prompt_template =
'Bird''s eye shot of iPad Pro in space gray displaying {FORMAT} interface with text "{HOOK_TEXT}" visible on screen, warm wood desk surface #A08060 beneath, small succulent in white pot corner, gold paperclips scattered, soft natural lighting from above, professional product mockup aesthetic, device screen clearly showing content, 2:3 vertical Pinterest format. CRITICAL: The screen must display "{HOOK_TEXT}" text.'
WHERE variation_code = 'DM-1';

UPDATE pinterest_visual_frameworks SET prompt_template =
'45-degree shot of feminine hands holding iPad displaying {FORMAT} content with "{HOOK_TEXT}" visible on screen, cozy setting with cream blanket visible, soft natural window light from left, shallow depth of field with soft bokeh background, lifestyle product mockup, device screen clearly legible, 2:3 vertical Pinterest format. CRITICAL: Screen must show "{HOOK_TEXT}" text.'
WHERE variation_code = 'DM-2';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Bird''s eye flatlay of iPad and iPhone both displaying {FORMAT} pages with "{HOOK_TEXT}" visible on screens, cream desk surface beneath, showing cross-device compatibility, small notepad and pen beside, soft diffused overhead lighting, modern digital product aesthetic, screens clearly visible, 2:3 vertical Pinterest format. CRITICAL: Both device screens must show "{HOOK_TEXT}".'
WHERE variation_code = 'DM-3';

UPDATE pinterest_visual_frameworks SET prompt_template =
'45-degree shot of MacBook Pro displaying {FORMAT} on screen with "{HOOK_TEXT}" text visible, warm wood desk surface, small plant and coffee mug in background, natural window lighting from left, shallow depth of field, professional workspace mockup, screen content clearly visible, 2:3 vertical Pinterest format. CRITICAL: The laptop screen must display "{HOOK_TEXT}".'
WHERE variation_code = 'DM-4';

UPDATE pinterest_visual_frameworks SET prompt_template =
'Bird''s eye shot of smartphone displaying {FORMAT} interface with "{HOOK_TEXT}" on screen, sheer brown organza ribbon #8B4513 tied in bow around phone, cream surface beneath #F5F0E8, soft natural lighting from top-right, gift presentation aesthetic, device screen clearly showing content, 2:3 vertical Pinterest format. CRITICAL: Phone screen must show "{HOOK_TEXT}" text.'
WHERE variation_code = 'DM-5';
