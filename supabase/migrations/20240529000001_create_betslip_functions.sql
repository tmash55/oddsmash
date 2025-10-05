-- Add is_default column to betslips table if it doesn't exist
ALTER TABLE betslips ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Create betslip for user
CREATE OR REPLACE FUNCTION create_betslip_for_user(
  p_user_id UUID,
  p_title TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_is_public BOOLEAN DEFAULT false,
  p_settings JSONB DEFAULT '{}'::jsonb,
  p_is_default BOOLEAN DEFAULT false
)
RETURNS betslips
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_betslip betslips;
  v_betslip_count INTEGER;
BEGIN
  -- Check if user has reached the limit of 5 betslips
  SELECT COUNT(*) INTO v_betslip_count
  FROM betslips
  WHERE user_id = p_user_id;
  
  IF v_betslip_count >= 5 THEN
    RAISE EXCEPTION 'User cannot have more than 5 betslips';
  END IF;

  -- If this betslip is being set as default, remove default from other betslips
  IF p_is_default THEN
    UPDATE betslips
    SET is_default = false
    WHERE user_id = p_user_id;
  END IF;

  INSERT INTO betslips (user_id, title, notes, is_public, settings, is_default)
  VALUES (p_user_id, p_title, p_notes, p_is_public, p_settings, p_is_default)
  RETURNING * INTO v_betslip;
  
  RETURN v_betslip;
END;
$$;

-- Update betslip title
CREATE OR REPLACE FUNCTION update_betslip_title(
  p_betslip_id UUID,
  p_title TEXT
)
RETURNS betslips
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_betslip betslips;
BEGIN
  UPDATE betslips
  SET title = p_title
  WHERE id = p_betslip_id
  RETURNING * INTO v_betslip;
  
  RETURN v_betslip;
END;
$$;

-- Set betslip as default
CREATE OR REPLACE FUNCTION set_betslip_as_default(
  p_betslip_id UUID
)
RETURNS betslips
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_betslip betslips;
  v_user_id UUID;
BEGIN
  -- Get the user_id for the betslip
  SELECT user_id INTO v_user_id
  FROM betslips
  WHERE id = p_betslip_id;

  -- Remove default from all other betslips for this user
  UPDATE betslips
  SET is_default = false
  WHERE user_id = v_user_id;

  -- Set the specified betslip as default
  UPDATE betslips
  SET is_default = true
  WHERE id = p_betslip_id
  RETURNING * INTO v_betslip;
  
  RETURN v_betslip;
END;
$$;

