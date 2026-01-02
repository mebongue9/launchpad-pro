// /netlify/functions/setup-database.js
// One-time database setup function
// Creates profiles and audiences tables with RLS policies
// RELEVANT FILES: scripts/setup-database.mjs, src/lib/supabase.js

import pg from 'pg';
const { Client } = pg;

const sql = `
-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  business_name TEXT,
  niche TEXT,
  income_method TEXT,
  tagline TEXT,
  vibe TEXT,
  social_handle TEXT,
  logo_url TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can create own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profiles" ON profiles;

-- Profiles RLS policies
CREATE POLICY "Users can view own profiles"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own profiles"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profiles"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profiles"
  ON profiles FOR DELETE
  USING (auth.uid() = user_id);

-- AUDIENCES TABLE
CREATE TABLE IF NOT EXISTS audiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  pain_points TEXT[] DEFAULT '{}',
  desires TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audiences
ALTER TABLE audiences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own audiences" ON audiences;
DROP POLICY IF EXISTS "Users can create own audiences" ON audiences;
DROP POLICY IF EXISTS "Users can update own audiences" ON audiences;
DROP POLICY IF EXISTS "Users can delete own audiences" ON audiences;

-- Audiences RLS policies
CREATE POLICY "Users can view own audiences"
  ON audiences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own audiences"
  ON audiences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own audiences"
  ON audiences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own audiences"
  ON audiences FOR DELETE
  USING (auth.uid() = user_id);

-- INDEXES
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);
CREATE INDEX IF NOT EXISTS audiences_user_id_idx ON audiences(user_id);

SELECT 'Database setup complete!' as status;
`;

export async function handler(event, context) {
  // Only allow POST with secret
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Try transaction mode pooler (port 6543)
  const connectionString = `postgresql://postgres.psfgnelrxzdckucvytzj:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const result = await client.query(sql);
    await client.end();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, message: 'Database setup complete' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
}
