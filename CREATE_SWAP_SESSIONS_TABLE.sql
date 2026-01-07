-- ============================================================================
-- CREATE SWAP SESSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS swap_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    swap_id UUID NOT NULL REFERENCES swaps(id) ON DELETE CASCADE,
    meet_link TEXT NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_swap_sessions_swap_id ON swap_sessions(swap_id);
CREATE INDEX IF NOT EXISTS idx_swap_sessions_status ON swap_sessions(status);
CREATE INDEX IF NOT EXISTS idx_swap_sessions_created_by ON swap_sessions(created_by);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE swap_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view sessions for swaps they're involved in
CREATE POLICY "swap_sessions_view_own" ON swap_sessions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM swaps 
      WHERE swaps.id = swap_sessions.swap_id 
      AND (swaps.user_id = auth.uid() OR swaps.partner_id = auth.uid())
    )
  );

-- Users can create sessions for swaps they're involved in
CREATE POLICY "swap_sessions_insert_own" ON swap_sessions FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM swaps 
      WHERE swaps.id = swap_id 
      AND (swaps.user_id = auth.uid() OR swaps.partner_id = auth.uid())
    )
  );

-- Users can update sessions for swaps they're involved in
CREATE POLICY "swap_sessions_update_own" ON swap_sessions FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM swaps 
      WHERE swaps.id = swap_sessions.swap_id 
      AND (swaps.user_id = auth.uid() OR swaps.partner_id = auth.uid())
    )
  );

-- ============================================================================
-- TRIGGER: Update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_swap_sessions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER swap_sessions_timestamp_trigger
BEFORE UPDATE ON swap_sessions
FOR EACH ROW
EXECUTE FUNCTION update_swap_sessions_timestamp();
