-- Visual Builder Tables
-- Created: January 13, 2026
-- Purpose: Cover templates and styled products for PDF generation

-- ============================================
-- COVER TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS cover_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  primary_color VARCHAR(7) NOT NULL,
  secondary_color VARCHAR(7) NOT NULL,
  tertiary_color VARCHAR(7) NOT NULL,
  font_family TEXT NOT NULL,
  font_family_url TEXT,
  html_template TEXT NOT NULL,
  css_styles TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  is_gradient BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for cover_templates
ALTER TABLE cover_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view default and own templates"
  ON cover_templates FOR SELECT
  USING (is_default = TRUE OR auth.uid() = created_by);

CREATE POLICY "Users can create templates"
  ON cover_templates FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own non-default templates"
  ON cover_templates FOR UPDATE
  USING (auth.uid() = created_by AND is_default = FALSE);

CREATE POLICY "Users can delete own non-default templates"
  ON cover_templates FOR DELETE
  USING (auth.uid() = created_by AND is_default = FALSE);

-- ============================================
-- STYLED PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS styled_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID REFERENCES funnels(id) ON DELETE CASCADE,
  lead_magnet_id UUID REFERENCES lead_magnets(id) ON DELETE CASCADE,
  product_type TEXT NOT NULL,
  cover_template_id UUID REFERENCES cover_templates(id) NOT NULL,
  cover_title TEXT NOT NULL,
  cover_subtitle TEXT,
  title_size_percent INTEGER DEFAULT 100,
  subtitle_size_percent INTEGER DEFAULT 100,
  pdf_url TEXT,
  cover_png_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT styled_products_one_parent CHECK (
    (funnel_id IS NOT NULL AND lead_magnet_id IS NULL) OR
    (funnel_id IS NULL AND lead_magnet_id IS NOT NULL)
  ),
  CONSTRAINT styled_products_valid_type CHECK (
    product_type IN ('lead_magnet', 'front_end', 'bump', 'upsell_1', 'upsell_2')
  )
);

-- RLS for styled_products
ALTER TABLE styled_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own styled_products"
  ON styled_products FOR ALL
  USING (
    (funnel_id IN (SELECT id FROM funnels WHERE user_id = auth.uid()))
    OR
    (lead_magnet_id IN (SELECT id FROM lead_magnets WHERE user_id = auth.uid()))
  );

-- ============================================
-- ADD STATUS COLUMN TO FUNNELS/LEAD_MAGNETS
-- ============================================
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE lead_magnets ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- ============================================
-- SEED 4 DEFAULT COVER TEMPLATES
-- ============================================

-- TEMPLATE 1: Bold Gradient
INSERT INTO cover_templates (name, description, primary_color, secondary_color, tertiary_color, font_family, font_family_url, is_default, is_gradient, html_template, css_styles)
VALUES (
  'Bold Gradient',
  'Energetic orange gradient with bold Oswald typography',
  '#CD4F00',
  '#8B2500',
  '#FF6B00',
  'Oswald',
  'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap',
  TRUE,
  TRUE,
  '<div class="cover cover-bold-gradient">
  <div class="main-title">{{title}}</div>
  <div class="middle-section">
    <div class="year">{{year}}</div>
    <div class="divider"></div>
    <div class="sub-text">{{subtitle}}</div>
  </div>
  <div class="bottom-section">
    <div class="author">{{author}}</div>
    <div class="logo-placeholder">
      <div class="logo-circle"></div>
      <span>{{handle}}</span>
    </div>
  </div>
</div>',
  '.cover-bold-gradient {
  background: linear-gradient(165deg, #1a0a00 0%, #8B2500 30%, #CD4F00 60%, #FF6B00 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0;
  width: 210mm;
  height: 297mm;
}

.cover-bold-gradient .main-title {
  font-family: ''Oswald'', sans-serif;
  font-size: calc(72px * var(--title-scale, 1));
  font-weight: 700;
  color: white;
  text-transform: uppercase;
  line-height: 0.85;
  padding: 40px 30px 0;
  letter-spacing: -2px;
}

.cover-bold-gradient .middle-section {
  padding: 0 30px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.cover-bold-gradient .year {
  font-family: ''Oswald'', sans-serif;
  font-size: 56px;
  font-weight: 700;
  color: white;
  opacity: 0.9;
}

.cover-bold-gradient .divider {
  width: 2px;
  height: 70px;
  background: rgba(255,255,255,0.4);
}

.cover-bold-gradient .sub-text {
  font-family: ''Inter'', sans-serif;
  font-size: calc(14px * var(--subtitle-scale, 1));
  color: rgba(255,255,255,0.85);
  line-height: 1.5;
  font-style: italic;
}

.cover-bold-gradient .bottom-section {
  padding: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cover-bold-gradient .author {
  font-family: ''Inter'', sans-serif;
  font-size: 14px;
  color: rgba(255,255,255,0.8);
  text-transform: uppercase;
  letter-spacing: 2px;
}

.cover-bold-gradient .logo-placeholder {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(255,255,255,0.7);
}

.cover-bold-gradient .logo-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.7);
}'
);

