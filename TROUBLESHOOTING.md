# Launchpad Pro - Troubleshooting Log

## Session: January 2, 2026

### Issue 1: 403 Forbidden on Profiles Table
**Symptom:** Users get 403 error when trying to create/read profiles
```
https://psfgnelrxzdckucvytzj.supabase.co/rest/v1/profiles?select=* 403 (Forbidden)
```

**Root Cause:** Row Level Security (RLS) policies were not set up on the profiles table.

**Solution:** Run this SQL in Supabase SQL Editor:
```sql
-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
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
```

---

### Issue 2: 400 Bad Request on File Upload
**Symptom:** Uploading profile photos or logos fails with 400 error
```
https://psfgnelrxzdckucvytzj.supabase.co/storage/v1/object/logos/... 400 (Bad Request)
```

**Root Cause:**
1. Storage buckets (photos, logos) didn't exist
2. Storage RLS policies were not configured

**Solution:**
1. Create buckets via Supabase client (done programmatically)
2. Run this SQL to set up storage policies:
```sql
-- Ensure buckets exist and are public
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload logos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access
CREATE POLICY "Public read photos" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'photos');

CREATE POLICY "Public read logos" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'logos');
```

---

### Issue 3: Products "Add Product" Button Does Nothing
**Symptom:** Clicking "Add Product" button has no effect, modal doesn't open.

**Root Cause:** Code used `showToast` but the Toast component exports `addToast`. This caused a silent JavaScript error.

**Solution:** Replace `showToast` with `addToast` in all files:
- src/pages/ExistingProducts.jsx
- src/pages/Settings.jsx
- src/pages/FunnelBuilder.jsx
- src/pages/History.jsx
- src/pages/VisualBuilder.jsx
- src/pages/LeadMagnetBuilder.jsx
- src/components/existing-products/ExistingProductForm.jsx

---

### Issue 4: Missing Columns in existing_products Table
**Symptom:** "Could not find the 'url' column" error, or modal doesn't close after save.

**Solution:** Run this SQL:
```sql
ALTER TABLE existing_products ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE existing_products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE existing_products ADD COLUMN IF NOT EXISTS price DECIMAL;
ALTER TABLE existing_products ADD COLUMN IF NOT EXISTS format TEXT;
ALTER TABLE existing_products ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id);
```

---

### Issue 5: Database Setup Function Not Working
**Symptom:** Calling `/netlify/functions/setup-database` returns "Tenant or user not found"

**Root Cause:** The Supabase pooler connection string doesn't work from serverless functions.

**Workaround:** Run database setup SQL directly in Supabase SQL Editor instead of using the serverless function.

---

## Current State (After Fixes)

### Working Features:
- [x] User authentication (login)
- [x] Profile creation
- [x] Profile editing
- [x] Profile deletion
- [x] Profile photo upload
- [x] Logo upload
- [x] Audience creation
- [x] Audience editing
- [x] Audience deletion
- [x] Product creation
- [x] Product editing
- [ ] Funnel Builder (to be tested)
- [ ] Lead Magnet Builder (to be tested)
- [ ] Visual Builder (to be tested)

### Database Tables:
- `profiles` - Has RLS policies configured ✓
- `audiences` - Has RLS policies configured ✓
- `existing_products` - Working ✓ (added url, description, price, format, profile_id columns)
- `funnels` - Needs verification
- `lead_magnets` - Needs verification
- `creations` - Needs verification

### Storage Buckets:
- `photos` - Created with public read, authenticated write
- `logos` - Created with public read, authenticated write

### Environment Variables (Netlify):
- SUPABASE_URL ✓
- SUPABASE_ANON_KEY ✓
- SUPABASE_SERVICE_ROLE_KEY ✓
- ANTHROPIC_API_KEY ✓
- OPENAI_API_KEY ✓
- SUPABASE_DB_PASSWORD ✓

### Deployed URLs:
- **Live App:** https://launchpad-pro-app.netlify.app
- **GitHub:** https://github.com/mebongue9/launchpad-pro

### Admin Credentials:
- Email: mebongue@hotmail.com
- Password: (stored securely by user)

---

## Quick Recovery Commands

### If profiles stop working:
Run the profiles RLS SQL above in Supabase SQL Editor.

### If storage stops working:
Run the storage policies SQL above in Supabase SQL Editor.

### If you need to redeploy:
```bash
cd /Users/martinebongue/Desktop/claude\ code\ project\ 1/launchpad-pro
npm run build
NETLIFY_AUTH_TOKEN=nfp_r4H77K8cgV8hPm1CS5d7nmTfZwyMGvMh6ca6 npx netlify-cli deploy --prod --dir=dist --site=207db463-6d98-4aef-b664-7c6542a8f080
```

### If you need to push to GitHub:
```bash
cd /Users/martinebongue/Desktop/claude\ code\ project\ 1/launchpad-pro
git add -A && git commit -m "Your message" && git push origin main
```
