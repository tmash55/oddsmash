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
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                King of the Playoffs
              </h1>
              <p className="text-muted-foreground">
                Track real-time NBA playoff scoring leaders for the $2M DraftKings contest
                {cacheStatus && getCacheStatusDisplay()}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 self-end sm:self-auto">
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                className="gap-2"
                disabled={isValidating}
              >
                <RefreshCw className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />
                Retry {retryCount > 0 ? `(${retryCount})` : ''}
              </Button>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Alert variant="destructive" className="mb-6">
                  <AlertTitle className="font-semibold">Error Loading Data</AlertTitle>
                  <AlertDescription className="mt-1">
                    {errorMessage}
                    {retryCount > 0 && (
                      <div className="mt-2 text-sm">
                        Retry count: {retryCount}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              </motion.div>
            ) : (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <KOTPDashboard 
                  players={players} 
                  lastUpdated={lastUpdated}
                  playoffRound={playoffRound}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              King of the Playoffs
            </h1>
            <p className="text-muted-foreground">
              Track real-time NBA playoff scoring leaders for the $2M DraftKings contest
              {cacheStatus && getCacheStatusDisplay()}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 self-end sm:self-auto">
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              className="gap-2"
              disabled={isValidating}
            >
              <RefreshCw className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Alert variant="destructive" className="mb-6">
                <AlertTitle className="font-semibold">Error Loading Data</AlertTitle>
                <AlertDescription className="mt-1">
                  {errorMessage}
                  {retryCount > 0 && (
                    <div className="mt-2 text-sm">
                      Retry count: {retryCount}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <KOTPDashboard 
                players={players} 
                lastUpdated={lastUpdated}
                playoffRound={playoffRound}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
