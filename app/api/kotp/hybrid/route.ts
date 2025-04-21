import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { GAMELOG_CACHE_KEY } from "@/app/api/kotp/constants";
import { fetchPlayoffGameLogs } from "@/lib/kotp/fetchGameLogs";

// Runtime config for better timeouts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper function to get a formatted date string
function getFormattedTime() {
  return new Date().toLocaleTimeString();
}

// Helper function to format game clock from various formats to MM:SS
function formatGameClock(clock: string): string {
  if (!clock) return "12:00";
  
  // Handle ISO format like "PT05M44.00S"
  const isoMatch = clock.match(/PT(\d+)M(\d+)\.(\d+)S/);
  if (isoMatch) {
    const [_, minutes, seconds] = isoMatch;
    return `${parseInt(minutes)}:${seconds.padStart(2, '0')}`;
  }
  
  // Handle "0.0" format
  if (clock === "0.0" || clock === "0:00" || clock === "0.00") {
    return "0:00";
  }
  
  // Handle MM:SS.ms format (convert to MM:SS)
  const timeMatch = clock.match(/^(\d+):(\d+)(\.\d+)?$/);
  if (timeMatch) {
    const [_, minutes, seconds] = timeMatch;
    return `${parseInt(minutes)}:${seconds.padStart(2, '0')}`;
  }
  
  // Handle raw seconds format like "44.0"
  const secondsMatch = clock.match(/^(\d+)\.(\d+)$/);
  if (secondsMatch) {
    const [_, seconds, decimal] = secondsMatch;
    return `0:${seconds.padStart(2, '0')}`;
  }
  
  // Already in good format or unrecognized, return as is
  return clock;
}

// Helper function to convert a number to its ordinal form (1st, 2nd, 3rd, etc.)
function getOrdinal(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

// For now we're still in Round 1
const PLAYOFF_ROUND = "Round 1";

// Helper function to format date to NBA format (YYYY-MM-DD)
function formatDateToNBAFormat(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Helper function to get today's date in NBA format
function getTodayDate(): string {
  return formatDateToNBAFormat(new Date());
}

// Types for our data structures
type PlayerGameLog = {
  playerId: string;
  playerName: string;
  teamAbbreviation: string;
  teamId: string;
  gameId: string;
  gameDate: string;
  matchup: string;
  points: number;
  winLoss: string;
};

type SimplePlayer = {
  personId: string;
  name: string;
  teamTricode: string;
  points: number; // Historical playoff points
  livePts: number; // Points from today's games
  totalPts: number; // Combined total (points + livePts)
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

// Fetch today's scoreboard
async function fetchScoreboard() {
  try {
    const res = await fetch(
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
      }
    );
    
    if (!res.ok) {
      console.log(`Scoreboard fetch failed: ${res.status}`);
      return { games: [] };
    }
    
    const data = await res.json();
    return data.scoreboard;
  } catch (error) {
    console.error("Error fetching scoreboard:", error);
    return { games: [] };
  }
}

// Fetch boxscore for a specific game
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
      return null;
    }
    
    const data = await res.json();
    return data.game;
  } catch (error) {
    console.error(`Error fetching boxscore for game ${gameId}:`, error);
    return null;
  }
}

