-- Create enum for bet types
CREATE TYPE bet_type AS ENUM ('standard', 'player_prop');

-- Create enum for market types
CREATE TYPE market_type AS ENUM ('spread', 'moneyline', 'total', 'player_prop');

-- Create table for betslips
CREATE TABLE betslips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    shared_id TEXT UNIQUE,
    title TEXT,
    notes TEXT,
    is_public BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}'::jsonb
);

-- Create table for betslip selections
CREATE TABLE betslip_selections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    betslip_id UUID REFERENCES betslips(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Event/Game Data
    event_id TEXT NOT NULL,
    sport_key TEXT NOT NULL,
    commence_time TIMESTAMP WITH TIME ZONE NOT NULL,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    
    -- Market Data
    bet_type bet_type NOT NULL,
    market_type market_type NOT NULL,
    market_key TEXT NOT NULL,
    selection TEXT NOT NULL,
    
    -- Player Prop Specific Data (null for standard bets)
    player_name TEXT,
    player_team TEXT,
    line NUMERIC,
    
    -- Odds Data (store all sportsbook data as JSONB)
    odds_data JSONB NOT NULL,
    /* Example odds_data structure:
    {
      "fanduel": {
        "odds": 190,
        "line": 2.5,
        "sid": "10885583",
        "link": "https://...",
        "last_update": "2024-05-29T15:35:39Z"
      },
      "draftkings": {
        "odds": 185,
        "line": 2.5,
        "sid": "12345",
        "link": "https://...",
        "last_update": "2024-05-29T15:35:39Z"
      }
    }
    */
    
    -- Metadata
    status TEXT DEFAULT 'active',
    result TEXT,
    settled_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_selection_per_betslip UNIQUE (betslip_id, event_id, market_key, selection)
);

-- Create indexes for better query performance
CREATE INDEX idx_betslip_selections_betslip_id ON betslip_selections(betslip_id);
CREATE INDEX idx_betslips_user_id ON betslips(user_id);
CREATE INDEX idx_betslips_shared_id ON betslips(shared_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_betslips_updated_at
    BEFORE UPDATE ON betslips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_betslip_selections_updated_at
    BEFORE UPDATE ON betslip_selections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 