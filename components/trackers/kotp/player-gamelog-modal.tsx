"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

type GameLogData = {
  gameDate: string;
  displayDate: string; // Formatted date for display (e.g., "Apr 20")
  points: number;
  opponent: string;
  winLoss: string;
  isPlayoffGame: boolean;
};

type PlayerGameLogModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  playerId: string;
  playerName: string;
  teamTricode: string;
  onClose?: () => void;
};

export default function PlayerGameLogModal({
  isOpen,
  onOpenChange,
  playerId,
  playerName,
  teamTricode,
}: PlayerGameLogModalProps) {
  const [gameLogs, setGameLogs] = useState<GameLogData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculated stats
  const totalPoints = gameLogs.reduce((sum, game) => sum + game.points, 0);
  const gamesPlayed = gameLogs.length;
  const ppg = gamesPlayed > 0 ? (totalPoints / gamesPlayed).toFixed(1) : "0.0";
  const maxPoints = gameLogs.length > 0 ? Math.max(...gameLogs.map(g => g.points)) : 0;
  const avgPoints = gamesPlayed > 0 ? totalPoints / gamesPlayed : 0;

  useEffect(() => {
    if (isOpen && playerId) {
      fetchPlayerGameLogs();
    }
  }, [isOpen, playerId]);

  const fetchPlayerGameLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch the playoff game logs
      const response = await fetch("/api/nba/playoff-game-logs", {
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        }
      });
      
      if (!response.ok) {
        // Try to parse the error as JSON
        let errorMessage = `Failed to fetch game logs (${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage += `: ${errorData.error}`;
          }
        } catch (e) {
          // If we can't parse JSON, try to get the text
          try {
            const errorText = await response.text();
            errorMessage += `: ${errorText.substring(0, 100)}...`;
          } catch (textError) {
            // Fallback to generic error
            errorMessage += `: ${response.statusText}`;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      // Extract game logs for this player
      const playerLogs: GameLogData[] = [];
      
      if (data.resultSets && data.resultSets[0]?.rowSet) {
        // Find the indices for the columns we need
        const headers = data.resultSets[0].headers;
        const playerIdIdx = headers.indexOf("PLAYER_ID");
        const gameDateIdx = headers.indexOf("GAME_DATE");
        const pointsIdx = headers.indexOf("PTS");
        const matchupIdx = headers.indexOf("MATCHUP");
        const wlIdx = headers.indexOf("WL");

        // Parse the game logs
        data.resultSets[0].rowSet.forEach((row: any) => {
          if (row[playerIdIdx]?.toString() === playerId) {
            // Parse date
            const gameDate = row[gameDateIdx];
            const dateParts = gameDate.split("-");
            const date = new Date(
              parseInt(dateParts[0]),
              parseInt(dateParts[1]) - 1,
              parseInt(dateParts[2])
            );
            
            // Format date for display (e.g., "Apr 20")
            const displayDate = date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
            
            // Parse matchup to get opponent
            const matchup = row[matchupIdx];
            const opponent = matchup.includes("vs.") 
              ? matchup.split("vs.")[1].trim() 
              : matchup.split("@")[1].trim();
              
            playerLogs.push({
              gameDate: gameDate,
              displayDate: displayDate,
              points: row[pointsIdx],
              opponent: opponent,
              winLoss: row[wlIdx],
              isPlayoffGame: true,
            });
          }
        });
      }
      
      // Sort by date
      playerLogs.sort((a, b) => 
        new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime()
      );
      
      setGameLogs(playerLogs);
    } catch (err: any) {
      console.error("Error fetching player game logs:", err);
      setError(err.message || "Failed to load player game logs");
    } finally {
      setIsLoading(false);
    }
  };
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const game = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-900 p-3 rounded-md shadow-md border border-gray-200 dark:border-gray-800">
          <p className="font-medium">{game.displayDate} vs {game.opponent}</p>
          <p className="text-lg font-bold">{game.points} PTS</p>
          <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold mt-1 ${
            game.winLoss === "W"
              ? "border-transparent bg-primary text-primary-foreground shadow"
              : "border-transparent bg-destructive text-destructive-foreground shadow"
          }`}>
            {game.winLoss}
          </span>
        </div>
      );
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <span>{playerName}</span>
            <Badge variant="secondary" className="text-xs">
              {teamTricode}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Playoff Points Breakdown
          </DialogDescription>
        </DialogHeader>
        
        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-4 mb-4 shrink-0">
          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-center">
            <div className="text-2xl font-bold">{totalPoints}</div>
            <div className="text-sm text-muted-foreground">Total Points</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-center">
            <div className="text-2xl font-bold">{gamesPlayed}</div>
            <div className="text-sm text-muted-foreground">Games Played</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-center">
            <div className="text-2xl font-bold">{ppg}</div>
            <div className="text-sm text-muted-foreground">Points Per Game</div>
          </div>
        </div>
        
        <div className="flex-1 min-h-0 overflow-hidden">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-[300px] w-full" />
              <div className="flex justify-center">
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">
              {error}
            </div>
          ) : gameLogs.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No playoff game data available for this player yet.
            </div>
          ) : (
            <div className="h-[250px] sm:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={gameLogs}
                  margin={{ top: 20, right: 30, left: 0, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    domain={[0, Math.max(maxPoints + 5, 35)]}
                    allowDecimals={false}
                    tickFormatter={(value) => value.toString()}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine 
                    y={avgPoints} 
                    stroke="#8884d8" 
                    strokeDasharray="3 3"
                    label={{ 
                      value: `Avg: ${avgPoints.toFixed(1)}`, 
                      position: 'right',
                      fill: '#8884d8',
                      fontSize: 12
                    }}
                  />
                  <Bar 
                    dataKey="points" 
                    fill="#10b981" 
                    name="Points"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          
          {/* Game log table */}
          {!isLoading && !error && gameLogs.length > 0 && (
            <div className="mt-4 max-h-[200px] sm:max-h-[300px] overflow-y-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background border-b">
                  <tr>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Opponent</th>
                    <th className="p-2 text-right">Result</th>
                    <th className="p-2 text-right">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {gameLogs.map((game, idx) => (
                    <tr 
                      key={idx} 
                      className="border-b last:border-none hover:bg-muted/50"
                    >
                      <td className="p-2">{game.displayDate}</td>
                      <td className="p-2">{game.opponent}</td>
                      <td className="p-2 text-right">
                        <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                          game.winLoss === "W"
                            ? "border-transparent bg-primary text-primary-foreground shadow"
                            : "border-transparent bg-destructive text-destructive-foreground shadow"
                        }`}>
                          {game.winLoss}
                        </span>
                      </td>
                      <td className="p-2 text-right font-medium">{game.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 