-- TEMPLATE 2: Dark Luxury
INSERT INTO cover_templates (name, description, primary_color, secondary_color, tertiary_color, font_family, font_family_url, is_default, is_gradient, html_template, css_styles)
VALUES (
  'Dark Luxury',
  'Elegant black with gold accents and Playfair Display serif',
  '#C9A962',
  '#8B7532',
  '#E8D48B',
  'Playfair Display',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap',
  TRUE,
  FALSE,
  '<div class="cover cover-dark-luxury">
  <div class="top-line">
    <div class="edition">Premium Edition</div>
    <div class="year">{{year}}</div>
  </div>
  <div class="main-content">
    <div class="main-title">{{title}}</div>
    <div class="gold-line"></div>
    <div class="sub-text">{{subtitle}}</div>
  </div>
  <div class="bottom-section">
    <div class="author">{{author}}</div>
  </div>
</div>',
  '.cover-dark-luxury {
  background: linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%);
  display: flex;
  flex-direction: column;
  padding: 40px;
  border: 1px solid #333;
  width: 210mm;
  height: 297mm;
}

.cover-dark-luxury .top-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: auto;
}

.cover-dark-luxury .edition {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 4px;
  color: #C9A962;
}

.cover-dark-luxury .year {
  font-size: 11px;
  color: #666;
}

.cover-dark-luxury .main-content {
  text-align: center;
  margin: auto 0;
}

.cover-dark-luxury .main-title {
  font-family: ''Playfair Display'', serif;
  font-size: calc(60px * var(--title-scale, 1));
  font-weight: 400;
  color: white;
  line-height: 1.1;
  margin-bottom: 30px;
}

.cover-dark-luxury .gold-line {
  width: 80px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #C9A962, transparent);
  margin: 0 auto 30px;
}

.cover-dark-luxury .sub-text {
  font-size: calc(13px * var(--subtitle-scale, 1));
  color: #666;
  font-style: italic;
  max-width: 280px;
  margin: 0 auto;
  line-height: 1.6;
}

.cover-dark-luxury .bottom-section {
  margin-top: auto;
  text-align: center;
}

.cover-dark-luxury .author {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 5px;
  color: #C9A962;
}'
);

-- TEMPLATE 3: Minimal Swiss
INSERT INTO cover_templates (name, description, primary_color, secondary_color, tertiary_color, font_family, font_family_url, is_default, is_gradient, html_template, css_styles)
VALUES (
  'Minimal Swiss',
  'Clean white design with black accent bar and red highlights',
  '#000000',
  '#E63946',
  '#f5f5f5',
  'Space Grotesk',
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap',
  TRUE,
  FALSE,
  '<div class="cover cover-minimal-swiss">
  <div class="accent-bar"></div>
  <div class="top-section">
    <div>
      <div class="category">Business Guide</div>
      <div class="year">{{year}}</div>
    </div>
  </div>
  <div class="main-content">
    <div class="main-title">{{title}}</div>
    <div class="sub-text">{{subtitle}}</div>
  </div>
  <div class="bottom-section">
    <div class="author">{{author}}</div>
    <div class="page-count">24 Pages</div>
  </div>
</div>',
  '.cover-minimal-swiss {
  background: #ffffff;
  display: flex;
  flex-direction: column;
  padding: 40px;
  position: relative;
  width: 210mm;
  height: 297mm;
}

