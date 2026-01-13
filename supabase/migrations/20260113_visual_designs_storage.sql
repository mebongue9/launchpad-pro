-- Visual Designs Storage Bucket
-- Created: January 13, 2026
-- Purpose: Store generated PDFs and cover images

-- Create storage bucket for visual designs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'visual-designs',
  'visual-designs',
  TRUE,  -- Public bucket for easy access
  52428800,  -- 50MB limit
  ARRAY['application/pdf', 'image/png', 'image/jpeg']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for visual-designs bucket

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'visual-designs' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow service role to upload anywhere (for server-side generation)
CREATE POLICY "Service role can upload anywhere"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'visual-designs' AND
  auth.role() = 'service_role'
);

-- Allow anyone to read files (public bucket)
CREATE POLICY "Anyone can read visual designs"
ON storage.objects FOR SELECT
USING (bucket_id = 'visual-designs');

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'visual-designs' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow service role to delete any file
CREATE POLICY "Service role can delete any file"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'visual-designs' AND
  auth.role() = 'service_role'
);
