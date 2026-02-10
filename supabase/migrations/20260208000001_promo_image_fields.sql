-- Add promotional image fields to profiles table
-- These fields enable a promotional banner on the About the Author page of PDFs

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS promo_image_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS promo_image_link TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS promo_image_cta TEXT;
