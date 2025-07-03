-- Create player name lookup table for efficient matching between different data sources
CREATE TABLE player_name_lookup (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Source information (where this name comes from)
    odds_name TEXT NOT NULL, -- Name as it appears in odds API
    matched_name TEXT, -- Name as it appears in our hit rate database
    player_id INTEGER, -- Our internal player ID (if matched)
    
    -- Matching metadata
    confidence_score INTEGER NOT NULL DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
    match_status TEXT NOT NULL DEFAULT 'pending' CHECK (match_status IN ('pending', 'matched', 'no_match', 'manual_review')),
    
    -- Additional context
    sport TEXT NOT NULL DEFAULT 'mlb',
    team_name TEXT,
    position TEXT,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    last_matched_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    UNIQUE(odds_name, sport) -- Each odds name per sport should only appear once
);

-- Create indexes for fast lookups
CREATE INDEX idx_player_name_lookup_odds_name ON player_name_lookup(odds_name);
CREATE INDEX idx_player_name_lookup_matched_name ON player_name_lookup(matched_name);
CREATE INDEX idx_player_name_lookup_player_id ON player_name_lookup(player_id);
CREATE INDEX idx_player_name_lookup_confidence ON player_name_lookup(confidence_score DESC);
CREATE INDEX idx_player_name_lookup_status ON player_name_lookup(match_status);
CREATE INDEX idx_player_name_lookup_sport ON player_name_lookup(sport);

-- Add RLS policies
ALTER TABLE player_name_lookup ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all lookup data
CREATE POLICY "Allow authenticated users to read player name lookups" ON player_name_lookup
    FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert new lookups
CREATE POLICY "Allow authenticated users to create player name lookups" ON player_name_lookup
    FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to update lookups
CREATE POLICY "Allow authenticated users to update player name lookups" ON player_name_lookup
    FOR UPDATE TO authenticated USING (true);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_player_name_lookup_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_player_name_lookup_updated_at
    BEFORE UPDATE ON player_name_lookup
    FOR EACH ROW
    EXECUTE FUNCTION update_player_name_lookup_updated_at();

-- Add some helpful comments
COMMENT ON TABLE player_name_lookup IS 'Lookup table for matching player names between odds API and hit rate database';
COMMENT ON COLUMN player_name_lookup.odds_name IS 'Player name as it appears in the odds API';
COMMENT ON COLUMN player_name_lookup.matched_name IS 'Player name as it appears in our hit rate database';
COMMENT ON COLUMN player_name_lookup.confidence_score IS 'Confidence score from 0-100 for the match quality';
COMMENT ON COLUMN player_name_lookup.match_status IS 'Status of the matching process'; 