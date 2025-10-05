"use client"

import type React from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { TrendingUp, Clock } from "lucide-react"
import { SPORT_CONFIGS, type SupportedSport } from "@/types/sports"
import { useMediaQuery } from "@/hooks/use-media-query"

interface Sport {
  id: SupportedSport
  name: string
  icon: React.ReactNode
  color: string
  gradient: string
  isActive: boolean
  comingSoonMessage?: string
}

const sports: Sport[] = [
  {
    id: "mlb",
    name: "MLB",
    icon: <Image src="/images/sport-league/mlb-logo.svg" alt="MLB" width={16} height={16} className="object-contain" />,
    color: "bg-blue-500",
    gradient: "from-blue-500 to-blue-600",
    isActive: true,
  },
  {
    id: "wnba",
    name: "WNBA",
    icon: (
      <Image src="/images/sport-league/wnba-logo.svg" alt="WNBA" width={16} height={16} className="object-contain" />
    ),
    color: "bg-pink-700",
    gradient: "from-pink-700 to-pink-800",
    isActive: false,
    comingSoonMessage: "WNBA hit rates coming soon!",
  },
  {
    id: "nfl",
    name: "NFL",
    icon: <Image src="/images/sport-league/nfl-logo.svg" alt="NFL" width={16} height={16} className="object-contain" />,
    color: "bg-green-500",
    gradient: "from-green-500 to-green-600",
    isActive: false,
    comingSoonMessage: "NFL hit rates coming for the 2024 season!",
  },
  {
    id: "nba",
    name: "NBA",
    icon: <Image src="/images/sport-league/nba-logo.png" alt="NBA" width={14} height={16} className="object-contain" />,
    color: "bg-orange-500",
    gradient: "from-orange-500 to-orange-600",
    isActive: false,
    comingSoonMessage: "NBA hit rates coming soon!",
  },
  {
    id: "nhl",
    name: "NHL",
    icon: <Image src="/images/sport-league/nhl-logo.svg" alt="NHL" width={16} height={16} className="object-contain" />,
    color: "bg-purple-500",
    gradient: "from-purple-500 to-purple-600",
    isActive: false,
    comingSoonMessage: "NHL hit rates coming for the 2024-25 season!",
  },
]

interface HitRatesNavigationProps {
  currentSport: SupportedSport
  totalPlayers?: number
}

