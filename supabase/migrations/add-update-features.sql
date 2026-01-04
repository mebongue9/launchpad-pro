-- /supabase/migrations/add-update-features.sql
-- Database migrations for Launchpad Pro major feature update
-- Adds: language support, TLDR, cross-promo, marketplace listings, email sequences, bundles
-- RELEVANT FILES: UPDATE-SPEC.md, src/hooks/useFunnels.jsx, src/hooks/useProfiles.jsx

-- ============================================
-- PROFILES TABLE ADDITIONS
-- ============================================

-- Profile branding fields for PDF covers
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_handle TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Favorite languages for quick selection
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_languages TEXT[] DEFAULT ARRAY['English', 'French', 'Spanish', 'Indonesian', 'German'];

-- ============================================
-- FUNNELS TABLE ADDITIONS
-- ============================================

-- Language selection for all AI content
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English';

-- TLDR columns (JSONB - contains what_it_is, who_its_for, problem_solved, whats_inside, key_benefits, cta)
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS front_end_tldr JSONB;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS bump_tldr JSONB;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS upsell_1_tldr JSONB;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS upsell_2_tldr JSONB;

-- Cross-promo paragraphs (push to user's existing product)
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS front_end_cross_promo TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS bump_cross_promo TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS upsell_1_cross_promo TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS upsell_2_cross_promo TEXT;

-- Marketplace columns for FRONT-END
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS front_end_marketplace_title TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS front_end_etsy_description TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS front_end_normal_description TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS front_end_marketplace_tags TEXT;

-- Marketplace columns for BUMP
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS bump_marketplace_title TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS bump_etsy_description TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS bump_normal_description TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS bump_marketplace_tags TEXT;

-- Marketplace columns for UPSELL 1
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS upsell_1_marketplace_title TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS upsell_1_etsy_description TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS upsell_1_normal_description TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS upsell_1_marketplace_tags TEXT;

-- Marketplace columns for UPSELL 2
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS upsell_2_marketplace_title TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS upsell_2_etsy_description TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS upsell_2_normal_description TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS upsell_2_marketplace_tags TEXT;

-- ============================================
-- LEAD MAGNETS TABLE ADDITIONS
-- ============================================

ALTER TABLE lead_magnets ADD COLUMN IF NOT EXISTS tldr JSONB;
ALTER TABLE lead_magnets ADD COLUMN IF NOT EXISTS marketplace_title TEXT;
ALTER TABLE lead_magnets ADD COLUMN IF NOT EXISTS etsy_description TEXT;
ALTER TABLE lead_magnets ADD COLUMN IF NOT EXISTS normal_description TEXT;
ALTER TABLE lead_magnets ADD COLUMN IF NOT EXISTS marketplace_tags TEXT;

-- ============================================
-- NEW TABLE: EMAIL_SEQUENCES
-- ============================================

CREATE TABLE IF NOT EXISTS email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  funnel_id UUID REFERENCES funnels(id) ON DELETE CASCADE NOT NULL,

  -- Sequence type: 'lead_magnet' or 'front_end'
  sequence_type TEXT NOT NULL,

  -- Email 1
  email_1_subject TEXT,
  email_1_preview TEXT,
  email_1_body TEXT,

  -- Email 2
  email_2_subject TEXT,
  email_2_preview TEXT,
  email_2_body TEXT,

  -- Email 3
  email_3_subject TEXT,
  email_3_preview TEXT,
  email_3_body TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on email_sequences
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can only manage their own email sequences
DROP POLICY IF EXISTS "Users can manage own email sequences" ON email_sequences;
CREATE POLICY "Users can manage own email sequences"
ON email_sequences FOR ALL
USING (auth.uid() = user_id);

-- Index for faster lookups by funnel
CREATE INDEX IF NOT EXISTS idx_email_sequences_funnel_id ON email_sequences(funnel_id);
CREATE INDEX IF NOT EXISTS idx_email_sequences_user_id ON email_sequences(user_id);

-- ============================================
-- NEW TABLE: BUNDLES
-- ============================================

CREATE TABLE IF NOT EXISTS bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  funnel_id UUID REFERENCES funnels(id) ON DELETE CASCADE NOT NULL,

  -- Bundle marketplace listings
  title TEXT,
  etsy_description TEXT,
  normal_description TEXT,
  tags TEXT,

  -- Pricing info
  bundle_price DECIMAL(10,2),
  total_individual_price DECIMAL(10,2),
  savings DECIMAL(10,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on bundles
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can only manage their own bundles
DROP POLICY IF EXISTS "Users can manage own bundles" ON bundles;
CREATE POLICY "Users can manage own bundles"
ON bundles FOR ALL
USING (auth.uid() = user_id);

-- Index for faster lookups by funnel
CREATE INDEX IF NOT EXISTS idx_bundles_funnel_id ON bundles(funnel_id);
CREATE INDEX IF NOT EXISTS idx_bundles_user_id ON bundles(user_id);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN profiles.tagline IS 'Business tagline shown on PDF covers';
COMMENT ON COLUMN profiles.social_handle IS 'Social media handle (e.g., @username)';
COMMENT ON COLUMN profiles.photo_url IS 'Profile photo URL for PDF covers';
COMMENT ON COLUMN profiles.logo_url IS 'Business logo URL for PDF covers';
COMMENT ON COLUMN profiles.favorite_languages IS 'User favorite languages for quick selection';

COMMENT ON COLUMN funnels.language IS 'Output language for all AI-generated content';
COMMENT ON COLUMN funnels.front_end_tldr IS 'TLDR summary JSON for front-end product';
COMMENT ON COLUMN funnels.front_end_cross_promo IS 'Cross-promotion paragraph for front-end';
COMMENT ON COLUMN funnels.front_end_marketplace_title IS 'Etsy-optimized title (140 chars max)';
COMMENT ON COLUMN funnels.front_end_etsy_description IS 'Short Etsy description (500-800 chars)';
COMMENT ON COLUMN funnels.front_end_normal_description IS 'Long Gumroad description (1500-2500 chars)';
COMMENT ON COLUMN funnels.front_end_marketplace_tags IS '13 Etsy tags, comma-separated';

COMMENT ON TABLE email_sequences IS 'Email sequences for funnels (lead_magnet and front_end types)';
COMMENT ON TABLE bundles IS 'Bundle listings combining all 4 funnel products';
