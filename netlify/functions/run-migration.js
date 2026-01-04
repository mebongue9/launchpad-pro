// /netlify/functions/run-migration.js
// Runs the major feature update migration
// Adds: language support, TLDR, cross-promo, marketplace listings, email sequences, bundles
// RELEVANT FILES: supabase/migrations/add-update-features.sql

import pg from 'pg';
const { Client } = pg;

const migrationSql = `
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

-- TLDR columns (JSONB)
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS front_end_tldr JSONB;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS bump_tldr JSONB;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS upsell_1_tldr JSONB;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS upsell_2_tldr JSONB;

-- Cross-promo paragraphs
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
  sequence_type TEXT NOT NULL,
  email_1_subject TEXT,
  email_1_preview TEXT,
  email_1_body TEXT,
  email_2_subject TEXT,
  email_2_preview TEXT,
  email_2_body TEXT,
  email_3_subject TEXT,
  email_3_preview TEXT,
  email_3_body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own email sequences" ON email_sequences;
CREATE POLICY "Users can manage own email sequences"
ON email_sequences FOR ALL
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_email_sequences_funnel_id ON email_sequences(funnel_id);
CREATE INDEX IF NOT EXISTS idx_email_sequences_user_id ON email_sequences(user_id);

-- ============================================
-- NEW TABLE: BUNDLES
-- ============================================

CREATE TABLE IF NOT EXISTS bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  funnel_id UUID REFERENCES funnels(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  etsy_description TEXT,
  normal_description TEXT,
  tags TEXT,
  bundle_price DECIMAL(10,2),
  total_individual_price DECIMAL(10,2),
  savings DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own bundles" ON bundles;
CREATE POLICY "Users can manage own bundles"
ON bundles FOR ALL
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_bundles_funnel_id ON bundles(funnel_id);
CREATE INDEX IF NOT EXISTS idx_bundles_user_id ON bundles(user_id);

SELECT 'Migration complete - Major feature update applied!' as status;
`;

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const connectionString = `postgresql://postgres.psfgnelrxzdckucvytzj:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const result = await client.query(migrationSql);
    await client.end();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Migration complete - Major feature update applied!',
        details: 'Added: language, TLDR, cross-promo, marketplace columns, email_sequences table, bundles table'
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
}