-- Get betslips for user with selections
CREATE OR REPLACE FUNCTION get_betslips_for_user(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  shared_id TEXT,
  title TEXT,
  notes TEXT,
  is_public BOOLEAN,
  settings JSONB,
  selections JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.user_id,
    b.created_at,
    b.updated_at,
    b.shared_id,
    b.title,
    b.notes,
    b.is_public,
    b.settings,
    COALESCE(
      jsonb_agg(bs.* ORDER BY bs.created_at)
      FILTER (WHERE bs.id IS NOT NULL),
      '[]'::jsonb
    ) as selections
  FROM betslips b
  LEFT JOIN betslip_selections bs ON b.id = bs.betslip_id
  WHERE b.user_id = p_user_id
  GROUP BY b.id
  ORDER BY b.created_at DESC;
END;
$$;

-- Add selection to betslip
CREATE OR REPLACE FUNCTION add_selection_to_betslip(
  p_betslip_id UUID,
  p_event_id TEXT,
  p_sport_key TEXT,
  p_commence_time TIMESTAMPTZ,
  p_home_team TEXT,
  p_away_team TEXT,
  p_bet_type bet_type,
  p_market_type market_type,
  p_market_key TEXT,
  p_market_display TEXT,
  p_selection TEXT,
  p_player_name TEXT DEFAULT NULL,
  p_player_team TEXT DEFAULT NULL,
  p_line NUMERIC DEFAULT NULL,
  p_odds_data JSONB DEFAULT '{}'::jsonb
)
RETURNS betslip_selections
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_selection betslip_selections;
BEGIN
  -- Verify betslip exists and belongs to the user
  IF NOT EXISTS (SELECT 1 FROM betslips WHERE id = p_betslip_id) THEN
    RAISE EXCEPTION 'Betslip not found';
  END IF;

  -- Check for duplicate player props based on player name and market
  IF p_bet_type = 'player_prop' AND EXISTS (
    SELECT 1 
    FROM betslip_selections 
    WHERE betslip_id = p_betslip_id 
      AND player_name = p_player_name 
      AND market_key = p_market_key
      AND line = p_line
  ) THEN
    RAISE EXCEPTION 'Selection already exists for this player and market';
  END IF;

  INSERT INTO betslip_selections (
    betslip_id,
    event_id,
    sport_key,
    commence_time,
    home_team,
    away_team,
    bet_type,
    market_type,
    market_key,
    market_display,
    selection,
    player_name,
    player_team,
    line,
    odds_data
  )
  VALUES (
    p_betslip_id,
    p_event_id,
    p_sport_key,
    p_commence_time,
    p_home_team,
    p_away_team,
    p_bet_type,
    p_market_type,
    p_market_key,
    p_market_display,
    p_selection,
    p_player_name,
    p_player_team,
    p_line,
    p_odds_data
  )
  RETURNING * INTO v_selection;
  
  RETURN v_selection;
END;
$$;

-- Remove selection from betslip
CREATE OR REPLACE FUNCTION remove_selection_from_betslip(p_selection_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM betslip_selections
  WHERE id = p_selection_id;
  
  RETURN FOUND;
END;
$$;

-- Clear betslip
CREATE OR REPLACE FUNCTION clear_betslip(p_betslip_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM betslip_selections
  WHERE betslip_id = p_betslip_id;
  
  RETURN FOUND;
END;
$$;

-- Delete betslip
CREATE OR REPLACE FUNCTION delete_betslip(p_betslip_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM betslips
  WHERE id = p_betslip_id;
  
  RETURN FOUND;
END;
$$;

-- Replace selection in betslip
CREATE OR REPLACE FUNCTION replace_betslip_selection(
  p_old_selection_id UUID,
  p_betslip_id UUID,
  p_event_id TEXT,
  p_sport_key TEXT,
  p_commence_time TIMESTAMPTZ,
  p_home_team TEXT,
  p_away_team TEXT,
  p_bet_type bet_type,
  p_market_type market_type,
  p_market_key TEXT,
  p_market_display TEXT,
  p_selection TEXT,
  p_player_name TEXT DEFAULT NULL,
  p_player_team TEXT DEFAULT NULL,
  p_line NUMERIC DEFAULT NULL,
  p_odds_data JSONB DEFAULT '{}'::jsonb
)
RETURNS betslip_selections
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_selection betslip_selections;
BEGIN
  -- Verify betslip exists and belongs to the user
  IF NOT EXISTS (SELECT 1 FROM betslips WHERE id = p_betslip_id) THEN
    RAISE EXCEPTION 'Betslip not found';
  END IF;

  -- Delete old selection
  DELETE FROM betslip_selections WHERE id = p_old_selection_id;

  -- Insert new selection
    INSERT INTO betslip_selections (
      betslip_id,
      event_id,
      sport_key,
      commence_time,
      home_team,
      away_team,
      bet_type,
      market_type,
      market_key,
    market_display,
      selection,
      player_name,
      player_team,
      line,
      odds_data
    )
    VALUES (
      p_betslip_id,
      p_event_id,
      p_sport_key,
      p_commence_time,
      p_home_team,
      p_away_team,
      p_bet_type,
      p_market_type,
      p_market_key,
    p_market_display,
      p_selection,
      p_player_name,
      p_player_team,
      p_line,
      p_odds_data
    )
    RETURNING * INTO v_selection;

    RETURN v_selection;
END;
$$;

-- Add row level security policies
ALTER TABLE betslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE betslip_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own betslips"
  ON betslips
  FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can only access selections from their betslips"
  ON betslip_selections
  FOR ALL
  USING (betslip_id IN (
    SELECT id FROM betslips WHERE user_id = auth.uid()
  )); 