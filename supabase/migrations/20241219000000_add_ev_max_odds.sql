-- Add ev_max_odds column to user_preferences table
ALTER TABLE user_preferences
ADD COLUMN ev_max_odds INTEGER DEFAULT 200;





