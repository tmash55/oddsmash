"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CircleDot, Crown, ExternalLink } from "lucide-react";

const EXAMPLE_PICKS = [
  { id: 1, player: "Aaron Judge", team: "New York Yankees", odds: "+320", selected: false },
  { id: 2, player: "Shohei Ohtani", team: "Los Angeles Dodgers", odds: "+350", selected: false },
  { id: 3, player: "Juan Soto", team: "New York Yankees", odds: "+380", selected: false },
  { id: 4, player: "Pete Alonso", team: "New York Mets", odds: "+390", selected: false },
  { id: 5, player: "Matt Olson", team: "Atlanta Braves", odds: "+400", selected: false },
  { id: 6, player: "Mike Trout", team: "Los Angeles Angels", odds: "+440", selected: false },
  { id: 7, player: "Bryce Harper", team: "Philadelphia Phillies", odds: "+450", selected: false },
  { id: 8, player: "Yordan Alvarez", team: "Houston Astros", odds: "+470", selected: false },
  { id: 9, player: "Kyle Schwarber", team: "Philadelphia Phillies", odds: "+480", selected: false },
  { id: 10, player: "Fernando Tatis Jr.", team: "San Diego Padres", odds: "+500", selected: false },
];

export default function HRPicks() {
  const [picks, setPicks] = useState(EXAMPLE_PICKS);
  const [selectedCount, setSelectedCount] = useState(0);

  const toggleSelection = (id: number) => {
    if (selectedCount >= 5 && !picks.find(pick => pick.id === id)?.selected) {
      return; // Max 5 selections
    }
    
    setPicks(currentPicks => {
      const newPicks = currentPicks.map(pick => {
        if (pick.id === id) {
          const newSelected = !pick.selected;
          if (newSelected) {
            setSelectedCount(prev => prev + 1);
          } else {
            setSelectedCount(prev => prev - 1);
          }
          return { ...pick, selected: newSelected };
        }
        return pick;
      });
      return newPicks;
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">King of the Diamond</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4">
            Choose 2-5 players you think will hit a home run. If any of your selected 
            players hit a home run AND their team scores the most runs in their game, 
            you&apos;ll win a share of $1,000,000!
          </p>
          
          <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Your Picks: {selectedCount}/5</span>
            </div>
            <Button 
              variant="default" 
              size="sm"
              disabled={selectedCount < 2}
              className="text-sm"
            >
              Place Picks on DraftKings <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          </div>
          
          {selectedCount === 0 ? (
            <Alert className="mb-4">
              <AlertDescription>
                Select 2-5 players below to create your King of the Diamond entry
              </AlertDescription>
            </Alert>
          ) : null}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {picks.map(pick => (
              <div 
                key={pick.id}
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  pick.selected 
                    ? "bg-primary/10 border-primary" 
                    : "hover:bg-muted/40"
                }`}
                onClick={() => toggleSelection(pick.id)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      pick.selected ? "border-primary bg-primary text-white" : "border-gray-300"
                    }`}>
                      {pick.selected && <CircleDot className="h-3 w-3" />}
                    </div>
                    <div>
                      <div className="font-medium">{pick.player}</div>
                      <div className="text-xs text-muted-foreground">{pick.team}</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-green-600">
                    {pick.odds}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1 mb-1">
              <Crown className="h-4 w-4 text-yellow-600" /> 
              <span>To win: Player must hit a home run AND be on team with most runs</span>
            </div>
            <p className="text-xs">
              Note: These odds are examples only. Actual DraftKings odds may vary.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 