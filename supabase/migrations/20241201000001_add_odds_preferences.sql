-- Add odds-specific preferences to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN include_alternates BOOLEAN DEFAULT false,
ADD COLUMN odds_selected_books TEXT[] DEFAULT '{}',
ADD COLUMN odds_column_order TEXT[] DEFAULT '{"entity", "event", "best-line", "average-line"}',
ADD COLUMN odds_sportsbook_order TEXT[] DEFAULT '{}',
ADD COLUMN odds_column_highlighting BOOLEAN DEFAULT true,
ADD COLUMN odds_show_best_line BOOLEAN DEFAULT true,
ADD COLUMN odds_show_average_line BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN user_preferences.include_alternates IS 'Whether to show alternate lines in odds tables';
COMMENT ON COLUMN user_preferences.odds_selected_books IS 'Selected sportsbooks for odds screen filtering';
COMMENT ON COLUMN user_preferences.odds_column_order IS 'Custom column order for odds tables';
COMMENT ON COLUMN user_preferences.odds_sportsbook_order IS 'Custom sportsbook column order for odds tables';
COMMENT ON COLUMN user_preferences.odds_column_highlighting IS 'Whether to highlight best odds with green backgrounds';
COMMENT ON COLUMN user_preferences.odds_show_best_line IS 'Whether to show the best line column in odds tables';
COMMENT ON COLUMN user_preferences.odds_show_average_line IS 'Whether to show the average line column in odds tables';

