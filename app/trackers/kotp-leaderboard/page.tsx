"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import KOTPDashboard from "@/components/trackers/kotp/kotp-dashboard";
import { RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function KOTPLeaderboardPage() {
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const isInitialMount = useRef(true);

  const updateLastUpdated = useCallback(() => {
    setLastUpdated(new Date().toLocaleTimeString());
  }, []);

  const { data, error, isValidating, mutate } = useSWR(
    "/api/kotp/leaderboard",
    fetcher,
    {
      refreshInterval: 30000, // 30 seconds
      revalidateOnFocus: false,
      dedupingInterval: 15000,
      onSuccess: updateLastUpdated,
    }
  );

  const players = data?.players || [];
  const games = data?.games || [];
  const allGamesFinal = data?.allGamesFinal || false;
  const gamesScheduled = data?.gamesScheduled || false;
  const playoffRound = data?.playoffRound || "Round 1";

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, []);

  const handleRefresh = () => {
    mutate();
  };

  if (error) {
    return (
      <div className="w-full">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load player data: {error.message}. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
                NBA Playoff Points Leaderboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Track which NBA players are scoring the most points in the{" "}
                <Badge variant="outline" className="font-medium">
                  {playoffRound}
                </Badge>{" "}
                of the playoffs.{" "}
                <a
                  href="/kotp"
                  className="text-primary hover:underline inline-flex items-center"
                >
                  Learn more about KOTP
                  <ExternalLink className="h-3.5 w-3.5 ml-1" />
                </a>
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="self-center md:self-auto"
              disabled={isValidating}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isValidating ? "animate-spin" : ""}`}
              />
              Refresh Data
            </Button>
          </div>
        </div>
      </motion.section>

      <AnimatePresence mode="wait">
        {isValidating && !data ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center items-center h-64"
          >
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
          </motion.div>
        ) : players.length === 0 ? (
          <motion.div
            key="nodata"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert className="mb-6">
              <AlertTitle>No playoff data available yet</AlertTitle>
              <AlertDescription>
                Playoff data will appear here once the games begin. Check back
                when the playoffs start!
              </AlertDescription>
            </Alert>
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 mt-4">
              <p className="mb-2">
                DraftKings is running a $2 million King of the Playoffs contest
                where users predict which player will score the most total
                points in Round 1.
              </p>
              <p>
                <a
                  href="/kotp"
                  className="text-primary hover:underline inline-flex items-center"
                >
                  Learn more about the KOTP contest
                  <ExternalLink className="h-3.5 w-3.5 ml-1" />
                </a>
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <KOTPDashboard
              players={players}
              allGamesFinal={allGamesFinal}
              lastUpdated={lastUpdated}
              playoffRound={playoffRound}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
