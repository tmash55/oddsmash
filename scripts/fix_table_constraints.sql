-- Remove the foreign key constraint on mlb_game_id
-- since mlb_games table only contains finished games, not upcoming games
ALTER TABLE player_odds_history 
DROP CONSTRAINT player_odds_history_mlb_game_id_fkey;

-- The mlb_game_id will still be an integer that references game IDs,
-- but we won't enforce the foreign key constraint since the referenced
-- games haven't been played yet and won't be in mlb_games table 