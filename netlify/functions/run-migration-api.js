// /netlify/functions/run-migration-api.js
// Runs migration using Supabase Management API
// This uses the access token to run SQL directly
// RELEVANT FILES: supabase/migrations/add-update-features.sql

const migrationSql = `
-- PROFILES TABLE ADDITIONS
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_handle TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_languages TEXT[] DEFAULT ARRAY['English', 'French', 'Spanish', 'Indonesian', 'German'];

-- FUNNELS TABLE ADDITIONS
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English';
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS front_end_tldr JSONB;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS bump_tldr JSONB;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS upsell_1_tldr JSONB;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS upsell_2_tldr JSONB;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS front_end_cross_promo TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS bump_cross_promo TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS upsell_1_cross_promo TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS upsell_2_cross_promo TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS front_end_marketplace_title TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS front_end_etsy_description TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS front_end_normal_description TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS front_end_marketplace_tags TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS bump_marketplace_title TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS bump_etsy_description TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS bump_normal_description TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS bump_marketplace_tags TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS upsell_1_marketplace_title TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS upsell_1_etsy_description TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS upsell_1_normal_description TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS upsell_1_marketplace_tags TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS upsell_2_marketplace_title TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS upsell_2_etsy_description TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS upsell_2_normal_description TEXT;
ALTER TABLE funnels ADD COLUMN IF NOT EXISTS upsell_2_marketplace_tags TEXT;

-- LEAD MAGNETS TABLE ADDITIONS
ALTER TABLE lead_magnets ADD COLUMN IF NOT EXISTS tldr JSONB;
ALTER TABLE lead_magnets ADD COLUMN IF NOT EXISTS marketplace_title TEXT;
ALTER TABLE lead_magnets ADD COLUMN IF NOT EXISTS etsy_description TEXT;
ALTER TABLE lead_magnets ADD COLUMN IF NOT EXISTS normal_description TEXT;
ALTER TABLE lead_magnets ADD COLUMN IF NOT EXISTS marketplace_tags TEXT;

-- NEW TABLE: EMAIL_SEQUENCES
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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own email sequences' AND tablename = 'email_sequences') THEN
    CREATE POLICY "Users can manage own email sequences" ON email_sequences FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_sequences_funnel_id ON email_sequences(funnel_id);
CREATE INDEX IF NOT EXISTS idx_email_sequences_user_id ON email_sequences(user_id);

-- NEW TABLE: BUNDLES
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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own bundles' AND tablename = 'bundles') THEN
    CREATE POLICY "Users can manage own bundles" ON bundles FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bundles_funnel_id ON bundles(funnel_id);
CREATE INDEX IF NOT EXISTS idx_bundles_user_id ON bundles(user_id);

-- EXISTING PRODUCTS TABLE ADDITIONS (for cross-promo TLDR)
ALTER TABLE existing_products ADD COLUMN IF NOT EXISTS tldr TEXT;

SELECT 'Migration complete!' as status;
`;

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef = 'psfgnelrxzdckucvytzj';

  if (!accessToken) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing SUPABASE_ACCESS_TOKEN' })
    };
  }

  try {
    // Use Supabase Management API to run SQL
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: migrationSql })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: `Management API error: ${response.status}`,
          details: errorText
        })
      };
    }

    const result = await response.json();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Migration complete! Added: language, TLDR, cross-promo, marketplace columns, email_sequences table, bundles table',
        result
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
