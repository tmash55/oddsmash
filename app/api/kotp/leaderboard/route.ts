import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Make this route dynamic instead of static
export const dynamic = "force-dynamic";

// Define types
type Player = {
  personId: string;
  name: string;
  teamTricode: string;
  points: number; // Historical points
  livePts: number; // Live points
  todayPts: number; // Points scored today
  totalPts: number; // Combined total
  gamesPlayed: number;
  ppg: number;
  gameStatus?: string;
  liveMatchup?: string;
  isPlaying: boolean;
  oncourt: boolean;
  playedToday: boolean;
  seriesRecord: {
    wins: number;
    losses: number;
    eliminated: boolean;
    advanced: boolean;
  };
};

export async function GET(request: Request) {
  console.log("Fetching KOTP leaderboard data");

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    console.log("Initializing Supabase client...");
    console.log(`URL available: ${!!supabaseUrl}, Key available: ${!!supabaseKey}`);
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase credentials");
      return NextResponse.json(
        { error: "Missing Supabase credentials", players: [], playoffRound: "Round 1" },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get historical data from Supabase
    console.log("Fetching historical data from Supabase...");
    const { data: historicalPlayers, error } = await supabase.rpc("get_player_leaderboard");

    if (error) {
      console.error("Error fetching historical data:", error);
      throw error;
    }

    console.log(`Retrieved ${historicalPlayers?.length || 0} players from database`);

    // 2. Try to get live data, but make it optional
    console.log("Attempting to fetch live data (optional)...");
    let livePlayers: any[] = [];
    try {
      livePlayers = await fetchLivePlayerData();
      console.log(`Retrieved ${livePlayers.length} players with live data`);
    } catch (liveError) {
      console.log("Could not fetch live data, continuing with historical data only");
    }

    // Convert personId to string in livePlayers for consistent matching
    livePlayers = livePlayers.map(player => ({
      ...player,
      personId: String(player.personId)
    }));

    // 3. Combine the data
    console.log("Preparing player data...");
    const combinedPlayers: Player[] = historicalPlayers.map((player: any) => {
      // Find matching live player data, making sure personId is a string in both
      const livePlayer = livePlayers.find(
        (lp) => lp.personId === player.personId
      );

      // Calculate live points (or 0 if not playing)
      const livePts = livePlayer?.points || 0;
      
      // Debug player matching if there are live players
      if (livePlayers.length > 0 && player.name === "Cade Cunningham") {
        console.log(`Checking player match for ${player.name}:`);
        console.log(`  DB personId: "${player.personId}" (${typeof player.personId})`);
        const foundLive = livePlayers.find(p => p.name === "Cade Cunningham");
        if (foundLive) {
          console.log(`  Live personId: "${foundLive.personId}" (${typeof foundLive.personId})`);
          console.log(`  Match found: ${foundLive.personId === player.personId}`);
        } else {
          console.log(`  No live data found for ${player.name}`);
        }
      }

      return {
        personId: player.personId,
        name: player.name,
        teamTricode: player.teamTricode,
        points: player.points,
        livePts: livePts,
        todayPts: livePts, // Today's points are the live points
        totalPts: player.points + livePts,
        gamesPlayed: player.gamesPlayed,
        ppg: player.ppg,
        gameStatus: livePlayer?.gameStatus,
        liveMatchup: livePlayer?.matchup, // Use matchup from live data
        isPlaying: !!livePlayer,
        oncourt: livePlayer?.oncourt || false,
        playedToday: livePts > 0 || !!livePlayer, // Mark as played today if there are live points
        seriesRecord: player.seriesRecord || { wins: 0, losses: 0, eliminated: false, advanced: false },
      };
    });

    // 4. Sort by total points
    combinedPlayers.sort((a, b) => b.totalPts - a.totalPts);

    // 5. Get playoff round from cache
    let playoffRound = "Round 1";
    try {
      const { data: roundData } = await supabase
        .from("cache")
        .select("value")
        .eq("key", "nba_playoff_round")
        .single();

      playoffRound = roundData?.value?.round || "Round 1";
    } catch (cacheError) {
      console.log("Could not fetch playoff round, using default");
    }
    
    const lastUpdated = new Date().toLocaleString();
    const allGamesFinal = !livePlayers.some((p) => p.gameStatus && !p.gameStatus.includes("Final"));
    
    // Check if any games scheduled for today
    const gamesScheduled = livePlayers.length > 0;

    // Add players from live data that aren't in the historical data
    const historicalPlayerIds = new Set(historicalPlayers.map((p: any) => p.personId));
    
    const livePlayers_OtherPlayers = livePlayers
      .filter(p => !historicalPlayerIds.has(p.personId))
      .map(p => ({
        personId: p.personId,
        name: p.name,
        teamTricode: p.matchup?.split(' ')[1], // Extract team from matchup
        points: 0, // No historical points
        livePts: p.points || 0,
        todayPts: p.points || 0,
        totalPts: p.points || 0,
        gamesPlayed: 0,
        ppg: 0,
        gameStatus: p.gameStatus,
        liveMatchup: p.matchup,
        isPlaying: true,
        oncourt: p.oncourt || false,
        playedToday: true,
        seriesRecord: { wins: 0, losses: 0, eliminated: false, advanced: false },
      }));
    
    // Add new live players to the combined list
    if (livePlayers_OtherPlayers.length > 0) {
      combinedPlayers.push(...livePlayers_OtherPlayers);
      // Resort after adding new players
      combinedPlayers.sort((a, b) => b.totalPts - a.totalPts);
    }

    // 6. Return combined data
    return NextResponse.json({
      players: combinedPlayers,
      playoffRound,
      lastUpdated,
      allGamesFinal,
      gamesScheduled,
      dataSource: livePlayers.length > 0 ? "live and historical" : "historical only"
    });
  } catch (error) {
    console.error("Error building leaderboard:", error);
    return NextResponse.json(
      {
        error: String(error),
        players: [],
        playoffRound: "Round 1",
        lastUpdated: new Date().toLocaleString(),
      },
      { status: 500 }
    );
  }
}

async function fetchLivePlayerData(): Promise<any[]> {
  try {
    // Use absolute URL to ensure it works in all environments
    console.log("Constructing URL for live data...");
    const host = process.env.VERCEL_URL 
      ? `https://oddsmash.io` 
      : "http://localhost:3000";
    const url = `${host}/api/kotp/allPlayers`;
    
    console.log(`Fetching live data from: ${url}`);
    const response = await fetch(url, { 
      cache: 'no-store' // Remove the duplicate revalidate option
    });
    
    if (!response.ok) {
      console.error("Error fetching live data:", response.statusText);
      return [];
    }

    const data = await response.json();
    return data.players || [];
  } catch (error) {
    console.error("Exception fetching live data:", error);
    return []; // Return empty array on error
  }
} 