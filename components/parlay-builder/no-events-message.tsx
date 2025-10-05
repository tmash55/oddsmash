"use client";

import { Button } from "@/components/ui/button";
import { CalendarIcon, RefreshCw } from "lucide-react";

interface NoEventsMessageProps {
  sportName: string;
  onRetry: () => void;
  isLoading: boolean;
  isError: boolean;
  isOffSeason?: boolean;
}

export function NoEventsMessage({
  sportName,
  onRetry,
  isLoading,
  isError,
  isOffSeason,
}: NoEventsMessageProps) {
  return (
    <div className="bg-card rounded-lg border p-8 text-center">
      <div className="flex justify-center mb-4">
        {isOffSeason ? (
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
            <CalendarIcon className="h-6 w-6 text-amber-500" />
          </div>
        ) : isError ? (
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <CalendarIcon className="h-6 w-6 text-destructive" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <CalendarIcon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>

      <h3 className="text-lg font-medium mb-2">
        {isOffSeason
          ? "Off-Season Period"
          : isError
          ? "No Events Available"
          : "No Games Found"}
      </h3>

      <p className="text-muted-foreground mb-4">
        {isOffSeason
          ? `${sportName} is currently in the off-season. Please check back during the regular season or select another sport.`
          : isError
          ? `There are currently no events available for ${sportName}.`
          : `We couldn't find any games for ${sportName} at this time.`}
      </p>

      {!isOffSeason && (
        <Button
          variant="outline"
          onClick={onRetry}
          disabled={isLoading}
          className="mx-auto"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          {isLoading ? "Checking..." : "Check Again"}
        </Button>
      )}
    </div>
  );
}
