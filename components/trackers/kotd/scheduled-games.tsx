"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Home } from "lucide-react";

interface Game {
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
}

interface ScheduledGamesProps {
  games: Game[];
}

// Add a function to format the inning display properly
const formatInning = (inning: number, inningHalf: "top" | "bottom" | string): string => {
  const half = inningHalf === "top" ? "Top" : inningHalf === "bottom" ? "Bot" : inningHalf;
  return `${half} ${inning}`;
};

export default function ScheduledGames({ games }: ScheduledGamesProps) {
  if (!games || games.length === 0) {
    return (
      <div className="text-center p-4 border rounded-lg bg-muted/20">
        <p className="text-muted-foreground">No games scheduled for today</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {games.map((game) => (
        <Card key={game.gamePk} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4">
              {/* Header with time and game status */}
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm text-muted-foreground">
                  {new Date(game.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <Badge
                  className={`
                    text-xs
                    ${game.isPostponed
                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                      : game.abstractGameState === "Final"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                        : game.abstractGameState === "Live"
                          ? "bg-amber-600 text-white dark:bg-amber-800 dark:text-amber-100"
                          : "bg-secondary text-secondary-foreground"
                    }
                  `}
                >
                  {game.isPostponed
                    ? "Postponed" 
                    : game.abstractGameState === "Live"
                      ? formatInning(game.inning, game.inningHalf)
                      : game.abstractGameState === "Final"
                        ? "Final"
                        : game.gameStatus
                  }
                </Badge>
              </div>
              
              {/* Score Box */}
              <div className="border rounded-md p-2 mb-3 bg-muted/5">
                <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2">
                  {/* Away Team */}
                  <div className="flex flex-col">
                    <div className="font-semibold">{game.awayTeam}</div>
                    <div className="text-xs text-muted-foreground">
                      ({game.awayTeamWins}-{game.awayTeamLosses})
                    </div>
                  </div>
                  {/* Away Team Score */}
                  <div className="font-bold text-lg text-center min-w-[36px]">
                    {game.awayTeamRuns}
                  </div>
                  
                  {/* Home Team */}
                  <div className="flex flex-col">
                    <div className="font-semibold flex items-center gap-1">
                      {game.homeTeam}
                      <Home className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ({game.homeTeamWins}-{game.homeTeamLosses})
                    </div>
                  </div>
                  {/* Home Team Score */}
                  <div className="font-bold text-lg text-center min-w-[36px]">
                    {game.homeTeamRuns}
                  </div>
                </div>
              </div>
              
              {/* Home Run Information - Moved to its own section */}
              {(game.homeTeamHomeRuns > 0 || game.awayTeamHomeRuns > 0) && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {game.awayTeamHomeRuns > 0 && (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/30">
                      {game.awayTeam}: {game.awayTeamHomeRuns} HR
                    </Badge>
                  )}
                  {game.homeTeamHomeRuns > 0 && (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/30">
                      {game.homeTeam}: {game.homeTeamHomeRuns} HR
                    </Badge>
                  )}
                </div>
              )}
              
              {/* Venue Information */}
              {game.venue && (
                <div className="text-xs text-muted-foreground mt-2 flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {game.venue}
                </div>
              )}
              
              {/* Final Game Indicator */}
              {game.abstractGameState === "Final" && (
                <div className="text-xs text-muted-foreground mt-2 text-right">
                  Game completed
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 