// Get the player's team code
function getPlayerTeam(player: any, boxscore?: any): string {
  const playerDebugName = player.nameI || player.name || `Player ID: ${player.personId}`;
  
  // First try direct properties from player object
  if (player.teamTricode) {
    console.log(`Team for ${playerDebugName} found via teamTricode: ${player.teamTricode}`);
    return player.teamTricode;
  }
  if (player.statistics?.teamTricode) {
    console.log(`Team for ${playerDebugName} found via statistics.teamTricode: ${player.statistics.teamTricode}`);
    return player.statistics.teamTricode;
  }
  if (player.statistics?.teamCode) {
    console.log(`Team for ${playerDebugName} found via statistics.teamCode: ${player.statistics.teamCode}`);
    return player.statistics.teamCode;
  }
  if (player.teamAbbreviation) {
    console.log(`Team for ${playerDebugName} found via teamAbbreviation: ${player.teamAbbreviation}`);
    return player.teamAbbreviation;
  }
  
  // Try getting from global current game data
  if (player.teamId && global.currentGameData) {
    const game = global.currentGameData;
    // Check if player is on home team
    if (game.homeTeam && String(game.homeTeam.teamId) === String(player.teamId)) {
      console.log(`Team for ${playerDebugName} found via game home team: ${game.homeTeam.teamTricode}`);
      return game.homeTeam.teamTricode;
    }
    // Check if player is on away team
    if (game.awayTeam && String(game.awayTeam.teamId) === String(player.teamId)) {
      console.log(`Team for ${playerDebugName} found via game away team: ${game.awayTeam.teamTricode}`);
      return game.awayTeam.teamTricode;
    }
  }
  
  // If boxscore is provided, check both teams
  if (boxscore && player.personId) {
    const pid = String(player.personId);
    
    // Check if player is on home team
    const homePlayer = boxscore.homeTeam.players?.find((p: any) => String(p.personId) === pid);
    if (homePlayer) {
      const team = boxscore.homeTeam.teamTricode || boxscore.homeTeam.teamCode || "";
      console.log(`Team for ${playerDebugName} found via boxscore home team: ${team}`);
      return team;
    }
    
    // Check if player is on away team
    const awayPlayer = boxscore.awayTeam.players?.find((p: any) => String(p.personId) === pid);
    if (awayPlayer) {
      const team = boxscore.awayTeam.teamTricode || boxscore.awayTeam.teamCode || "";
      console.log(`Team for ${playerDebugName} found via boxscore away team: ${team}`);
      return team;
    }
  }
  
  // Last resort, check oncourt status to determine team
  if (boxscore && player.oncourt === "1") {
    // Players currently on court can be matched with team more easily
    const homePlayersOnCourt = boxscore.homeTeam.players?.filter((p: any) => p.oncourt === "1") || [];
    const awayPlayersOnCourt = boxscore.awayTeam.players?.filter((p: any) => p.oncourt === "1") || [];
    
    if (homePlayersOnCourt.some((p: any) => String(p.personId) === String(player.personId))) {
      const team = boxscore.homeTeam.teamTricode || boxscore.homeTeam.teamCode || "";
      console.log(`Team for ${playerDebugName} found via oncourt status (home): ${team}`);
      return team;
    }
    
    if (awayPlayersOnCourt.some((p: any) => String(p.personId) === String(player.personId))) {
      const team = boxscore.awayTeam.teamTricode || boxscore.awayTeam.teamCode || "";
      console.log(`Team for ${playerDebugName} found via oncourt status (away): ${team}`);
      return team;
    }
  }
  
  console.log(`WARN: Could not determine team for ${playerDebugName}`);
  return "";
}

// Store current game data globally for team reference
let global: { currentGameData: any } = { currentGameData: null };

