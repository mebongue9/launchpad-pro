// Database setup script - creates tables and RLS policies
// Run with: node --dns-result-order=ipv4first scripts/setup-database.mjs

import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import pg from 'pg';
const { Client } = pg;

// Using pooler session mode (port 5432 on pooler)
const client = new Client({
  host: 'aws-0-us-west-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.psfgnelrxzdckucvytzj',
  password: 'x0KsWuF*aAv^$OxN',
  ssl: { rejectUnauthorized: false }
});

const sql = `
-- ============================================
-- LAUNCHPAD PRO DATABASE SCHEMA
-- Phase 1: Foundation tables
-- ============================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- Stores user business profiles with branding
-- ============================================
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

-- ============================================
-- AUDIENCES TABLE
-- Stores target audience definitions
-- ============================================
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

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);
CREATE INDEX IF NOT EXISTS audiences_user_id_idx ON audiences(user_id);

-- Success message
SELECT 'Database setup complete!' as status;
`;

async function setup() {
  try {
    console.log('Connecting to Supabase database...');
    await client.connect();
    console.log('Connected successfully!');

    console.log('Running schema setup...');
    const result = await client.query(sql);
    console.log('Schema setup complete!');
    console.log(result);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
    console.log('Connection closed.');
  }
}

setup();
