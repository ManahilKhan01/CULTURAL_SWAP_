-- ============================================================================
-- ALTER SWAPS TABLE - Add session tracking fields
-- ============================================================================

-- Add total_hours and remaining_hours for time tracking
ALTER TABLE swaps ADD COLUMN IF NOT EXISTS total_hours INTEGER DEFAULT 0;
ALTER TABLE swaps ADD COLUMN IF NOT EXISTS remaining_hours INTEGER DEFAULT 0;

-- Add partner_name for easier display (denormalized for performance)
ALTER TABLE swaps ADD COLUMN IF NOT EXISTS partner_name TEXT;

-- Update existing swaps to set remaining_hours equal to total_hours if not set
UPDATE swaps 
SET remaining_hours = total_hours 
WHERE remaining_hours = 0 AND total_hours > 0;