// GET handler for the hybrid leaderboard
export async function GET() {
  try {
    console.log("Hybrid leaderboard endpoint called:", new Date().toISOString());
    
    // Instead of just getting the cache, use the fetchPlayoffGameLogs function
    // which will either return cached data or fetch fresh data if needed
    console.log("Retrieving playoff game logs (cached or fresh)");
    const gameLogsResult = await fetchPlayoffGameLogs();
    const cachedGameLogs = gameLogsResult.data;
    const fromCache = gameLogsResult.fromCache || false;
    
    // Get today's date for filtering
    const todayString = getTodayDate();
    console.log(`Today's date: ${todayString} - Will filter out today's games from historical logs`);
    
    // Create a map to store player data
    const playerMap: Record<string, SimplePlayer> = {};
    
    // Add a set to track game IDs from today that exist in historical data
    const todayHistoricalGameIds = new Set<string>();

    // Process historical game logs first (if any)
    if (cachedGameLogs && Array.isArray(cachedGameLogs)) {
      // First identify today's games in the historical data
      cachedGameLogs.forEach(game => {
        if (game.gameDate === todayString) {
          todayHistoricalGameIds.add(game.gameId);
        }
      });
      
      console.log(`Found ${todayHistoricalGameIds.size} completed games from today already in historical data`);
      
      // Filter out today's games to prevent double counting
      const filteredGameLogs = cachedGameLogs.filter(game => game.gameDate !== todayString);
      
      console.log(`Found ${cachedGameLogs.length} playoff game logs, using ${filteredGameLogs.length} after filtering out today's games`);
      
      // Process each game log
      filteredGameLogs.forEach(game => {
        if (!playerMap[game.playerId]) {
          playerMap[game.playerId] = {
            personId: game.playerId,
            name: game.playerName,
            teamTricode: game.teamAbbreviation,
            points: 0,
            livePts: 0,
            totalPts: 0,
            gamesPlayed: 0,
            ppg: 0,
            isPlaying: false,
            oncourt: false,
            playedToday: false,
            seriesRecord: {
              wins: 0,
              losses: 0,
              eliminated: false,
              advanced: false
            }
          };
        }
        
        // Add historical points
        playerMap[game.playerId].points += game.points;
        playerMap[game.playerId].gamesPlayed++;
        
        // Update series record
        if (game.winLoss === 'W') {
          playerMap[game.playerId].seriesRecord.wins++;
        } else if (game.winLoss === 'L') {
          playerMap[game.playerId].seriesRecord.losses++;
        }
      });
      
      // Calculate PPG and determine advanced/eliminated
      Object.values(playerMap).forEach(player => {
        // Calculate PPG
        if (player.gamesPlayed > 0) {
          player.ppg = Number((player.points / player.gamesPlayed).toFixed(1));
        }
        
        // Check for series completion
        if (player.seriesRecord.wins >= 4) {
          player.seriesRecord.advanced = true;
        } else if (player.seriesRecord.losses >= 4) {
          player.seriesRecord.eliminated = true;
        }
      });
    } else {
      console.log("No cached game logs found");
    }
    
    // Now fetch today's live data
    console.log("Fetching today's games");
    const scoreboard = await fetchScoreboard();
    let allGamesFinal = true;
    let gamesScheduled = scoreboard && scoreboard.games && scoreboard.games.length > 0;
    
    if (gamesScheduled) {
      console.log(`Found ${scoreboard.games.length} games today`);
      
      // Only process playoff games (should check for Playoffs in the game label)
      const playoffGames = scoreboard.games.filter((game: any) => 
        (game.gameId?.toString().startsWith("004") || // Playoff game ID format
         (game.gameLabel && game.gameLabel.includes("Playoffs")))
      );
      
      if (playoffGames.length > 0) {
        console.log(`Found ${playoffGames.length} playoff games today`);
        
        // Process each playoff game
        for (const game of playoffGames) {
          // Store current game data for team reference
          global.currentGameData = game;
          
          // Check if any games are still in progress
          if (game.gameStatus !== 3) {
            allGamesFinal = false;
          }
          
          // Try to get boxscore
          const boxscore = await fetchBoxscore(game.gameId);
          if (!boxscore) {
            console.log(`No boxscore available for game ${game.gameId}`);
            continue;
          }
          
          // Get all players from this game
          const players = [
            ...(boxscore.homeTeam.players || []),
            ...(boxscore.awayTeam.players || []),
          ];
          
          // Get matchup string for display
          const gameMatchup = `${game.awayTeam.teamTricode} @ ${game.homeTeam.teamTricode}`;
          
          // Get game status string
          let displayStatus = "Unknown";
          if (game.gameStatus === 1) {
            displayStatus = "Scheduled";
          } else if (game.gameStatus === 2) {
            const quarter = game.period;
            const formattedClock = formatGameClock(game.gameClock);
            
            // Special case for overtime
            if (quarter > 4) {
              const otPeriod = quarter - 4;
              displayStatus = formattedClock === "0:00" ? `End of OT${otPeriod}` : `OT${otPeriod} ${formattedClock}`;
            } else {
              // Regular quarters
              const ordinalQuarter = getOrdinal(quarter);
              displayStatus = formattedClock === "0:00" ? `End of ${ordinalQuarter}` : `${ordinalQuarter} ${formattedClock}`;
            }
          } else if (game.gameStatus === 3) {
            displayStatus = "Final";
          }
          
          // Process each player
          for (const player of players) {
            const playerId = player.personId?.toString();
            if (!playerId) continue;
            
            const playerName = player.nameI || player.name;
            if (!playerName) continue;
            
            // Determine which team this player is on
            let teamTricode = getPlayerTeam(player, boxscore);
            
            // If we still don't have a team code, try direct lookup from boxscore
            if (!teamTricode) {
              // Check if player belongs to home team
              const isHomePlayer = boxscore.homeTeam.players.some((p: any) => 
                p.personId?.toString() === playerId);
              
              if (isHomePlayer) {
                teamTricode = game.homeTeam.teamTricode;
                console.log(`Found team ${teamTricode} for ${playerName} via direct boxscore lookup (home)`);
              } else {
                // Must be away team
                teamTricode = game.awayTeam.teamTricode;
                console.log(`Found team ${teamTricode} for ${playerName} via direct boxscore lookup (away)`);
              }
            }
            
            // Create player if not exists
            if (!playerMap[playerId]) {
              playerMap[playerId] = {
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
                oncourt: player.oncourt === "1" || false,
                playedToday: false,
                seriesRecord: {
                  wins: 0,
                  losses: 0,
                  eliminated: false,
                  advanced: false
                }
              };
            } else {
              // Update existing player with live game info
              playerMap[playerId].gameStatus = displayStatus;
              playerMap[playerId].liveMatchup = gameMatchup;
              playerMap[playerId].isPlaying = true;
              playerMap[playerId].oncourt = player.oncourt === "1" || false;
              
              // Update team code if we didn't have one before
              if (!playerMap[playerId].teamTricode && teamTricode) {
                playerMap[playerId].teamTricode = teamTricode;
              }
            }
            
            // Add live points if the player has statistics and the game isn't already in historical data
            if (player.statistics && player.statistics.points !== undefined) {
              const livePoints = parseInt(player.statistics.points) || 0;
              
              // Only count live points if this game isn't already in the historical data
              if (!todayHistoricalGameIds.has(game.gameId)) {
                playerMap[playerId].livePts = livePoints;
                playerMap[playerId].playedToday = livePoints > 0;
                
                // If the game is final, mark it in the series record
                if (game.gameStatus === 3) {
                  const playerTeamId = getPlayerTeam(player, boxscore);
                  const isHomeTeam = playerTeamId === game.homeTeam.teamTricode;
                  const playerTeamPoints = isHomeTeam ? game.homeTeam.score : game.awayTeam.score;
                  const opponentPoints = isHomeTeam ? game.awayTeam.score : game.homeTeam.score;
                  
                  if (playerTeamPoints > opponentPoints) {
                    playerMap[playerId].seriesRecord.wins += 1;
                  } else if (playerTeamPoints < opponentPoints) {
                    playerMap[playerId].seriesRecord.losses += 1;
                  }
                }
              } else {
                console.log(`Skipping live points for ${playerMap[playerId].name} (${livePoints} pts) in game ${game.gameId} - already in historical data`);
                // Still mark that they played today, but don't double-count points
                playerMap[playerId].playedToday = true;
              }
            }
          }
        }
      } else {
        console.log("No playoff games found today");
      }
    } else {
      console.log("No games scheduled today");
    }
    
    // Calculate total points for each player
    Object.values(playerMap).forEach(player => {
      player.totalPts = player.points + player.livePts;
    });
    
    // Sort by total points
    const players = Object.values(playerMap)
      .filter(player => player.totalPts > 0 || player.isPlaying)
      .sort((a, b) => b.totalPts - a.totalPts);
    
    // Create response data
    const responseData = {
      players,
      allGamesFinal,
      gamesScheduled,
      playoffRound: PLAYOFF_ROUND,
      lastUpdated: getFormattedTime(),
      hasCachedData: !!cachedGameLogs && Array.isArray(cachedGameLogs),
      cachedGameLogsCount: cachedGameLogs && Array.isArray(cachedGameLogs) ? cachedGameLogs.length : 0,
      hasLiveGames: gamesScheduled,
      cacheInfo: {
        fromCache,
        logCount: cachedGameLogs ? cachedGameLogs.length : 0,
        cacheMessage: gameLogsResult.message,
        todayHistoricalGames: todayHistoricalGameIds.size,
        todayHistoricalGameIds: Array.from(todayHistoricalGameIds)
      }
    };
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error generating hybrid leaderboard:", error);
    
    return NextResponse.json({
      players: [],
      allGamesFinal: true,
      playoffRound: PLAYOFF_ROUND,
      lastUpdated: getFormattedTime(),
      error: "Failed to generate leaderboard",
      errorMessage: error.message
    });
  }
} 