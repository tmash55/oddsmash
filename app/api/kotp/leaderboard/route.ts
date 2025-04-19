import { NextResponse } from "next/server";

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

type SeriesRecord = {
  wins: number;
  losses: number;
  eliminated: boolean;
  advanced: boolean;
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

async function fetchPlayoffGameLogs() {
  const url = "https://stats.nba.com/stats/leaguegamelog?Counter=0&DateFrom=&DateTo=&Direction=DESC&LeagueID=00&PlayerOrTeam=P&Season=2024-25&SeasonType=Playoffs&Sorter=DATE";

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://www.nba.com/",
        "Accept": "application/json",
        "x-nba-stats-origin": "stats",
        "x-nba-stats-token": "true",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch playoff game logs: ${response.status}`);
    }

    const data = await response.json();
    
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

    return gameLogs;
  } catch (error) {
    console.error("Error fetching playoff game logs:", error);
    return [];
  }
}

async function fetchScoreboard() {
  try {
    const res = await fetch(
      "https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json",
      {
        next: { revalidate: 60 },
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      }
    );
    if (!res.ok) {
      throw new Error(
        `Failed to fetch scoreboard: ${res.status} ${res.statusText}`
      );
    }
    const data = await res.json();
    return data.scoreboard;
  } catch (error) {
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
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      }
    );
    if (!res.ok) {
      throw new Error(
        `Failed to fetch boxscore: ${res.status} ${res.statusText}`
      );
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
  try {
    // Get today's date in the format used by NBA APIs
    const today = formatDateToNBAFormat(new Date());
    
    // 1. Get all playoff game logs for completed games
    const playoffGameLogs = await fetchPlayoffGameLogs();
    
    // 2. Aggregate points per player
    const playerMap = new Map<string, Player>();
    
    // Track series records by team ID
    const teamSeriesRecords = new Map<string, SeriesRecord>();
    const opponentsByTeam = new Map<string, string>(); // Track opponent team IDs
    
    // Process completed games from playoff game logs
    playoffGameLogs.forEach(game => {
      // Parse matchup to determine teams
      // Example matchup: "LAL vs. DEN" or "LAL @ DEN"
      const matchupParts = game.matchup.split(/\s+@\s+|\s+vs\.\s+/);
      const isHomeTeam = game.matchup.includes("vs.");
      const playerTeam = game.teamAbbreviation;
      const opponentTeam = isHomeTeam ? matchupParts[1] : matchupParts[0];
      
      // Track team's opponent for series tracking
      if (!opponentsByTeam.has(playerTeam)) {
        opponentsByTeam.set(playerTeam, opponentTeam);
      }
      
      // Initialize team series record if needed
      if (!teamSeriesRecords.has(playerTeam)) {
        teamSeriesRecords.set(playerTeam, {
          wins: 0,
          losses: 0,
          eliminated: false,
          advanced: false
        });
      }
      
      // Update series record based on win/loss
      const seriesRecord = teamSeriesRecords.get(playerTeam)!;
      if (game.winLoss === "W") {
        seriesRecord.wins += 1;
      } else if (game.winLoss === "L") {
        seriesRecord.losses += 1;
      }
      
      // Check if team is eliminated (lost 4 games) or advanced (won 4 games)
      if (seriesRecord.wins === 4) {
        seriesRecord.advanced = true;
        
        // Also mark opponent as eliminated
        if (opponentsByTeam.has(playerTeam) && teamSeriesRecords.has(opponentsByTeam.get(playerTeam)!)) {
          teamSeriesRecords.get(opponentsByTeam.get(playerTeam)!)!.eliminated = true;
        }
      } else if (seriesRecord.losses === 4) {
        seriesRecord.eliminated = true;
        
        // Also mark opponent as advanced
        if (opponentsByTeam.has(playerTeam) && teamSeriesRecords.has(opponentsByTeam.get(playerTeam)!)) {
          teamSeriesRecords.get(opponentsByTeam.get(playerTeam)!)!.advanced = true;
        }
      }
      
      if (!playerMap.has(game.playerId)) {
        playerMap.set(game.playerId, {
          personId: game.playerId,
          name: game.playerName,
          teamTricode: game.teamAbbreviation,
          points: 0,
          livePts: 0,
          totalPts: 0,
          gamesPlayed: 0,
          ppg: 0,
          gameStatus: "Completed",
          liveMatchup: "",
          isPlaying: false,
          oncourt: false,
          playedToday: false,
          seriesRecord: teamSeriesRecords.get(game.teamAbbreviation) || { 
            wins: 0, 
            losses: 0, 
            eliminated: false,
            advanced: false
          },
        });
      }
      
      const player = playerMap.get(game.playerId)!;
      player.points += game.points;
      player.gamesPlayed += 1;
      
      // Update player's series record
      player.seriesRecord = teamSeriesRecords.get(game.teamAbbreviation) || player.seriesRecord;
      
      // Check if this game is from today
      const isToday = game.gameDate === today;
      
      // If game is from today, also track as today's points
      if (isToday) {
        player.livePts = game.points;
        player.playedToday = true;
        player.liveMatchup = game.matchup;
        player.gameStatus = "Completed";
      }
      
      player.ppg = parseFloat((player.points / player.gamesPlayed).toFixed(1));
    });
    
    // 3. Get live game data and add points from active games
    const scoreboard = await fetchScoreboard();
    let allGamesFinal = true;
    
    // Collect all game IDs from the playoff game logs
    const completedGameIds = new Set(playoffGameLogs.map(log => log.gameId));
    
    // Process live games
    for (const game of scoreboard.games) {
      if (game.gameStatus !== 3) {
        allGamesFinal = false;
      }
      
      // Only proceed if the game is active or recently completed
      if (game.gameStatus >= 1) {
        const boxscore = await fetchBoxscore(game.gameId);
        if (!boxscore) continue;
        
        // Create a map of player IDs to team tricodes for this game
        const playerTeamMap = new Map<string, string>();
        
        // Extract home team info
        const homeTeamTricode = boxscore.homeTeam.teamTricode || 
                                boxscore.homeTeam.teamCode || 
                                (boxscore.homeTeam.teamCity ? boxscore.homeTeam.teamCity.substring(0, 3).toUpperCase() : "");
        
        // Extract away team info
        const awayTeamTricode = boxscore.awayTeam.teamTricode || 
                                boxscore.awayTeam.teamCode || 
                                (boxscore.awayTeam.teamCity ? boxscore.awayTeam.teamCity.substring(0, 3).toUpperCase() : "");
        
        // Map all home team players to home team tricode
        boxscore.homeTeam.players.forEach((player: any) => {
          playerTeamMap.set(player.personId, homeTeamTricode);
        });
        
        // Map all away team players to away team tricode
        boxscore.awayTeam.players.forEach((player: any) => {
          playerTeamMap.set(player.personId, awayTeamTricode);
        });
        
        const players = [
          ...boxscore.homeTeam.players,
          ...boxscore.awayTeam.players,
        ];
        
        const matchup = `${game.awayTeam.score} ${game.awayTeam.teamTricode} @ ${game.homeTeam.teamTricode} ${game.homeTeam.score}`;
        
        const gameStatus = 
          game.gameStatus === 2
            ? `${game.period}Q ${game.gameClock}`
            : game.gameStatusText;
        
        // Process players in this game
        players.forEach(player => {
          const playerId = player.personId;
          
          // Skip if this game is already in the game logs (to avoid double counting)
          if (completedGameIds.has(game.gameId)) return;
          
          // Try to get team info in different ways
          let teamTricode = getPlayerTeam(player);
          
          // If we couldn't get team from player object directly, try our playerTeamMap
          if (!teamTricode && playerTeamMap.has(playerId)) {
            teamTricode = playerTeamMap.get(playerId)!;
          }
          
          // Get or create player record
          if (!playerMap.has(playerId)) {
            // Create new player record with team info from the boxscore
            playerMap.set(playerId, {
              personId: playerId,
              name: player.name,
              teamTricode: teamTricode,
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
              seriesRecord: teamSeriesRecords.get(teamTricode) || {
                wins: 0,
                losses: 0,
                eliminated: false,
                advanced: false
              },
            });
          } else if (!playerMap.get(playerId)!.teamTricode && teamTricode) {
            // If we already have the player but no team info, update it
            playerMap.get(playerId)!.teamTricode = teamTricode;
          }
          
          const playerData = playerMap.get(playerId)!;
          
          // Update with live game data
          playerData.livePts = player.statistics.points;
          playerData.isPlaying = true;
          playerData.playedToday = true;
          playerData.liveMatchup = matchup;
          playerData.gameStatus = gameStatus.trim();
          playerData.oncourt = player.oncourt === "1";
          
          // If the game is final, increment games played
          if (game.gameStatus === 3 && !completedGameIds.has(game.gameId)) {
            playerData.gamesPlayed += 1;
          }
        });
      }
    }
    
    // 4. Calculate total points (playoff points + live points)
    const playerEntries = Array.from(playerMap.entries());
    for (const [_, player] of playerEntries) {
      player.totalPts = player.points + player.livePts;
      
      // Recalculate PPG
      if (player.gamesPlayed > 0) {
        player.ppg = parseFloat((player.totalPts / player.gamesPlayed).toFixed(1));
      }
    }
    
    // 5. Convert to array and sort by total points
    const leaderboardPlayers = Array.from(playerMap.values())
      .sort((a, b) => b.totalPts - a.totalPts);
    
    return NextResponse.json({
      players: leaderboardPlayers,
      allGamesFinal,
      playoffRound: "Round 1",
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to generate leaderboard" },
      { status: 500 }
    );
  }
} 