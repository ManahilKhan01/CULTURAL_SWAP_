-- ============================================================================
-- SUPABASE STORAGE SETUP FOR PROFILE IMAGES
-- ============================================================================

-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-profiles', 'user-profiles', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR STORAGE
-- ============================================================================

-- Users can upload their own profile images
CREATE POLICY "Users can upload own profile image"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-profiles' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Anyone can view profile images (public)
CREATE POLICY "Profile images are public"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-profiles');

-- Users can update their own profile images
CREATE POLICY "Users can update own profile image"
ON storage.objects FOR UPDATE
WITH CHECK (
  bucket_id = 'user-profiles' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own profile images
CREATE POLICY "Users can delete own profile image"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-profiles' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);
