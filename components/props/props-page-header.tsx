"use client"

import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { TrendingUp, Clock, Target } from "lucide-react"

interface PropsPageHeaderProps {
  sport: string
  totalProps?: number
  lastUpdated?: string
}

export function PropsPageHeader({ sport, totalProps, lastUpdated }: PropsPageHeaderProps) {
  const sportName = sport.toUpperCase()

  // Sport-specific colors
  const sportColors = {
    nfl: "text-blue-400 dark:text-blue-300",
    nba: "text-orange-400 dark:text-orange-300",
    mlb: "text-green-400 dark:text-green-300",
    nhl: "text-purple-400 dark:text-purple-300",
  }

  const sportColor = sportColors[sport as keyof typeof sportColors] || "text-green-400 dark:text-green-300"

  return (
    <div className="space-y-6">
      {/* Main Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700">
                <Target className="h-6 w-6 text-white" />
              </div>
              <h1 className={cn("text-3xl font-bold tracking-tight text-foreground", sportColor)}>{sportName} Props</h1>
            </div>
            <Badge className="flex items-center gap-1 bg-green-500/20 text-green-400 dark:text-green-300 border-green-500/30">
              <div className="h-2 w-2 rounded-full bg-green-400 dark:bg-green-300 animate-pulse" />
              Live Odds
            </Badge>
          </div>
          <p className="text-muted-foreground">Compare odds across sportsbooks and find the best value</p>
        </div>

        {(totalProps || lastUpdated) && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              {lastUpdated && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {lastUpdated}
                </div>
              )}
              {totalProps && (
                <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <TrendingUp className="h-4 w-4 text-green-400 dark:text-green-300" />
                  {totalProps.toLocaleString()} props
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-background/50 border-border">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400 dark:bg-green-300" />
            <span className="text-sm font-medium text-muted-foreground">Live Markets</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-foreground">24</p>
        </Card>

        <Card className="p-4 bg-background/50 border-border">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-400 dark:bg-blue-300" />
            <span className="text-sm font-medium text-muted-foreground">Sportsbooks</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-foreground">12</p>
        </Card>

        <Card className="p-4 bg-background/50 border-border">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-purple-400 dark:bg-purple-300" />
            <span className="text-sm font-medium text-muted-foreground">Best Edges</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-foreground">8.2%</p>
        </Card>

        <Card className="p-4 bg-background/50 border-border">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-orange-400 dark:bg-orange-300" />
            <span className="text-sm font-medium text-muted-foreground">Avg EV</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-foreground">+4.1%</p>
        </Card>
      </div>
    </div>
  )
}
