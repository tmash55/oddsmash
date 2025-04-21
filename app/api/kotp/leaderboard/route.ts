import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { 
  GAMELOG_CACHE_KEY, 
  LEADERBOARD_CACHE_KEY, 
  SCOREBOARD_CACHE_KEY, 
  CACHE_TTL, 
  SCOREBOARD_CACHE_TTL,
  PlayerGameLog,
  SeriesRecord
} from "../constants";

// Use serverless runtime for longer timeouts (60 seconds vs 10 seconds for edge)
export const runtime = 'nodejs';

// Make this route dynamic instead of static
export const dynamic = 'force-dynamic';

// Initialize Redis client
const redis = Redis.fromEnv();

// New type for tracking series between two teams
type TeamSeriesMap = {
  [teamId: string]: SeriesRecord;
};

type Player = {
  personId: string;
  name: string;
  teamTricode: string;
  points: number; // Total playoff points
  livePts: number; // Points from currently active game
  totalPts: number; // Combined total (playoff + live)
  gamesPlayed: number;
  ppg: number; // Points per game
  gameStatus: string; // Current game status if applicable
  liveMatchup: string; // Current game matchup if applicable
  isPlaying: boolean; // Whether the player is in an active game
  oncourt: boolean; // Whether the player is on the court right now
  playedToday: boolean; // Whether the player played in a game today
  seriesRecord: SeriesRecord; // Playoff series record
};

// Add a type for the cached leaderboard structure
type LeaderboardCache = {
  players: Player[];
  allGamesFinal: boolean;
  playoffRound: string;
};

