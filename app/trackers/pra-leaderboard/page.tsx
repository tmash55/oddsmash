"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import KOTCDashboard from "@/components/trackers/kotc/kotc-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ScheduledGames from "@/components/trackers/kotc/scheduled-games";
import PRAOdds from "@/components/trackers/kotc/pra-odds";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PRALeaderboardPage() {
  const [activeTab, setActiveTab] = useState("odds");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const isInitialMount = useRef(true);

  const updateLastUpdated = useCallback(() => {
    setLastUpdated(new Date().toLocaleTimeString());
  }, []);

  const { data, error, isValidating, mutate } = useSWR(
    "/api/kotc/allPlayers",
    fetcher,
    {
      refreshInterval: 20000,
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      onSuccess: updateLastUpdated,
    }
  );

  const players = data?.players || [];
  const games = data?.games || [];
  const allGamesFinal = data?.allGamesFinal || false;
  const gamesScheduled = data?.gamesScheduled || false;

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
                NBA PRA Leaderboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Track which NBA players have the highest Points + Rebounds +
                Assists (PRA) totals in today&apos;s games.
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
        ) : gamesScheduled ? (
          <motion.div
            key="scheduled"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <Alert className="bg-primary/5 border-primary/20">
              <AlertTitle className="text-primary">Games Scheduled</AlertTitle>
              <AlertDescription>
                Once games start, this page will display the live leaderboard.
                Who will be the king today?
              </AlertDescription>
            </Alert>

            <div className="mt-6">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto mb-6">
                  <TabsTrigger value="schedule">Today&apos;s Schedule</TabsTrigger>
                  <TabsTrigger value="odds">DraftKings PRA</TabsTrigger>
                </TabsList>
                <TabsContent value="schedule" className="mt-0">
                  <h2 className="text-2xl font-bold mb-4">
                    Today&apos;s NBA Schedule
                  </h2>
                  <ScheduledGames games={games} />
                </TabsContent>
                <TabsContent value="odds" className="mt-0">
                  <h2 className="text-2xl font-bold mb-4">
                    DraftKings PRA Odds
                  </h2>
                  <PRAOdds />
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        ) : players.length === 0 ? (
          <motion.div
            key="nodata"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert className="mb-6">
              <AlertTitle>No game data available yet</AlertTitle>
              <AlertDescription>
                Player data will appear here once today&apos;s games begin. Check
                back later!
              </AlertDescription>
            </Alert>
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 mt-4">
              <p>
                King of the Court (KOTC) tracks NBA players&apos; combined Points,
                Rebounds, and Assists in real-time during today&apos;s games.
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
            <KOTCDashboard
              players={players}
              allGamesFinal={allGamesFinal}
              lastUpdated={lastUpdated}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