export function HitRatesNavigation({
  currentSport,
  totalPlayers,
}: HitRatesNavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const isMobile = useMediaQuery("(max-width: 768px)")

  const handleSportChange = (sportId: SupportedSport) => {
    const sportConfig = SPORT_CONFIGS[sportId]
    
    if (sportConfig.isActive) {
      // Navigate to the active sport with default market
      const defaultMarket = sportConfig.defaultMarket.toLowerCase().replace(/\s+/g, '+')
      router.push(`/${sportId}/hit-rates?market=${defaultMarket}`)
    } else {
      // For inactive sports, just show the coming soon page
      router.push(`/${sportId}/hit-rates`)
    }
  }

  const currentSportData = sports.find((s) => s.id === currentSport)
  const currentSportConfig = SPORT_CONFIGS[currentSport]

  if (isMobile) {
    return (
      <div className="w-full">
        <Card
          className={cn(
            "backdrop-blur-sm overflow-hidden border-x-0 rounded-none",
            // Dark theme
            "dark:bg-slate-900/50 dark:border-slate-800",
            // Light theme
            "bg-white/50 border-slate-200",
          )}
        >
          <div className="p-4">
            {/* Mobile Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className={cn("text-lg font-bold", "dark:text-white text-slate-900")}>
                    {currentSport.toUpperCase()} Hit Rates
                  </h1>
                  {!currentSportConfig.isActive && (
                    <p className={cn("text-xs", "dark:text-slate-400 text-slate-600")}>
                      {currentSportConfig.comingSoonMessage}
                    </p>
                  )}
                </div>
              </div>
              {totalPlayers && currentSportConfig.isActive && (
                <span className={cn("text-sm font-medium", "dark:text-slate-400 text-slate-600")}>
                  {totalPlayers.toLocaleString()} players
                </span>
              )}
            </div>

            {/* Mobile Sports Selector */}
            <div>
              <label
                className={cn(
                  "block text-xs font-semibold uppercase tracking-wide mb-2",
                  "dark:text-slate-400 text-slate-600",
                )}
              >
                Sports
              </label>
              <Select value={currentSport} onValueChange={handleSportChange}>
                <SelectTrigger
                  className={cn(
                    "h-12 text-sm font-medium transition-all duration-200 active:scale-[0.98]",
                    // Dark theme
                    "dark:bg-slate-800/50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800/70",
                    // Light theme - enhanced hover effects
                    "bg-white border-slate-300 text-slate-900 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 hover:shadow-md hover:border-slate-400",
                    "focus:ring-2 focus:ring-green-500/20 focus:border-green-500",
                  )}
                >
                  <SelectValue>
                    <div className="flex items-center gap-3">
                      <div className={cn("p-1.5 rounded-lg", "dark:bg-slate-700/50 bg-slate-100")}>
                        {currentSportData?.icon}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-semibold">{currentSportData?.name}</span>
                        {!currentSportConfig.isActive && (
                          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                            <Clock className="h-3 w-3 mr-1" />
                            Coming Soon
                          </Badge>
                        )}
                      </div>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent
                  className={cn(
                    "border shadow-xl",
                    "dark:bg-slate-900 dark:border-slate-700",
                    "bg-white border-slate-200",
                  )}
                >
                  {sports.map((sport) => (
                    <SelectItem
                      key={sport.id}
                      value={sport.id}
                      className={cn(
                        "h-14 cursor-pointer transition-colors",
                        "dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:bg-slate-800",
                        "text-slate-900 hover:bg-slate-50 focus:bg-slate-50",
                      )}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className={cn("p-1.5 rounded-lg", "dark:bg-slate-700/50 bg-slate-100")}>
                          {sport.icon}
                        </div>
                        <div className="flex flex-col items-start flex-1">
                          <span className="font-medium">{sport.name}</span>
                          {!sport.isActive && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {sport.comingSoonMessage}
                            </span>
                          )}
                        </div>
                        {sport.isActive && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                            Active
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Desktop version
  return (
    <div className="w-full">
      <Card
        className={cn(
          "backdrop-blur-sm overflow-hidden",
          // Dark theme
          "dark:bg-slate-900/50 dark:border-slate-800",
          // Light theme
          "bg-white/50 border-slate-200",
        )}
      >
        <div className="p-4">
          {/* Desktop Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className={cn("text-xl font-bold", "dark:text-white text-slate-900")}>
                  {currentSport.toUpperCase()} Hit Rates
                </h1>
                {!currentSportConfig.isActive && (
                  <p className={cn("text-sm", "dark:text-slate-400 text-slate-600")}>
                    {currentSportConfig.comingSoonMessage}
                  </p>
                )}
              </div>
            </div>
            {totalPlayers && currentSportConfig.isActive && (
              <div className={cn("text-sm", "dark:text-slate-400 text-slate-600")}>
                {totalPlayers.toLocaleString()} players • {sports.filter(s => s.isActive).length} active leagues
              </div>
            )}
          </div>

          {/* Sports Navigation */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className={cn("text-xs font-semibold uppercase tracking-wide", "dark:text-slate-400 text-slate-600")}>
                Sports
              </h3>
              <div className={cn("text-xs", "dark:text-slate-500 text-slate-500")}>
                {sports.filter(s => s.isActive).length} active • {sports.filter(s => !s.isActive).length} coming soon
              </div>
            </div>
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-1 px-1">
                {sports.map((sport) => {
                  const isActive = currentSport === sport.id
                  const isAvailable = sport.isActive
                  
                  return (
                    <Button
                      key={sport.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSportChange(sport.id)}
                      className={cn(
                        "relative flex items-center gap-2 whitespace-nowrap text-sm h-10 px-4 rounded-lg transition-all duration-200",
                        "hover:scale-105 active:scale-95",
                        isActive
                          ? "text-white shadow-lg"
                          : cn(
                              // Dark theme inactive - enhanced hover effects
                              "dark:text-slate-300 dark:hover:bg-gradient-to-r dark:hover:from-slate-800/70 dark:hover:to-slate-700/50 dark:border-slate-700/50 dark:hover:text-white dark:hover:shadow-md dark:hover:border-slate-600",
                              // Light theme inactive - enhanced hover effects
                              "text-slate-700 hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-200 hover:text-slate-900 hover:shadow-md hover:border-slate-300 border border-slate-200 hover:border-opacity-80",
                            ),
                        !isAvailable && "opacity-60",
                      )}
                      disabled={!isAvailable && !isActive}
                    >
                      {isActive && (
                        <div
                          className={cn("absolute inset-0 rounded-lg bg-gradient-to-r opacity-90", sport.gradient)}
                        />
                      )}
                      <div className="relative z-10 flex items-center gap-2">
                        <div
                          className={cn(
                            "p-1 rounded-md",
                            isActive ? "bg-white/20" : cn("dark:bg-slate-700/50 bg-slate-200/50"),
                          )}
                        >
                          {sport.icon}
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{sport.name}</span>
                          {!isAvailable && (
                            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 mt-0.5">
                              <Clock className="h-2.5 w-2.5 mr-1" />
                              Coming Soon
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Button>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      </Card>
    </div>
  )
} 