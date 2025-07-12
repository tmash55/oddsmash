"use client"

import type React from "react"
import { useRouter, usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Trophy, Target, TrendingUp, Calendar, Users, BarChart3 } from "lucide-react"
import { SUPPORTED_MARKETS } from "@/lib/constants/markets"

interface Sport {
  id: string
  name: string
  icon: React.ReactNode
  color: string
}

interface Market {
  id: string
  name: string
  icon: React.ReactNode
  count?: number
  color: string
}

const sports: Sport[] = [
  { id: "nfl", name: "NFL", icon: <Trophy className="h-3 w-3" />, color: "bg-blue-500" },
  { id: "nba", name: "NBA", icon: <Target className="h-3 w-3" />, color: "bg-orange-500" },
  { id: "mlb", name: "MLB", icon: <BarChart3 className="h-3 w-3" />, color: "bg-green-500" },
  { id: "nhl", name: "NHL", icon: <TrendingUp className="h-3 w-3" />, color: "bg-purple-500" },
]

interface PropsNavigationProps {
  currentSport: string
  currentMarket?: string
  totalProps?: number
}

export function PropsNavigation({ currentSport, currentMarket, totalProps }: PropsNavigationProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleSportChange = (sportId: string) => {
    // Get the default market for the selected sport
    const defaultMarket = SUPPORTED_MARKETS[sportId]?.[0]
    if (defaultMarket) {
      // Use the market as a query parameter
      router.push(`/${sportId}/props?market=${encodeURIComponent(defaultMarket)}`)
    } else {
      // Fallback to just the sport props page if no markets defined
      router.push(`/${sportId}/props`)
    }
  }

  const currentSportData = sports.find((s) => s.id === currentSport)

  return (
    <Card className="bg-background/50 border-border p-4">
      <div className="space-y-4">
        {/* Header with Sport */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700">
            <Target className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-xl font-bold text-foreground">{currentSport.toUpperCase()} Props</h1>
          <Badge className="bg-green-500/20 text-green-400 dark:text-green-300 border-green-500/30 text-xs">
            <div className="h-1.5 w-1.5 rounded-full bg-green-400 dark:bg-green-300 animate-pulse mr-1" />
            Live
          </Badge>
        </div>

        {/* Sports - Horizontal Scroll */}
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">Sports</div>
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {sports.map((sport) => (
                <Button
                  key={sport.id}
                  variant={currentSport === sport.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSportChange(sport.id)}
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap text-xs h-8 px-3",
                    currentSport === sport.id
                      ? `${sport.color} hover:${sport.color}/90 text-white border-transparent`
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border-border",
                  )}
                >
                  {sport.icon}
                  {sport.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </Card>
  )
}
