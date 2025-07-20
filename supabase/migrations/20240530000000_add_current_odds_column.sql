-- Add current_odds and last_odds_update columns to betslip_selections
ALTER TABLE betslip_selections 
ADD COLUMN IF NOT EXISTS current_odds JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS last_odds_update TIMESTAMPTZ;

-- Create index for efficient querying of selections needing odds updates
CREATE INDEX IF NOT EXISTS idx_betslip_selections_last_odds_update 
ON betslip_selections(last_odds_update);

-- Add helpful comments
COMMENT ON COLUMN betslip_selections.current_odds IS 'Current odds from various sportsbooks';
COMMENT ON COLUMN betslip_selections.last_odds_update IS 'When the current odds were last updated'; 