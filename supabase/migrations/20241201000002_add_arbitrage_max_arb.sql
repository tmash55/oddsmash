-- Add arbitrage_max_arb column to user_preferences table
ALTER TABLE user_preferences
ADD COLUMN arbitrage_max_arb NUMERIC DEFAULT 20;

-- Add comment for documentation
COMMENT ON COLUMN user_preferences.arbitrage_max_arb IS 'Maximum arbitrage percentage filter for arbitrage opportunities';

