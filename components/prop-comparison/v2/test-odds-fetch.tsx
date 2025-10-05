"use client";

import { usePropComparisonV2 } from "@/hooks/use-prop-comparison-v2";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

interface TestOddsFetchProps {
  sport: string;
  market: string;
  gameId?: string;
  evMethod?: "market-average" | "no-vig";
}

export function TestOddsFetch({
  sport,
  market,
  gameId,
  evMethod,
}: TestOddsFetchProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("sport", sport);
      if (market && market !== "all") params.append("market", market);
      if (gameId) params.append("gameId", gameId);
      if (evMethod) params.append("evMethod", evMethod);

      const response = await fetch(`/api/prop-comparison/v2?${params.toString()}`);
      const json = await response.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <div className="text-red-500">
          Error: {error}
        </div>
        <Button onClick={handleFetch} variant="outline" size="sm" className="mt-2">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Odds Data</h3>
        <Button onClick={handleFetch} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Parameters:</h4>
          <pre className="bg-muted p-2 rounded text-xs">
            {JSON.stringify({ sport, market, gameId, evMethod }, null, 2)}
          </pre>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Response:</h4>
          <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-[500px]">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </Card>
  );
} 