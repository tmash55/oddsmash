-- Updated database schema with correct foreign key references
CREATE TABLE player_odds_history (
  id BIGSERIAL PRIMARY KEY,
  
  -- Vendor identification
  vendor_event_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  
  -- Foreign key references to existing tables
  player_id INTEGER NOT NULL REFERENCES mlb_players(player_id) ON DELETE CASCADE,
  player_name TEXT NOT NULL, -- Denormalized for performance
  mlb_game_id INTEGER NOT NULL REFERENCES mlb_games(game_id) ON DELETE CASCADE,
  market TEXT NOT NULL,
  line DECIMAL(4,1) NOT NULL,
  
  -- Player team context
  team TEXT NOT NULL,
  is_home BOOLEAN NOT NULL,
  
  -- Sportsbook specific odds
  sportsbook TEXT NOT NULL,
  over_price INTEGER,
  under_price INTEGER,
  over_link TEXT,
  under_link TEXT,
  over_sid TEXT,
  under_sid TEXT,
  is_alternative BOOLEAN NOT NULL DEFAULT false,
  
  -- Game metadata (denormalized from mlb_games for performance)
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  commence_time TIMESTAMPTZ,
  sport_key TEXT DEFAULT 'baseball_mlb',
  
  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_vendor_odds UNIQUE (vendor_event_id, player_id, market, line, sportsbook, created_at)
);

-- Optimized indexes with foreign key support
CREATE INDEX idx_player_odds_player_fk ON player_odds_history (player_id);
CREATE INDEX idx_player_odds_game_fk ON player_odds_history (mlb_game_id);
CREATE INDEX idx_vendor_event_current ON player_odds_history (vendor_event_id, updated_at DESC);
CREATE INDEX idx_player_market_main ON player_odds_history (player_id, market, is_alternative, updated_at DESC);
CREATE INDEX idx_game_odds_current ON player_odds_history (mlb_game_id, updated_at DESC);
CREATE INDEX idx_main_lines_only ON player_odds_history (is_alternative, market, updated_at DESC) WHERE is_alternative = false;
CREATE INDEX idx_alternative_lines ON player_odds_history (player_id, market, line, is_alternative) WHERE is_alternative = true;
CREATE INDEX idx_sportsbook_alternatives ON player_odds_history (sportsbook, is_alternative, updated_at DESC); 