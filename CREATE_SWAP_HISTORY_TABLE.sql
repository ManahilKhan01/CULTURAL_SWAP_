-- ============================================================================
-- CREATE SWAP HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS swap_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    swap_id UUID NOT NULL REFERENCES swaps(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    activity_type VARCHAR(50) NOT NULL, -- message, session, file_exchange, status_change
    description TEXT NOT NULL,
    metadata JSONB, -- flexible field for additional data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_swap_history_swap_id ON swap_history(swap_id);
CREATE INDEX IF NOT EXISTS idx_swap_history_user_id ON swap_history(user_id);
CREATE INDEX IF NOT EXISTS idx_swap_history_activity_type ON swap_history(activity_type);
CREATE INDEX IF NOT EXISTS idx_swap_history_created_at ON swap_history(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE swap_history ENABLE ROW LEVEL SECURITY;

-- Users can view history for swaps they're involved in
CREATE POLICY "swap_history_view_own" ON swap_history FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM swaps 
      WHERE swaps.id = swap_history.swap_id 
      AND (swaps.user_id = auth.uid() OR swaps.partner_id = auth.uid())
    )
  );

-- Users can insert history for swaps they're involved in
CREATE POLICY "swap_history_insert_own" ON swap_history FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM swaps 
      WHERE swaps.id = swap_id 
      AND (swaps.user_id = auth.uid() OR swaps.partner_id = auth.uid())
    )
  );
