import { createClient } from "@/libs/supabase/client";

interface Team {
  id: number;
  abbreviation: string;
  name: string;
  league_id?: number;
}

interface Player {
  player_id: number;
  full_name: string;
  team_id: number;
  position_abbreviation: string;
}

interface PlayerTeamData {
  player_id: number;
  team_abbreviation: string;
  team_name: string;
  position_abbreviation: string;
}

/**
 * Fetches team abbreviations from the mlb_teams table
 */
export async function fetchTeamAbbreviations(): Promise<Team[]> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('mlb_teams')
      .select('team_id, name, abbreviation, league_id')
      .order('name');
      
    if (error) {
      console.error('Error fetching team abbreviations:', error);
      throw new Error(`Failed to fetch team abbreviations: ${error.message}`);
    }
    
    // Transform the data to match our interface
    const teams = data?.map(team => ({
      id: team.team_id,
      name: team.name,
      abbreviation: team.abbreviation,
      league_id: team.league_id
    })) || [];
    
    return teams;
  } catch (err) {
    console.error('Error in fetchTeamAbbreviations:', err);
    // Return an empty array as fallback
    return [];
  }
}

/**
 * Fetches a team by its ID
 */
export async function fetchTeamById(teamId: number): Promise<Team | null> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('mlb_teams')
      .select('team_id, name, abbreviation, league_id')
      .eq('team_id', teamId)
      .single();
      
    if (error) {
      console.error(`Error fetching team with ID ${teamId}:`, error);
      throw new Error(`Failed to fetch team: ${error.message}`);
    }
    
    // Transform the data to match our interface
    if (data) {
      return {
        id: data.team_id,
        name: data.name,
        abbreviation: data.abbreviation,
        league_id: data.league_id
      };
    }
    
    return null;
  } catch (err) {
    console.error('Error in fetchTeamById:', err);
    return null;
  }
}

/**
 * Fetches player team data for multiple players
 * This joins the mlb_players and mlb_teams tables to get team abbreviations
 */
export async function fetchPlayerTeamData(playerIds: number[]): Promise<Record<number, PlayerTeamData>> {
  try {
    const supabase = createClient();
    
    // First, fetch players with their team IDs
    const { data: players, error: playersError } = await supabase
      .from('mlb_players')
      .select('player_id, full_name, position_abbreviation, team_id')
      .in('player_id', playerIds);
      
    if (playersError) {
      console.error('Error fetching players:', playersError);
      throw new Error(`Failed to fetch players: ${playersError.message}`);
    }
    
    if (!players || players.length === 0) {
      return {};
    }
    
    // Get unique team IDs
    const teamIds = Array.from(new Set(players.map(player => player.team_id))).filter(Boolean);
    
    // Then fetch teams
    const { data: teams, error: teamsError } = await supabase
      .from('mlb_teams')
      .select('team_id, name, abbreviation')
      .in('team_id', teamIds);
      
    if (teamsError) {
      console.error('Error fetching teams:', teamsError);
      throw new Error(`Failed to fetch teams: ${teamsError.message}`);
    }
    
    // Create a map of team ID to team data for quick lookups
    const teamMap: Record<number, { name: string; abbreviation: string }> = {};
    teams?.forEach(team => {
      teamMap[team.team_id] = {
        name: team.name,
        abbreviation: team.abbreviation
      };
    });
    
    // Map player IDs to their team and position data
    const playerTeamMap: Record<number, PlayerTeamData> = {};
    
    // Create the player team map
    players.forEach(player => {
      const teamData = player.team_id ? teamMap[player.team_id] : null;
      
      playerTeamMap[player.player_id] = {
        player_id: player.player_id,
        team_abbreviation: teamData ? teamData.abbreviation : '—',
        team_name: teamData ? teamData.name : '—',
        position_abbreviation: player.position_abbreviation || '—'
      };
    });
    
    return playerTeamMap;
  } catch (err) {
    console.error('Error in fetchPlayerTeamData:', err);
    // Return an empty object as fallback
    return {};
  }
} 