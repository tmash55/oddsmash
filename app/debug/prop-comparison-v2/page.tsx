"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TestOddsFetch } from "@/components/prop-comparison/v2/test-odds-fetch";

const SPORTS = [
  { id: "baseball_mlb", name: "MLB" },
  { id: "basketball_nba", name: "NBA" },
  { id: "basketball_ncaab", name: "NCAAB" },
];

const MARKETS = {
  baseball_mlb: [
    { id: "strikeouts", name: "Strikeouts" },
    { id: "hits", name: "Hits" },
    { id: "home_runs", name: "Home Runs" },
    { id: "rbis", name: "RBIs" },
  ],
  basketball_nba: [
    { id: "points", name: "Points" },
    { id: "rebounds", name: "Rebounds" },
    { id: "assists", name: "Assists" },
    { id: "threes", name: "Three Pointers" },
  ],
  basketball_ncaab: [
    { id: "points", name: "Points" },
    { id: "rebounds", name: "Rebounds" },
    { id: "assists", name: "Assists" },
  ],
};

interface TestOddsFetchProps {
  sport: string;
  market: string;
  gameId?: string;
  evMethod?: "market-average" | "no-vig";
}

export default function PropComparisonV2Page() {
  const [sport, setSport] = useState("baseball_mlb");
  const [market, setMarket] = useState<string>("all");
  const [gameId, setGameId] = useState("");
  const [showTest, setShowTest] = useState(false);
  const [evMethod, setEvMethod] = useState<"market-average" | "no-vig">("market-average");

  // Function to test raw API endpoint
  const testRawEndpoint = async () => {
    try {
      const params = new URLSearchParams();
      params.append("sport", sport);
      if (market && market !== "all") params.append("market", market);
      if (gameId) params.append("gameId", gameId);
      if (evMethod) params.append("evMethod", evMethod);

      const response = await fetch(`/api/prop-comparison/v2?${params.toString()}`);
      const data = await response.json();

      // Format and display the response
      const formattedResponse = JSON.stringify(data, null, 2);
      console.log("API Response:", data);

      // Create a downloadable JSON file
      const blob = new Blob([formattedResponse], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prop-comparison-v2-${sport}-${market || "all"}-${evMethod}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error testing endpoint:", error);
      alert("Error testing endpoint. Check console for details.");
    }
  };

  return (
    <div className="container py-8 space-y-8">
      <Card className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Prop Comparison V2 Debug</h1>
        
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Sport Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sport</label>
              <Select value={sport} onValueChange={setSport}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sport" />
                </SelectTrigger>
                <SelectContent>
                  {SPORTS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Market Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Market (Optional)</label>
              <Select value={market} onValueChange={setMarket}>
                <SelectTrigger>
                  <SelectValue placeholder="Select market" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Markets</SelectItem>
                  {MARKETS[sport as keyof typeof MARKETS]?.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Game ID Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Game ID (Optional)</label>
              <Input
                placeholder="Enter game ID"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
              />
            </div>

            {/* EV Method Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">EV Method (Optional)</label>
              <Select 
                value={evMethod} 
                onValueChange={(value: "market-average" | "no-vig") => setEvMethod(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select EV method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market-average">Market Average</SelectItem>
                  <SelectItem value="no-vig">No Vig</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Test Actions */}
          <div className="flex gap-4">
            <Button onClick={testRawEndpoint} variant="default">
              Test Raw Endpoint (Download JSON)
            </Button>
            <Button 
              onClick={() => setShowTest(!showTest)}
              variant="outline"
            >
              {showTest ? "Hide" : "Show"} Test Component
            </Button>
          </div>

          {/* Display current parameters */}
          <Card className="p-4 bg-muted/50">
            <pre className="text-xs">
              {JSON.stringify(
                {
                  endpoint: "/api/prop-comparison/v2",
                  parameters: {
                    sport,
                    market: market === "all" ? "all" : market,
                    gameId: gameId || "none",
                    evMethod: evMethod,
                  },
                },
                null,
                2
              )}
            </pre>
          </Card>
        </div>
      </Card>

      {/* Test Component */}
      {showTest && (
        <Card className="p-6">
          <TestOddsFetch
            sport={sport}
            market={market}
            gameId={gameId || undefined}
            evMethod={evMethod}
          />
        </Card>
      )}
    </div>
  );
} 