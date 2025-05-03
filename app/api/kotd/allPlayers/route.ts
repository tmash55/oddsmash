import { NextRequest, NextResponse } from "next/server";

// Helper function to format date for API (YYYY-MM-DD)
function formatDateForAPI(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type Player = {
  personId: string;
  name: string;
  team: string;
  teamId: number;
  opponent: string;
  opponentId: number;
  homeRun: boolean;
  homeRunCount: number;
  atBats: number;
  teamRuns: number;
  opponentRuns: number;
  currentInning: string;
  inningNumber: number;
  inningHalf: string;
  gameId: number;
  gameStatus: string;
  winningTeam: boolean;
  isPostponed: boolean;
  position: string;
};

type Game = {
  gamePk: number;
  homeTeam: string;
  homeTeamId: number;
  homeTeamRuns: number;
  homeTeamHomeRuns: number;
  homeTeamWins: number;
  homeTeamLosses: number;
  homeTeamWinPct: string;
  awayTeam: string;
  awayTeamId: number;
  awayTeamRuns: number;
  awayTeamHomeRuns: number;
  awayTeamWins: number;
  awayTeamLosses: number;
  awayTeamWinPct: string;
  inning: number;
  inningHalf: "top" | "bottom";
  gameStatus: string;
  abstractGameState: string;
  startTime: string;
  venue?: string;
  isPostponed: boolean;
};

async function fetchMLBScoreboard(dateStr: string) {
  try {
    console.log(`[KOTD] Fetching MLB scoreboard for ${dateStr}`);

    const res = await fetch(
      `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${dateStr}&hydrate=game(content(media(epg))),linescore,team`,
      {
        next: { revalidate: 60 },
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch MLB scoreboard: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("[KOTD] Error fetching MLB scoreboard:", error);
    throw error;
  }
}

async function fetchGameLiveData(gamePk: number) {
  try {
    console.log(`[KOTD] Fetching live data for game ${gamePk}`);
    
    const res = await fetch(
      `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`,
      {
        next: { revalidate: 60 },
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch game live data: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error(`[KOTD] Error fetching live data for game ${gamePk}:`, error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get date from query params or use today
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    
    let targetDate: Date;
    let now = new Date();
    
    if (dateParam && dateParam.match(/^\d{4}-\d{2}-\d{2}$/)) {
      targetDate = new Date(dateParam + 'T00:00:00');
      // Validate the date is not in the future (using local time)
      if (targetDate > now) {
        targetDate = now;
      }
    } else {
      targetDate = now;
    }
    
    // Format date in YYYY-MM-DD format
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, "0");
    const day = String(targetDate.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    
    console.log(`[KOTD] Fetching MLB scoreboard for ${dateStr}`);
    
    const scoreboard = await fetchMLBScoreboard(dateStr);
    let allPlayers: Player[] = [];
    let games: Game[] = [];
    let allGamesFinal = true;
    let gamesScheduled = false;

    // Check if there are games scheduled for today
    if (!scoreboard.dates || scoreboard.dates.length === 0 || !scoreboard.dates[0].games || scoreboard.dates[0].games.length === 0) {
      return NextResponse.json({
        message: "No MLB games scheduled for today",
        players: [],
        games: [],
        allGamesFinal: true,
      });
    }

    const todayGames = scoreboard.dates[0].games;
    gamesScheduled = true;

    console.log(`[KOTD] Found ${todayGames.length} games scheduled today`);

    // Process each game
    for (const game of todayGames) {
      // Map game data for the frontend
      const gameData: Game = {
        gamePk: game.gamePk,
        homeTeam: game.teams.home.team.name,
        homeTeamId: game.teams.home.team.id,
        homeTeamRuns: game.teams.home.score || 0,
        homeTeamHomeRuns: 0, // Will be updated from live data
        homeTeamWins: game.teams.home.leagueRecord?.wins || 0,
        homeTeamLosses: game.teams.home.leagueRecord?.losses || 0,
        homeTeamWinPct: game.teams.home.leagueRecord?.pct || '.000',
        awayTeam: game.teams.away.team.name,
        awayTeamId: game.teams.away.team.id,
        awayTeamRuns: game.teams.away.score || 0,
        awayTeamHomeRuns: 0, // Will be updated from live data
        awayTeamWins: game.teams.away.leagueRecord?.wins || 0,
        awayTeamLosses: game.teams.away.leagueRecord?.losses || 0,
        awayTeamWinPct: game.teams.away.leagueRecord?.pct || '.000',
        inning: game.linescore?.currentInning || 0,
        inningHalf: game.linescore?.inningHalf?.toLowerCase() || "top",
        gameStatus: game.status.detailedState,
        abstractGameState: game.status.abstractGameState,
        startTime: game.gameDate,
        venue: game.venue?.name,
        isPostponed: game.status.detailedState === "Postponed"
      };

      // If game is not final, mark allGamesFinal as false
      if (game.status.abstractGameState !== "Final") {
        allGamesFinal = false;
      }

      // For in-progress and completed games, fetch detailed live data
      if (game.status.abstractGameState !== "Preview") {
        const liveData = await fetchGameLiveData(game.gamePk);
        
        if (liveData) {
          // Update home run counts for teams
          if (liveData.liveData && liveData.liveData.boxscore) {
            const homeTeamStats = liveData.liveData.boxscore.teams.home.teamStats;
            const awayTeamStats = liveData.liveData.boxscore.teams.away.teamStats;
            
            if (homeTeamStats && homeTeamStats.batting) {
              gameData.homeTeamHomeRuns = homeTeamStats.batting.homeRuns || 0;
            }
            
            if (awayTeamStats && awayTeamStats.batting) {
              gameData.awayTeamHomeRuns = awayTeamStats.batting.homeRuns || 0;
            }
          }

          // Process players with home runs
          if (liveData.liveData && liveData.liveData.boxscore) {
            // Always include all players, even for historical dates
            // The client-side filtering will handle showing only HR hitters if desired
            
            // Process home team players
            const homePlayers = liveData.liveData.boxscore.teams.home.players;
            for (const playerId in homePlayers) {
              const playerData = homePlayers[playerId];
              const hasHomeRun = playerData.stats && playerData.stats.batting && playerData.stats.batting.homeRuns > 0;
              // Include position information for filtering
              const position = playerData.position?.abbreviation || '';
              
              allPlayers.push({
                personId: playerData.person.id.toString(),
                name: playerData.person.fullName,
                team: gameData.homeTeam,
                teamId: gameData.homeTeamId,
                opponent: gameData.awayTeam,
                opponentId: gameData.awayTeamId,
                homeRun: hasHomeRun,
                homeRunCount: playerData.stats?.batting?.homeRuns || 0,
                atBats: playerData.stats?.batting?.atBats || 0,
                teamRuns: gameData.homeTeamRuns,
                opponentRuns: gameData.awayTeamRuns,
                currentInning: `${gameData.inningHalf} ${gameData.inning}`,
                inningNumber: gameData.inning,
                inningHalf: gameData.inningHalf,
                gameId: gameData.gamePk,
                gameStatus: gameData.gameStatus,
                winningTeam: gameData.homeTeamRuns > gameData.awayTeamRuns,
                isPostponed: gameData.isPostponed,
                position: position
              });
            }

            // Process away team players
            const awayPlayers = liveData.liveData.boxscore.teams.away.players;
            for (const playerId in awayPlayers) {
              const playerData = awayPlayers[playerId];
              const hasHomeRun = playerData.stats && playerData.stats.batting && playerData.stats.batting.homeRuns > 0;
              // Include position information for filtering
              const position = playerData.position?.abbreviation || '';
              
              allPlayers.push({
                personId: playerData.person.id.toString(),
                name: playerData.person.fullName,
                team: gameData.awayTeam,
                teamId: gameData.awayTeamId,
                opponent: gameData.homeTeam,
                opponentId: gameData.homeTeamId,
                homeRun: hasHomeRun,
                homeRunCount: playerData.stats?.batting?.homeRuns || 0,
                atBats: playerData.stats?.batting?.atBats || 0,
                teamRuns: gameData.awayTeamRuns,
                opponentRuns: gameData.homeTeamRuns,
                currentInning: `${gameData.inningHalf} ${gameData.inning}`,
                inningNumber: gameData.inning,
                inningHalf: gameData.inningHalf,
                gameId: gameData.gamePk,
                gameStatus: gameData.gameStatus,
                winningTeam: gameData.awayTeamRuns > gameData.homeTeamRuns,
                isPostponed: gameData.isPostponed,
                position: position
              });
            }
          }
        }
      }

      games.push(gameData);
    }

    // Sort players by home run count (highest first)
    allPlayers.sort((a, b) => {
      // First by home run count
      if (b.homeRunCount !== a.homeRunCount) {
        return b.homeRunCount - a.homeRunCount;
      }
      
      // Then by winning team status for KOTD promotion
      if (a.winningTeam !== b.winningTeam) {
        return a.winningTeam ? -1 : 1;
      }
      
      // Then by team runs
      return b.teamRuns - a.teamRuns;
    });

    console.log(`[KOTD] Found ${allPlayers.length} players with home runs`);

    return NextResponse.json({
      players: allPlayers,
      games,
      allGamesFinal,
      gamesScheduled,
      gameDate: scoreboard.dates[0].date,
      gamesCount: todayGames.length,
    });
  } catch (error) {
    console.error("[KOTD] Error fetching MLB data:", error);
    return NextResponse.json(
      { error: "Failed to fetch MLB data" },
      { status: 500 }
    );
  }
} 