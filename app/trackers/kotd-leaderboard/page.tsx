"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RefreshCw, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import KOTDDashboard from "@/components/trackers/kotd/kotd-dashboard";
import ScheduledGames from "@/components/trackers/kotd/scheduled-games";

// Define types for the API response
interface Player {
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
}

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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function KOTDLeaderboardPage() {
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Get current date in user's timezone
    const today = new Date();
    return formatDateForAPI(today);
  });
  const isInitialMount = useRef(true);
  const [isLoading, setIsLoading] = useState(true);

  // Format date for API (YYYY-MM-DD)
  function formatDateForAPI(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Format date for display
  function formatDateForDisplay(dateStr: string): string {
    // Create a date object from the date string - needs to be handled carefully for timezone issues
    const dateParts = dateStr.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // months are 0-indexed in JS
    const day = parseInt(dateParts[2]);
    
    // Create date using UTC to avoid timezone issues
    const date = new Date(year, month, day);
    
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }

  function goToPreviousDay() {
    // Parse the current date without timezone issues
    const dateParts = selectedDate.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // months are 0-indexed in JS
    const day = parseInt(dateParts[2]);
    
    // Create date using local time
    const current = new Date(year, month, day);
    current.setDate(current.getDate() - 1);
    
    const prevDateStr = formatDateForAPI(current);
    console.log("Moving to previous day:", prevDateStr);
    setSelectedDate(prevDateStr);
  }

  function goToNextDay() {
    // Parse the current date without timezone issues
    const dateParts = selectedDate.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // months are 0-indexed in JS
    const day = parseInt(dateParts[2]);
    
    // Create date using local time
    const current = new Date(year, month, day);
    current.setDate(current.getDate() + 1);
    
    // Get today's date for comparison
    const today = new Date();
    
    // Don't go into the future
    if (current > today) {
      const todayStr = formatDateForAPI(today);
      console.log("Reached today's date:", todayStr);
      setSelectedDate(todayStr);
      // Force refresh when returning to today
      setTimeout(() => mutate(), 100);
      return;
    }
    
    const nextDateStr = formatDateForAPI(current);
    console.log("Moving to next day:", nextDateStr);
    setSelectedDate(nextDateStr);
    
    // If going to today, force refresh
    if (formatDateForAPI(current) === formatDateForAPI(today)) {
      setTimeout(() => mutate(), 100);
    }
  }

  const isToday = useCallback((dateStr: string) => {
    const now = new Date();
    const today = formatDateForAPI(now);
    return dateStr === today;
  }, []);

  const updateLastUpdated = useCallback(() => {
    setLastUpdated(new Date().toLocaleTimeString());
  }, []);

  const { data, error, isValidating, mutate } = useSWR(
    `/api/kotd/allPlayers?date=${selectedDate}`,
    fetcher,
    {
      refreshInterval: isToday(selectedDate) ? 20000 : 0, // Only auto-refresh for today
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      onSuccess: () => {
        updateLastUpdated();
        setIsLoading(false);
      },
    }
  );

  const players = data?.players || [];
  const games = data?.games || [];
  const allGamesFinal = data?.allGamesFinal || false;
  const gamesScheduled = data?.gamesScheduled || false;

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      
      // Force refresh of the data without changing the date
      mutate();
      updateLastUpdated();
    }
  }, [mutate, selectedDate, updateLastUpdated]);

  const handleRefresh = () => {
    setIsLoading(true);
    mutate();
  };

  if (error) {
    return (
      <div className="w-full">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load MLB data: {error.message}. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const dateElement = (
    <div className="flex items-center justify-center md:justify-start space-x-2 mt-4 sm:mt-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={goToPreviousDay}
        disabled={isLoading || isValidating}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous Day</span>
      </Button>
      
      <div className="flex items-center border px-2 py-1 rounded-md bg-muted/30">
        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
        <span className={isLoading ? "animate-pulse" : ""}>
          {formatDateForDisplay(selectedDate)}
        </span>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={goToNextDay}
        disabled={(isLoading || isValidating) || isToday(selectedDate)}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next Day</span>
      </Button>
      
      {!isToday(selectedDate) && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            setIsLoading(true);
            const today = new Date();
            setSelectedDate(formatDateForAPI(today));
          }}
          disabled={isLoading || isValidating}
        >
          Today
        </Button>
      )}
    </div>
  );

  return (
    <div className="w-full">
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 md:mb-8"
      >
        <div className="space-y-2 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                King of the Diamond
              </h1>
              <p className="text-muted-foreground mt-2">
                Track MLB home runs and monitor the King of the Diamond promotion.
              </p>
              {dateElement}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="self-center md:self-auto"
              disabled={isLoading || isValidating}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading || isValidating ? "animate-spin" : ""}`}
              />
              Refresh Data
            </Button>
          </div>
        </div>
      </motion.section>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDate}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {(isLoading || isValidating) && (!data || !players) ? (
            <div className="flex justify-center p-12">
              <div className="animate-pulse space-y-8 w-full max-w-3xl">
                <div className="h-8 bg-muted rounded-md w-1/3"></div>
                <div className="space-y-4">
                  <div className="h-24 bg-muted rounded-md"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-40 bg-muted rounded-md"></div>
                    <div className="h-40 bg-muted rounded-md"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <KOTDDashboard
              players={players}
              games={games}
              allGamesFinal={allGamesFinal}
              lastUpdated={lastUpdated}
              dateLabel={!isToday(selectedDate) ? formatDateForDisplay(selectedDate) : undefined}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
} 