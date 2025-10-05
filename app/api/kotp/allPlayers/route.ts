import { NextResponse } from "next/server";

type Player = {
  personId: string;
  name: string;
  matchup: string;
  points: number;
  gameStatus: string;
  gameClock: string;
  period: number;
  gameDate: string;
  oncourt: boolean;
};

async function fetchScoreboard() {
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

export async function GET() {
  try {
    const scoreboard = await fetchScoreboard();
    let allPlayers: Player[] = [];
    let allGamesFinal = true;

    if (scoreboard.games.length === 0) {
      return NextResponse.json({
        message: "No games scheduled for today",
        players: [],
        allGamesFinal: true,
      });
    }

    // Try to fetch the first game's boxscore to check if data is available
    const firstGameBoxscore = await fetchBoxscore(scoreboard.games[0].gameId);

    // If we can't access the first game's boxscore, return just the games schedule
    if (!firstGameBoxscore) {
      return NextResponse.json({
        gamesScheduled: true,
        games: scoreboard.games.map((game: any) => ({
          gameId: game.gameId,
          awayTeam: {
            teamTricode: game.awayTeam.teamTricode,
            teamName: game.awayTeam.teamName,
            wins: game.awayTeam.wins,
            losses: game.awayTeam.losses,
          },
          homeTeam: {
            teamTricode: game.homeTeam.teamTricode,
            teamName: game.homeTeam.teamName,
            wins: game.homeTeam.wins,
            losses: game.homeTeam.losses,
          },
          gameStatus: game.gameStatus,
          gameStatusText: game.gameStatusText,
          startTimeUTC: game.gameTimeUTC,
          gameLabel: game.gameLabel,
          gameSubLabel: game.gameSubLabel,
        })),
        players: [],
        allGamesFinal: false,
      });
    }

    // If we can access boxscores, proceed with the regular flow
    for (const game of scoreboard.games) {
      const boxscore = await fetchBoxscore(game.gameId);
      if (!boxscore) continue;

      const players = [
        ...boxscore.homeTeam.players,
        ...boxscore.awayTeam.players,
      ];
      const matchup = `${game.awayTeam.score} ${game.awayTeam.teamTricode} @ ${game.homeTeam.teamTricode} ${game.homeTeam.score}`;

      if (game.gameStatus !== 3) {
        allGamesFinal = false;
      }

      const gameStatus =
        game.gameStatus === 2
          ? `${game.period}Q ${game.gameClock}`
          : game.gameStatusText;

      allPlayers = allPlayers.concat(
        players.map((player) => ({
          personId: player.personId,
          name: player.name,
          matchup: matchup,
          points: player.statistics.points,
          gameStatus: gameStatus.trim(),
          gameClock: game.gameClock,
          period: game.period,
          gameDate: scoreboard.gameDate,
          oncourt: player.oncourt === "1",
        }))
      );
    }

    // Sort by points instead of PRA
    allPlayers.sort((a, b) => b.points - a.points);

    return NextResponse.json({
      players: allPlayers,
      allGamesFinal,
      gameDate: scoreboard.gameDate,
      gamesCount: scoreboard.games.length,
    });
  } catch (error) {
    console.error("Error fetching player data:", error);
    return NextResponse.json(
      { error: "Failed to fetch player data" },
      { status: 500 }
    );
  }
} 