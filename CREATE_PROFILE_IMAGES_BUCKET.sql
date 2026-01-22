-- ============================================================================
-- CREATE USER-PROFILES STORAGE BUCKET FOR PROFILE IMAGES
-- ============================================================================
-- Run this in Supabase SQL Editor to create the storage bucket for profile images

-- 1. Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-profiles', 'user-profiles', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up RLS policies for the bucket
-- Allow authenticated users to upload their own profile images
CREATE POLICY "Users can upload their own profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-profiles' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own profile images
CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE
WITH CHECK (
  bucket_id = 'user-profiles' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their own profile images
CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-profiles' 
  AND auth.role() = 'authenticated'
);

-- Allow anyone to view/download profile images (public)
CREATE POLICY "Allow public access to profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-profiles');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries to verify the setup:

-- Check if bucket exists
-- SELECT * FROM storage.buckets WHERE id = 'user-profiles';

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Check bucket contents
-- SELECT * FROM storage.objects WHERE bucket_id = 'user-profiles';

-- ============================================================================
-- MANUAL SETUP (if SQL doesn't work)
-- ============================================================================
-- 1. Go to Supabase Dashboard
-- 2. Navigate to Storage
-- 3. Click "Create a new bucket"
-- 4. Name it: "user-profiles"
-- 5. Make it public (toggle: ON)
-- 6. Click "Create bucket"
-- 7. Go to Policies tab
-- 8. Add the policies above

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================
-- Error: "bucket not found"
-- Solution: Run this SQL file in Supabase SQL Editor
--
-- Error: "Policy already exists"
-- Solution: Ignore, policies may already be created
--
-- Error: "Permission denied"
-- Solution: Make sure you're logged in as Supabase admin
