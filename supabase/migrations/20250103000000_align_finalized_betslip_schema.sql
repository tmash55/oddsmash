-- Align finalized_betslip_selections schema with scanned_betslip_selections
-- This migration adds missing fields and renames existing ones for consistency

-- 1. Add sport and market display fields to finalized_betslip_selections
ALTER TABLE finalized_betslip_selections 
  ADD COLUMN IF NOT EXISTS sport TEXT,
  ADD COLUMN IF NOT EXISTS market TEXT;

-- 2. Rename finalized_odds_data to current_odds for consistency
ALTER TABLE finalized_betslip_selections 
  RENAME COLUMN finalized_odds_data TO current_odds;

-- 3. Convert original_odds_data from JSONB to TEXT to match scanned format
-- First add a new TEXT column
ALTER TABLE finalized_betslip_selections 
  ADD COLUMN IF NOT EXISTS original_odds_text TEXT;

-- Update the new column with stringified version of JSONB data
UPDATE finalized_betslip_selections 
SET original_odds_text = original_odds_data::text 
WHERE original_odds_data IS NOT NULL;

-- Drop the old JSONB column and rename the new one
ALTER TABLE finalized_betslip_selections 
  DROP COLUMN IF EXISTS original_odds_data,
  RENAME COLUMN original_odds_text TO original_odds;

-- 4. Add sportsbook field to finalized_betslips main table for consistency
ALTER TABLE finalized_betslips 
  ADD COLUMN IF NOT EXISTS sportsbook TEXT;

-- 5. Add indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_finalized_betslip_selections_sport 
  ON finalized_betslip_selections(sport);

CREATE INDEX IF NOT EXISTS idx_finalized_betslip_selections_market 
  ON finalized_betslip_selections(market);

-- 6. Update column comments
COMMENT ON COLUMN finalized_betslip_selections.sport IS 'Sport display name (e.g., "MLB", "NBA")';
COMMENT ON COLUMN finalized_betslip_selections.market IS 'Market display name (e.g., "Home Runs", "Points")';
COMMENT ON COLUMN finalized_betslip_selections.current_odds IS 'Current/fresh odds from various sportsbooks (renamed from finalized_odds_data)';
COMMENT ON COLUMN finalized_betslip_selections.original_odds IS 'Original odds as text (converted from JSONB for consistency with scanned_betslips)'; 