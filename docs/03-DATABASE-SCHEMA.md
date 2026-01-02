# Database Schema (Supabase)

## Overview

All tables use Supabase's built-in `auth.users` for user management. Each table has a `user_id` column that references the authenticated user, with Row Level Security (RLS) policies to ensure users can only access their own data.

---

## Tables

### 1. profiles

Stores business/brand profiles. Users can have multiple profiles for different businesses.

```sql
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Identity
  name VARCHAR(100) NOT NULL,                    -- "Sarah Johnson"
  business_name VARCHAR(200),                    -- "Freedom Coaching"
  
  -- Branding
  tagline VARCHAR(500),                          -- "Escape the 9-5. Live Anywhere."
  website VARCHAR(200),                          -- "freedomcoaching.com"
  social_handle VARCHAR(100),                    -- "@sarah.freedom"
  logo_url TEXT,                                 -- Supabase storage URL
  photo_url TEXT,                                -- Supabase storage URL
  brand_colors JSONB,                            -- {"primary": "#22d3ee", "secondary": "#4ade80"}
  
  -- Business Info
  niche VARCHAR(200),                            -- "Business coaching for women"
  income_method TEXT,                            -- "Sells courses and 1:1 coaching"
  vibe VARCHAR(200),                             -- "Luxe, aspirational, freedom-focused"
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own profiles" ON profiles
  FOR ALL USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
```

---

### 2. audiences

Target audiences that can be reused across funnels and lead magnets.

```sql
CREATE TABLE audiences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Audience Details
  name VARCHAR(200) NOT NULL,                    -- "Burnt-out corporate women"
  description TEXT,                              -- Detailed description
  pain_points TEXT[],                            -- ARRAY of pain points
  desires TEXT[],                                -- ARRAY of desires/goals
  demographics JSONB,                            -- {"age_range": "30-45", "gender": "female"}
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE audiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own audiences" ON audiences
  FOR ALL USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_audiences_user_id ON audiences(user_id);
```

---

### 3. existing_products

Products the user already has (can be final upsell destination).

```sql
CREATE TABLE existing_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Product Info
  name VARCHAR(300) NOT NULL,                    -- "Traffic Avalanche Masterclass"
  description TEXT,                              -- What it is, what they get
  price DECIMAL(10,2),                           -- 497.00
  link VARCHAR(500),                             -- Sales page URL
  angle TEXT,                                    -- The hook/positioning
  format VARCHAR(100),                           -- "course", "coaching", "community"
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE existing_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own products" ON existing_products
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_existing_products_user_id ON existing_products(user_id);
CREATE INDEX idx_existing_products_profile_id ON existing_products(profile_id);
```

---

### 4. funnels

Generated funnel architectures.

```sql
CREATE TABLE funnels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  audience_id UUID REFERENCES audiences(id) ON DELETE SET NULL,
  existing_product_id UUID REFERENCES existing_products(id) ON DELETE SET NULL,
  
  -- Funnel Name
  name VARCHAR(300),                             -- "Pinterest Freedom Funnel"
  
  -- Funnel Products (JSONB for flexibility)
  front_end JSONB NOT NULL,
  -- {
  --   "name": "Pinterest Quick Start Checklist",
  --   "format": "checklist",
  --   "price": 17,
  --   "description": "...",
  --   "content": "..." (after generation)
  -- }
  
  bump JSONB,
  -- Same structure
  
  upsell_1 JSONB,
  upsell_2 JSONB,
  upsell_3 JSONB,                                -- May link to existing_product_id
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft',            -- draft, content_generated, complete
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own funnels" ON funnels
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_funnels_user_id ON funnels(user_id);
CREATE INDEX idx_funnels_profile_id ON funnels(profile_id);
CREATE INDEX idx_funnels_status ON funnels(status);
```

---

### 5. lead_magnets

Generated lead magnets.

```sql
CREATE TABLE lead_magnets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  funnel_id UUID REFERENCES funnels(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Lead Magnet Info
  name VARCHAR(300) NOT NULL,                    -- "The 7-Day Pinterest Blueprint"
  format VARCHAR(100),                           -- "guide", "checklist", "templates"
  topic VARCHAR(300),                            -- Topic/angle
  keyword VARCHAR(50),                           -- CTA keyword (e.g., "BLUEPRINT")
  
  -- Content
  content JSONB,                                 -- Full structured content
  -- {
  --   "title": "...",
  --   "subtitle": "...",
  --   "chapters": [
  --     {"title": "...", "content": "..."}
  --   ],
  --   "cta": {...}
  -- }
  
  -- Captions (for social media)
  caption_comment TEXT,                          -- Instagram/Facebook version
  caption_dm TEXT,                               -- TikTok/DM version
  
  -- Generated Files
  html_url TEXT,                                 -- Supabase storage URL
  pdf_url TEXT,                                  -- Supabase storage URL
  style_used VARCHAR(100),                       -- "apple-minimal"
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE lead_magnets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own lead magnets" ON lead_magnets
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_lead_magnets_user_id ON lead_magnets(user_id);
CREATE INDEX idx_lead_magnets_funnel_id ON lead_magnets(funnel_id);
CREATE INDEX idx_lead_magnets_profile_id ON lead_magnets(profile_id);
```

