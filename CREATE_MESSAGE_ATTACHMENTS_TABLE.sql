-- ============================================================================
-- CREATE MESSAGE ATTACHMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON message_attachments(message_id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- Users can view attachments for messages they sent or received
CREATE POLICY "message_attachments_view_own" ON message_attachments FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM messages 
      WHERE messages.id = message_attachments.message_id 
      AND (messages.sender_id = auth.uid() OR messages.receiver_id = auth.uid())
    )
  );

-- Users can insert attachments for messages they're sending
CREATE POLICY "message_attachments_insert_own" ON message_attachments FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages 
      WHERE messages.id = message_id 
      AND messages.sender_id = auth.uid()
    )
  );

-- Users can delete their own attachments
CREATE POLICY "message_attachments_delete_own" ON message_attachments FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM messages 
      WHERE messages.id = message_attachments.message_id 
      AND messages.sender_id = auth.uid()
    )
  );