// Helper function to fetch with timeout
async function fetchWithTimeout(url: string, options = {}, timeout = 15000) {
  const controller = new AbortController();
  const { signal } = controller;
  
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { 
      ...options, 
      signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function fetchPlayoffGameLogs() {
  const url = "https://stats.nba.com/stats/leaguegamelog?Counter=0&DateFrom=&DateTo=&Direction=DESC&LeagueID=00&PlayerOrTeam=P&Season=2024-25&SeasonType=Playoffs&Sorter=DATE";

  try {
    // Try to get data from Redis cache first
    const cachedLogs = await redis.get(GAMELOG_CACHE_KEY) as PlayerGameLog[] | null;
    
    if (cachedLogs) {
      console.log("Using cached playoff game logs data");
      return cachedLogs;
    }
    
    console.log("Cache miss - fetching fresh playoff game logs data");
    
    // Set a more aggressive timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Reduced to 15 seconds
    
    try {
      const response = await fetch(
        url,
        {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            "Referer": "https://www.nba.com/",
            "Accept": "application/json",
            "Origin": "https://www.nba.com",
            "x-nba-stats-origin": "stats",
            "x-nba-stats-token": "true",
          },
          next: { revalidate: 300 }, // Cache for 5 minutes
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorText = "";
        try {
          errorText = await response.text();
          errorText = errorText.substring(0, 200); // Just a preview of the error
        } catch (e) {
          errorText = "Could not read error response";
        }
        
        throw new Error(`Failed to fetch playoff game logs: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Check if data is empty (no games played yet)
      if (!data.resultSets || !data.resultSets[0] || !data.resultSets[0].rowSet || data.resultSets[0].rowSet.length === 0) {
        console.log("No playoff games have been played yet");
        // Return empty array but cache it too so we don't hammer the API
        const emptyLogs: PlayerGameLog[] = [];
        await redis.set(GAMELOG_CACHE_KEY, emptyLogs, { ex: 60 * 15 }); // Cache for 15 minutes
        return emptyLogs;
      }
      
      // Parse the response data
      const headers = data.resultSets[0].headers;
      const rows = data.resultSets[0].rowSet;

      // Find indices for the columns we need
      const playerIdIndex = headers.indexOf("PLAYER_ID");
      const playerNameIndex = headers.indexOf("PLAYER_NAME");
      const teamAbbrevIndex = headers.indexOf("TEAM_ABBREVIATION");
      const teamIdIndex = headers.indexOf("TEAM_ID");
      const gameIdIndex = headers.indexOf("GAME_ID");
      const gameDateIndex = headers.indexOf("GAME_DATE");
      const matchupIndex = headers.indexOf("MATCHUP");
      const ptsIndex = headers.indexOf("PTS");
      const wlIndex = headers.indexOf("WL");

      // Format the data we need
      const gameLogs: PlayerGameLog[] = rows.map((row: any) => ({
        playerId: row[playerIdIndex]?.toString(),
        playerName: row[playerNameIndex],
        teamAbbreviation: row[teamAbbrevIndex],
        teamId: row[teamIdIndex]?.toString(),
        gameId: row[gameIdIndex]?.toString(),
        gameDate: row[gameDateIndex],
        matchup: row[matchupIndex],
        points: parseInt(row[ptsIndex] || 0),
        winLoss: row[wlIndex],
      }));

      // Store in Redis cache
      await redis.set(GAMELOG_CACHE_KEY, gameLogs, { ex: CACHE_TTL });
      console.log("Stored playoff game logs in cache");
      
      return gameLogs;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      // Handle fetch timeout or error
      console.error("NBA API fetch error:", fetchError);
      // Re-throw to be handled by outer catch
      throw fetchError;
    }
  } catch (error) {
    // Check if this is a timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      console.error("NBA API request timed out:", error);
      
      // Try to get stale data from cache
      const staleLogs = await redis.get(GAMELOG_CACHE_KEY) as PlayerGameLog[] | null;
      if (staleLogs) {
        console.log("Using stale playoff game logs after timeout");
        return staleLogs;
      }
      
      console.log("No stale data available, returning empty array since playoffs may not have started yet");
      return [];
    }
    
    console.error("Error fetching playoff game logs:", error);
    return [];
  }
}

async function fetchScoreboard() {
  try {
    // Try to get data from Redis cache first
    const cachedScoreboard = await redis.get(SCOREBOARD_CACHE_KEY) as any;
    
    if (cachedScoreboard) {
      console.log("Using cached scoreboard data");
      return cachedScoreboard;
    }
    
    console.log("Cache miss - fetching fresh scoreboard data");
    
    const res = await fetchWithTimeout(
      "https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json",
      {
        next: { revalidate: 60 },
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          "Referer": "https://www.nba.com/",
          "Accept": "application/json",
          "Origin": "https://www.nba.com",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        },
      },
      10000 // 10 second timeout
    );
    
    if (!res.ok) {
      let errorText = "";
      try {
        errorText = await res.text();
        errorText = errorText.substring(0, 200); // Just a preview of the error
      } catch (e) {
        errorText = "Could not read error response";
      }
      
      throw new Error(`Failed to fetch scoreboard: ${res.status} - ${errorText}`);
    }
    
    const data = await res.json();
    
    // Store in Redis cache with shorter TTL since it updates more frequently
    await redis.set(SCOREBOARD_CACHE_KEY, data.scoreboard, { ex: SCOREBOARD_CACHE_TTL });
    console.log("Stored scoreboard data in cache");
    
    return data.scoreboard;
  } catch (error) {
    // Check if this is a timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      console.error("NBA Scoreboard API request timed out:", error);
      
      // Try to get stale data from cache
      const staleScoreboard = await redis.get(SCOREBOARD_CACHE_KEY) as any;
      if (staleScoreboard) {
        console.log("Using stale scoreboard data after timeout");
        return staleScoreboard;
      }
      
      return { games: [] };
    }
    
    console.error("Error fetching scoreboard:", error);
    return { games: [] };
  }
}

async function fetchBoxscore(gameId: string) {
  try {
    const res = await fetch(
      `https://cdn.nba.com/static/json/liveData/boxscore/boxscore_${gameId}.json`,
      {
        next: { revalidate: 60 },
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          "Referer": "https://www.nba.com/",
          "Accept": "application/json",
          "Origin": "https://www.nba.com",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        },
      }
    );
    
    if (!res.ok) {
      let errorText = "";
      try {
        errorText = await res.text();
        errorText = errorText.substring(0, 200); // Just a preview of the error
      } catch (e) {
        errorText = "Could not read error response";
      }
      
      throw new Error(`Failed to fetch boxscore for game ${gameId}: ${res.status} - ${errorText}`);
    }
    
    const data = await res.json();
    return data.game;
  } catch (error) {
    console.error(`Error fetching boxscore for game ${gameId}:`, error);
    return null;
  }
}

function formatDateToNBAFormat(date: Date): string {
  // NBA API format is like "2024-04-19"
  return date.toISOString().split('T')[0];
}

function getTodayDate(): string {
  return formatDateToNBAFormat(new Date());
}

function getPlayerTeam(player: any): string {
  // Try different possible paths to the team code based on NBA API structure
  if (player.teamTricode) return player.teamTricode;
  if (player.statistics?.teamTricode) return player.statistics.teamTricode;
  if (player.statistics?.teamCode) return player.statistics.teamCode;
  if (player.statistics?.teamId && player.statistics?.teamCity) {
    return player.statistics.teamCity.substring(0, 3).toUpperCase();
  }
  if (player.teamId && player.team?.abbreviation) return player.team.abbreviation;
  
  // If we can't find a team code, return an empty string
  return "";
}

export async function GET() {
  console.log("Fetching KOTP leaderboard data");
  try {
    // Try to get cached leaderboard data first
    const cachedLeaderboard = await redis.get(LEADERBOARD_CACHE_KEY) as LeaderboardCache | null;
    const lastUpdated = new Date().toLocaleString();
    
    if (cachedLeaderboard) {
      console.log("Using cached leaderboard data");
      return NextResponse.json({
        ...cachedLeaderboard,
        lastUpdated,
        fromCache: true,
      });
    }
    
    console.log("Cache miss - building fresh leaderboard data");
    
    // Get today's date for filtering
    const todayString = getTodayDate();
    console.log(`Today's date: ${todayString} - Will filter out today's games from historical logs`);
    
    // Fetch game logs and scoreboard data (mostly from cache now)
    const [allGameLogs, scoreboard] = await Promise.all([
      fetchPlayoffGameLogs(),
      fetchScoreboard(),
    ]);
    
    // Create a set to track which completed games from today are already in the historical data
    const todayHistoricalGameIds = new Set<string>();

    // First identify today's games that are already in the historical data
    allGameLogs.forEach((game: PlayerGameLog) => {
      if (game.gameDate === todayString) {
        todayHistoricalGameIds.add(game.gameId);
      }
    });

    console.log(`Found ${todayHistoricalGameIds.size} completed games from today already in historical data`);

    // Filter out today's games from historical logs to prevent double counting
    const gameLogs = allGameLogs.filter((game: PlayerGameLog) => game.gameDate !== todayString);
    console.log(`Found ${allGameLogs.length} total game logs, using ${gameLogs.length} after filtering out today's games`);
    
    // Process the game logs to get player points
    const playersByID: { [key: string]: Player } = {};
    
    // First process the historical data
    gameLogs.forEach((game: PlayerGameLog) => {
      if (!playersByID[game.playerId]) {
        playersByID[game.playerId] = {
          personId: game.playerId,
          name: game.playerName,
          teamTricode: game.teamAbbreviation,
          points: 0,
          livePts: 0,
          totalPts: 0,
          gamesPlayed: 0,
          ppg: 0,
          gameStatus: "",
          liveMatchup: "",
          isPlaying: false,
          oncourt: false,
          playedToday: false,
          seriesRecord: {
            wins: 0,
            losses: 0,
            eliminated: false,
            advanced: false,
          }
        };
      }
      
      // Add to the player's points
      playersByID[game.playerId].points += game.points;
      playersByID[game.playerId].gamesPlayed++;
      
      // Update series record
      if (game.winLoss === "W") {
        playersByID[game.playerId].seriesRecord.wins++;
      } else if (game.winLoss === "L") {
        playersByID[game.playerId].seriesRecord.losses++;
      }
    });
    
    // Calculate PPG
    Object.values(playersByID).forEach((player) => {
      if (player.gamesPlayed > 0) {
        player.ppg = Number((player.points / player.gamesPlayed).toFixed(1));
      }
    });
    
    // Track which players have advanced or been eliminated
    const teamSeriesMap: TeamSeriesMap = {};
    const today = new Date();
    const formattedToday = formatDateToNBAFormat(today);
    
    // Process series outcomes
    Object.values(playersByID).forEach((player) => {
      // Skip players with no games played
      if (player.gamesPlayed === 0) return;
      
      const wins = player.seriesRecord.wins;
      const losses = player.seriesRecord.losses;
      
      // A team has advanced if they have 4 wins (series win)
      if (wins >= 4) {
        player.seriesRecord.advanced = true;
      }
      
      // A team has been eliminated if they have 4 losses (series loss)
      if (losses >= 4) {
        player.seriesRecord.eliminated = true;
      }
    });
    
    // Now process live games
    let allGamesFinal = true;
    
    if (scoreboard && scoreboard.games && scoreboard.games.length > 0) {
      const activeGames = scoreboard.games;
      
      for (const game of activeGames) {
        // Only consider playoff games (might need to adjust this check for your specific data structure)
        if (!game.gameId.toString().startsWith("004")) continue;
        
        // Check if any games are still in progress
        if (game.gameStatus !== 3) {
          allGamesFinal = false;
        }
        
        // Get player stats for home and away teams
        const awayTeamPlayers = game.awayTeam.players || [];
        const homeTeamPlayers = game.homeTeam.players || [];
        const allPlayers = [...awayTeamPlayers, ...homeTeamPlayers];
        
        // Get the matchup for display
        const gameMatchup = `${game.awayTeam.teamTricode} @ ${game.homeTeam.teamTricode}`;
        
        // Get game status for display
        let displayStatus = "Unknown";
        if (game.gameStatus === 1) {
          displayStatus = "Scheduled";
        } else if (game.gameStatus === 2) {
          const quarter = game.period;
          const clock = game.gameClock || "12:00";
          displayStatus = clock === "0.0" ? `End of ${getOrdinal(quarter)}` : `${getOrdinal(quarter)} ${clock}`;
        } else if (game.gameStatus === 3) {
          displayStatus = "Completed";
        }
        
        for (const player of allPlayers) {
          const playerId = player.personId.toString();
          const playerName = player.nameI;
          const teamId = getPlayerTeam(player);
          const teamTricode = teamId === game.awayTeam.teamId.toString() 
            ? game.awayTeam.teamTricode 
            : game.homeTeam.teamTricode;
          
          // Create player if not exists
          if (!playersByID[playerId]) {
            playersByID[playerId] = {
              personId: playerId,
              name: playerName,
              teamTricode,
              points: 0,
              livePts: 0,
              totalPts: 0,
              gamesPlayed: 0,
              ppg: 0,
              gameStatus: displayStatus,
              liveMatchup: gameMatchup,
              isPlaying: true,
              oncourt: player.oncourt || false,
              playedToday: player.statistics?.points > 0,
              seriesRecord: {
                wins: 0,
                losses: 0,
                eliminated: false,
                advanced: false,
              }
            };
          } else {
            // Update existing player
            playersByID[playerId].isPlaying = true;
            playersByID[playerId].gameStatus = displayStatus;
            playersByID[playerId].liveMatchup = gameMatchup;
            playersByID[playerId].oncourt = player.oncourt || false;
            playersByID[playerId].playedToday = player.statistics?.points > 0;
          }
          
          // Add live points if the player has statistics
          if (player.statistics && player.statistics.points > 0) {
            // Only add points if this game isn't already in the historical data
            if (!todayHistoricalGameIds.has(game.gameId)) {
              playersByID[playerId].livePts = player.statistics.points;
              playersByID[playerId].playedToday = true;
              
              // If the game is final, update their wins/losses record
              if (game.gameStatus === 3) {
                const playerTeamId = getPlayerTeam(player);
                const isHomeTeam = playerTeamId === game.homeTeam.teamId.toString();
                const playerTeamPoints = isHomeTeam ? game.homeTeam.score : game.awayTeam.score;
                const opponentPoints = isHomeTeam ? game.awayTeam.score : game.homeTeam.score;
                
                if (playerTeamPoints > opponentPoints) {
                  playersByID[playerId].seriesRecord.wins += 1;
                } else if (playerTeamPoints < opponentPoints) {
                  playersByID[playerId].seriesRecord.losses += 1;
                }
              }
            } else {
              console.log(`Skipping live points for ${playersByID[playerId].name} (${player.statistics.points} pts) in game ${game.gameId} - already in historical data`);
              // Still mark that they played today, but don't add the points twice
              playersByID[playerId].playedToday = true;
            }
          }
        }
      }
    }
    
    // Calculate total points for every player
    Object.values(playersByID).forEach((player) => {
      player.totalPts = player.points + player.livePts;
    });
    
    // Convert to sorted array based on totalPts
    const players = Object.values(playersByID)
      .filter((player) => player.totalPts > 0 || player.isPlaying) // Include players who have scored OR are in active games
      .sort((a, b) => b.totalPts - a.totalPts);
    
    // Prepare the response data
    const leaderboardData = {
      players,
      allGamesFinal,
      lastUpdated,
      playoffRound: "Round 1", // Update this manually or dynamically as needed
      fromCache: false,
    };
    
    // Store in Redis cache
    await redis.set(LEADERBOARD_CACHE_KEY, {
      players,
      allGamesFinal,
      playoffRound: "Round 1"
    }, { ex: CACHE_TTL });
    
    return NextResponse.json(leaderboardData);
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
    
    // Try to get stale data from cache as fallback
    const staleLeaderboard = await redis.get(LEADERBOARD_CACHE_KEY) as LeaderboardCache | null;
    if (staleLeaderboard) {
      console.log("Returning stale leaderboard data after error");
      return NextResponse.json({
        ...staleLeaderboard,
        lastUpdated: new Date().toLocaleString(),
        fromCache: true,
        staleData: true,
      });
    }
    
    // If absolutely no data is available, return an empty response
    return NextResponse.json({
      players: [],
      allGamesFinal: true,
      lastUpdated: new Date().toLocaleString(),
      error: "Failed to fetch data",
      playoffRound: "Round 1",
    });
  }
}

// Helper to get ordinal suffix for quarters
function getOrdinal(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
} 