-- Add arbitrage_total_bet_amount column to user_preferences table
ALTER TABLE user_preferences
ADD COLUMN arbitrage_total_bet_amount NUMERIC DEFAULT 200;

COMMENT ON COLUMN user_preferences.arbitrage_total_bet_amount IS 'Default total bet amount to distribute between both sides of arbitrage opportunities';

