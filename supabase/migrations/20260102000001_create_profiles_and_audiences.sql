-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Profiles RLS policies
CREATE POLICY "Users can view own profiles" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own profiles" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profiles" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profiles" ON profiles FOR DELETE USING (auth.uid() = user_id);

-- Create audiences table
CREATE TABLE IF NOT EXISTS audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Audiences RLS policies
CREATE POLICY "Users can view own audiences" ON audiences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own audiences" ON audiences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own audiences" ON audiences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own audiences" ON audiences FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);
CREATE INDEX IF NOT EXISTS audiences_user_id_idx ON audiences(user_id);