---

### 6. creations

History of all visual outputs (PDFs, presentations).

```sql
CREATE TABLE creations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Source Reference
  source_type VARCHAR(50) NOT NULL,              -- "funnel_product", "lead_magnet", "presentation"
  source_id UUID,                                -- ID of funnel or lead_magnet
  
  -- Creation Info
  name VARCHAR(300) NOT NULL,                    -- Display name
  description TEXT,                              -- What this is
  style VARCHAR(100),                            -- Style template used
  output_type VARCHAR(50),                       -- "pdf", "presentation", "both"
  
  -- Files
  html_url TEXT,
  pdf_url TEXT,
  thumbnail_url TEXT,                            -- Preview image
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE creations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own creations" ON creations
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_creations_user_id ON creations(user_id);
CREATE INDEX idx_creations_source_type ON creations(source_type);
CREATE INDEX idx_creations_created_at ON creations(created_at DESC);
```

---

### 7. topics_used

Tracks topics already used to prevent duplicates.

```sql
CREATE TABLE topics_used (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Topic Info
  topic VARCHAR(300) NOT NULL,
  product_name VARCHAR(300),                     -- Which product it was for
  lead_magnet_id UUID REFERENCES lead_magnets(id) ON DELETE SET NULL,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE topics_used ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own topics" ON topics_used
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_topics_used_user_id ON topics_used(user_id);
CREATE INDEX idx_topics_used_profile_id ON topics_used(profile_id);

-- Unique constraint to prevent exact duplicates
CREATE UNIQUE INDEX idx_topics_unique ON topics_used(profile_id, topic);
```

---

## Relationships Diagram

```
auth.users (Supabase built-in)
    │
    ├── profiles (1:many)
    │       │
    │       ├── audiences (many, via user_id)
    │       ├── existing_products (1:many)
    │       ├── funnels (1:many)
    │       │       │
    │       │       └── lead_magnets (1:many per funnel)
    │       │
    │       └── topics_used (1:many)
    │
    └── creations (1:many)
```

---

## Example Data

### Profile Example
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "auth-user-uuid",
  "name": "Sarah Johnson",
  "business_name": "Freedom Coaching",
  "tagline": "Escape the 9-5. Live Anywhere.",
  "website": "freedomcoaching.com",
  "social_handle": "@sarah.freedom",
  "logo_url": "https://xxx.supabase.co/storage/v1/object/logos/abc123.png",
  "photo_url": "https://xxx.supabase.co/storage/v1/object/photos/abc123.jpg",
  "niche": "Business coaching for women leaving corporate",
  "income_method": "Online courses and group coaching programs",
  "vibe": "Luxe, aspirational, freedom-focused"
}
```

### Funnel Example
```json
{
  "id": "funnel-uuid",
  "user_id": "auth-user-uuid",
  "profile_id": "profile-uuid",
  "audience_id": "audience-uuid",
  "name": "Pinterest Freedom Funnel",
  "front_end": {
    "name": "Pinterest Quick Start Checklist",
    "format": "checklist",
    "price": 17,
    "description": "The 10-point checklist to set up Pinterest for traffic",
    "content": null
  },
  "bump": {
    "name": "30 Viral Pin Templates",
    "format": "templates",
    "price": 9,
    "description": "Copy-paste Canva templates for pins that convert"
  },
  "upsell_1": {
    "name": "Pinterest SEO Masterguide",
    "format": "guide",
    "price": 47,
    "description": "Complete keyword strategy for Pinterest domination"
  },
  "upsell_2": {
    "name": "Pin Automation System",
    "format": "course",
    "price": 97,
    "description": "Set up automated pinning that runs 24/7"
  },
  "status": "draft"
}
```

---

## Supabase Setup Commands

Run these in the Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create all tables (copy from above)

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('outputs', 'outputs', true);

-- Storage policies
CREATE POLICY "Users can upload own logos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Repeat for photos and outputs buckets
```

---

## Migrations Strategy

For future schema changes:
1. Create migration files in `/supabase/migrations/`
2. Name format: `YYYYMMDDHHMMSS_description.sql`
3. Use Supabase CLI: `supabase db push`
