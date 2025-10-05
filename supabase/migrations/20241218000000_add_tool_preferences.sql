-- Add tool-specific preferences to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN arbitrage_selected_books TEXT[] DEFAULT '{}',
ADD COLUMN arbitrage_min_arb DECIMAL DEFAULT 0,
ADD COLUMN arbitrage_search_query TEXT DEFAULT '',
ADD COLUMN ev_selected_books TEXT[] DEFAULT '{}',
ADD COLUMN ev_min_odds INTEGER DEFAULT -200,
ADD COLUMN ev_bankroll DECIMAL DEFAULT 1000,
ADD COLUMN ev_kelly_percent DECIMAL DEFAULT 0.5,
ADD COLUMN ev_search_query TEXT DEFAULT '';

-- Add comments for documentation
COMMENT ON COLUMN user_preferences.arbitrage_selected_books IS 'Selected sportsbooks for arbitrage filtering';
COMMENT ON COLUMN user_preferences.arbitrage_min_arb IS 'Minimum arbitrage percentage threshold';
COMMENT ON COLUMN user_preferences.arbitrage_search_query IS 'Last search query used in arbitrage tool';
COMMENT ON COLUMN user_preferences.ev_selected_books IS 'Selected sportsbooks for EV filtering';
COMMENT ON COLUMN user_preferences.ev_min_odds IS 'Minimum odds threshold for EV tool';
COMMENT ON COLUMN user_preferences.ev_bankroll IS 'User bankroll for Kelly criterion calculations';
COMMENT ON COLUMN user_preferences.ev_kelly_percent IS 'Kelly percentage for stake calculations';
COMMENT ON COLUMN user_preferences.ev_search_query IS 'Last search query used in EV tool';
