"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar } from "lucide-react";

type Team = {
  teamName: string;
  wins: number;
  losses: number;
};

type Game = {
  gameId: string;
  awayTeam: Team;
  homeTeam: Team;
  gameStatus: number;
  gameStatusText: string;
  startTimeUTC: string;
  gameLabel: string;
  gameSubLabel: string;
};

interface ScheduledGamesProps {
  games: Game[];
}

export default function ScheduledGames({ games }: ScheduledGamesProps) {
  const formatGameTime = (utcTime: string) => {
    const date = new Date(utcTime);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  const TeamInfo = ({ team }: { team: Team }) => (
    <div className="flex flex-col">
      <span className="font-semibold text-base sm:text-lg group-hover:text-primary transition-colors duration-300">
        {team.teamName}
      </span>
      <span className="text-xs sm:text-sm text-muted-foreground">
        ({team.wins}-{team.losses})
      </span>
    </div>
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {games.map((game) => (
        <Card
          key={game.gameId}
          className="overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
        >
          <CardContent className="p-0">
            {game.gameLabel && (
              <div className="bg-primary/10 p-2 transition-colors duration-300 group-hover:bg-primary/20">
                <div className="text-sm font-medium text-primary">
                  {game.gameLabel}
                </div>
                {game.gameSubLabel && (
                  <div className="text-xs text-muted-foreground">
                    {game.gameSubLabel}
                  </div>
                )}
              </div>
            )}
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <TeamInfo team={game.awayTeam} />
                <Badge
                  variant="outline"
                  className="transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground"
                >
                  Away
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <TeamInfo team={game.homeTeam} />
                <Badge
                  variant="outline"
                  className="transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground"
                >
                  Home
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Clock className="h-4 w-4" />
                {formatGameTime(game.startTimeUTC)}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
