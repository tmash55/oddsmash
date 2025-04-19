"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import KOTPDashboard from "@/components/trackers/kotp/kotp-dashboard";
import { RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const fetcher = async (url: string) => {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      // Try to extract error information
      let errorInfo = "";
      try {
        const errorData = await res.json();
        errorInfo = errorData.error || errorData.message || "Unknown error";
        if (errorData.details) {
          errorInfo += `: ${errorData.details}`;
        }
      } catch (e) {
        // If we can't parse JSON, try to get the text
        try {
          errorInfo = await res.text();
          errorInfo = errorInfo.substring(0, 200); // Limit length
        } catch (textError) {
          errorInfo = `Status ${res.status} ${res.statusText}`;
        }
      }
      
      throw new Error(errorInfo);
    }
    return res.json();
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};

export default function KOTPLeaderboardPage() {
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);
  const [retryTimeout, setRetryTimeout] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<"hit" | "miss" | "stale" | null>(null);
  const isInitialMount = useRef(true);

  // Get the API base URL - this ensures we use the correct URL in production vs development
  const getApiUrl = () => {
    // If we're on the client side, use window.location
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : '';
      return `${protocol}//${hostname}${port}`;
    } 
    // For SSR, return an empty string that will be treated as a relative URL
    return '';
  };

  const apiBaseUrl = getApiUrl();
  const leaderboardUrl = `${apiBaseUrl}/api/kotp/leaderboard`;

  const updateLastUpdated = useCallback((data: any, response: Response) => {
    setLastUpdated(new Date().toLocaleTimeString());
    
    // Check if the data came from cache based on headers
    const cacheHeader = response.headers.get('X-Cache');
    if (cacheHeader) {
      setCacheStatus(cacheHeader.toLowerCase() as "hit" | "miss" | "stale");
    } else {
      setCacheStatus(null);
    }
  }, []);

  const { data, error, isValidating, mutate } = useSWR(
    leaderboardUrl, // Use the constructed URL
    async (url) => {
      console.log(`Fetching leaderboard data from: ${url}`);
      const res = await fetch(url);
      if (!res.ok) {
        // ... existing error handling ...
      }
      const data = await res.json();
      updateLastUpdated(data, res);
      return data;
    },
    {
      refreshInterval: 30000, // 30 seconds
      revalidateOnFocus: false,
      dedupingInterval: 15000,
      onError: (err) => {
        console.error("Error fetching leaderboard data:", err);
        // Check if it's a timeout error (504)
        if (err.message?.includes("Status 504")) {
          setRetryTimeout(true);
        }
      },
      errorRetryCount: 3, // Retry up to 3 times automatically
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
    setRetryCount(prev => prev + 1);
    setRetryTimeout(false);
    mutate();
  };

  let errorMessage = "";
  if (error) {
    errorMessage = error.message || "An unknown error occurred";
    // If it's a specific API error, try to make it more readable
    if (errorMessage.includes("NBA API error")) {
      errorMessage = "NBA API is currently unavailable. Please try again later.";
    } else if (errorMessage.includes("Invalid JSON")) {
      errorMessage = "The NBA data service returned an invalid response. Please try again later.";
    } else if (errorMessage.includes("Status 504") || retryTimeout) {
      errorMessage = "The NBA API is taking too long to respond. This might be due to high traffic or maintenance.";
    }
  }

  // Format and display cache status if available
  const getCacheStatusDisplay = () => {
    if (!cacheStatus) return null;
    
    let statusText = "";
    let statusClass = "";
    
    switch (cacheStatus) {
      case "hit":
        statusText = "From cache";
        statusClass = "text-green-600 dark:text-green-400";
        break;
      case "miss":
        statusText = "Fresh data";
        statusClass = "text-blue-600 dark:text-blue-400";
        break;
      case "stale":
        statusText = "Stale cache";
        statusClass = "text-amber-600 dark:text-amber-400";
        break;
    }
    
    return (
      <span className={`ml-2 text-xs ${statusClass}`}>
        ({statusText})
      </span>
    );
  };

  if (error) {
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

                <Badge variant="outline" className="font-medium">
                    Round 1
                </Badge>

                {" "}
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
            </div>
          </div>
        </motion.section>
        
        <Alert variant="destructive">
          <AlertTitle>Unable to load NBA playoff data</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{errorMessage}</p>
            {(retryTimeout || errorMessage.includes("504")) && (
              <p className="text-sm mt-2">
                The NBA data service might be experiencing high traffic or maintenance.
                Try again in a few moments or check back later.
              </p>
            )}
            <div className="pt-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleRefresh} 
                disabled={isValidating}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isValidating ? "animate-spin" : ""}`} />
                Try Again
              </Button>
            </div>
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
                    Round 1
                  </Badge>

                {" "}
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
            <div className="flex flex-col items-end">
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
        </div>
      </motion.section>

      <AnimatePresence mode="wait" initial={false}>
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
            exit={{ opacity: 0 }}
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
            exit={{ opacity: 0 }}
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