.cover-minimal-swiss .accent-bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 10px;
  height: 100%;
  background: #000;
}

.cover-minimal-swiss .top-section {
  margin-bottom: auto;
  padding-left: 20px;
}

.cover-minimal-swiss .category {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 4px;
  color: #999;
  margin-bottom: 10px;
}

.cover-minimal-swiss .year {
  font-family: ''Space Grotesk'', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #000;
}

.cover-minimal-swiss .main-content {
  margin: auto 0;
  padding-left: 20px;
}

.cover-minimal-swiss .main-title {
  font-family: ''Space Grotesk'', sans-serif;
  font-size: calc(70px * var(--title-scale, 1));
  font-weight: 700;
  color: #000;
  line-height: 0.95;
  text-transform: uppercase;
  letter-spacing: -3px;
}

.cover-minimal-swiss .sub-text {
  font-size: calc(14px * var(--subtitle-scale, 1));
  color: #666;
  margin-top: 24px;
  line-height: 1.6;
  max-width: 260px;
}

.cover-minimal-swiss .bottom-section {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-left: 20px;
}

.cover-minimal-swiss .author {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: #000;
  font-weight: 600;
}

.cover-minimal-swiss .page-count {
  font-size: 11px;
  color: #999;
}'
);

-- TEMPLATE 4: Neon Dark
INSERT INTO cover_templates (name, description, primary_color, secondary_color, tertiary_color, font_family, font_family_url, is_default, is_gradient, html_template, css_styles)
VALUES (
  'Neon Dark',
  'Dark theme with glowing neon green accents',
  '#00FF88',
  '#006644',
  '#00CC6A',
  'Oswald',
  'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap',
  TRUE,
  FALSE,
  '<div class="cover cover-neon-dark">
  <div class="top-section">
    <div class="logo-area">
      <div class="logo-square"></div>
      <div class="brand">{{handle}}</div>
    </div>
    <div class="year">{{year}}</div>
  </div>
  <div class="main-content">
    <div class="main-title">{{title}}</div>
    <div class="sub-text">{{subtitle}}</div>
  </div>
  <div class="bottom-section">
    <div class="author">{{author}}</div>
    <div class="handle">@{{handle}}</div>
  </div>
</div>',
  '.cover-neon-dark {
  background: #0d0d0d;
  display: flex;
  flex-direction: column;
  padding: 40px;
  position: relative;
  overflow: hidden;
  width: 210mm;
  height: 297mm;
}

.cover-neon-dark::before {
  content: '''';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(0, 255, 136, 0.15) 0%, transparent 60%);
}

.cover-neon-dark .top-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  z-index: 1;
}

.cover-neon-dark .logo-area {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cover-neon-dark .logo-square {
  width: 30px;
  height: 30px;
  border: 2px solid #00FF88;
  border-radius: 6px;
}

.cover-neon-dark .brand {
  font-size: 12px;
  color: #00FF88;
  text-transform: uppercase;
  letter-spacing: 3px;
}

.cover-neon-dark .year {
  font-size: 12px;
  color: #444;
}

.cover-neon-dark .main-content {
  margin: auto 0;
  position: relative;
  z-index: 1;
}

.cover-neon-dark .main-title {
  font-family: ''Oswald'', sans-serif;
  font-size: calc(72px * var(--title-scale, 1));
  font-weight: 700;
  color: #00FF88;
  text-transform: uppercase;
  line-height: 0.9;
  letter-spacing: -2px;
  text-shadow: 0 0 40px rgba(0, 255, 136, 0.5);
}

.cover-neon-dark .sub-text {
  font-size: calc(14px * var(--subtitle-scale, 1));
  color: #666;
  margin-top: 30px;
  line-height: 1.6;
  max-width: 280px;
}

.cover-neon-dark .bottom-section {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.cover-neon-dark .author {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 4px;
  color: #00FF88;
}

.cover-neon-dark .handle {
  font-size: 11px;
  color: #444;
}'
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_styled_products_funnel_id ON styled_products(funnel_id);
CREATE INDEX IF NOT EXISTS idx_styled_products_lead_magnet_id ON styled_products(lead_magnet_id);
CREATE INDEX IF NOT EXISTS idx_cover_templates_is_default ON cover_templates(is_default);
