-- ============================================================================
-- SUPABASE STORAGE SETUP FOR MESSAGE ATTACHMENTS
-- ============================================================================

-- Create storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES FOR STORAGE
-- ============================================================================

-- Users can upload attachments (authenticated users only)
CREATE POLICY "Users can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'message-attachments' 
  AND auth.uid() IS NOT NULL
);

-- Anyone can view attachments (since messages are shared between users)
CREATE POLICY "Users can view attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'message-attachments');

-- Users can delete their own attachments
CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'message-attachments' 
  AND auth.uid() IS NOT NULL
);
