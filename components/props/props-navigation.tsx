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
import { Target, User, LineChart, Dices, Medal } from "lucide-react"
import { SUPPORTED_MARKETS } from "@/lib/constants/markets"
import { useMediaQuery } from "@/hooks/use-media-query"

interface Sport {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  gradient: string
}

interface OddsCategory {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  gradient: string
}

const sports: Sport[] = [
  {
    id: "mlb",
    name: "MLB",
    icon: <Image src="/images/sport-league/mlb-logo.svg" alt="MLB" width={16} height={16} className="object-contain" />,
    color: "bg-blue-500",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    id: "wnba",
    name: "WNBA",
    icon: (
      <Image src="/images/sport-league/wnba-logo.svg" alt="WNBA" width={16} height={16} className="object-contain" />
    ),
    color: "bg-pink-700",
    gradient: "from-pink-700 to-pink-800",
  },
  {
    id: "nfl",
    name: "NFL",
    icon: <Image src="/images/sport-league/nfl-logo.svg" alt="NFL" width={16} height={16} className="object-contain" />,
    color: "bg-green-500",
    gradient: "from-green-500 to-green-600",
  },
  {
    id: "ncaaf",
    name: "NCAAF",
    icon: <Medal className="h-4 w-4" />,
    color: "bg-red-500",
    gradient: "from-red-500 to-red-600",
  },
  {
    id: "nba",
    name: "NBA",
    icon: <Image src="/images/sport-league/nba-logo.png" alt="NBA" width={14} height={16} className="object-contain" />,
    color: "bg-orange-500",
    gradient: "from-orange-500 to-orange-600",
  },
 
  {
    id: "nhl",
    name: "NHL",
    icon: <Image src="/images/sport-league/nhl-logo.svg" alt="NHL" width={16} height={16} className="object-contain" />,
    color: "bg-purple-500",
    gradient: "from-purple-500 to-purple-600",
  },
]

const oddsCategories: OddsCategory[] = [
  {
    id: "player-props",
    name: "Player Props",
    icon: <User className="h-4 w-4" />,
    color: "bg-purple-500",
    gradient: "from-purple-500 to-purple-600",
  },
  {
    id: "game-lines",
    name: "Game Lines",
    icon: <LineChart className="h-4 w-4" />,
    color: "bg-blue-500",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    id: "futures",
    name: "Futures",
    icon: <Dices className="h-4 w-4" />,
    color: "bg-amber-500",
    gradient: "from-amber-500 to-amber-600",
  },
]

interface PropsNavigationCompactProps {
  currentSport: string
  currentMarket?: string
  currentCategory?: string
  totalProps?: number
}

export function PropsNavigation({
  currentSport,
  currentMarket,
  currentCategory,
  totalProps,
}: PropsNavigationCompactProps) {
  const router = useRouter()
  const pathname = usePathname()
  const isMobile = useMediaQuery("(max-width: 768px)")

  const activeCategory = pathname.split("/").filter(Boolean)[2] || "player-props"

  const handleSportChange = (sportId: string) => {
    const category = activeCategory || "player-props"

    if (category === "player-props") {
      const defaultMarket = SUPPORTED_MARKETS[sportId]?.[0]
      if (defaultMarket) {
        router.push(`/${sportId}/odds/${category}?market=${encodeURIComponent(defaultMarket)}`)
      } else {
        router.push(`/${sportId}/odds/${category}`)
      }
    } else if (category === "game-lines") {
      router.push(`/${sportId}/odds/${category}?market=h2h`)
    } else {
      router.push(`/${sportId}/odds/${category}`)
    }
  }

  const handleCategoryChange = (categoryId: string) => {
    if (categoryId === "player-props") {
      const defaultMarket = SUPPORTED_MARKETS[currentSport]?.[0]
      if (defaultMarket) {
        router.push(`/${currentSport}/odds/${categoryId}?market=${encodeURIComponent(defaultMarket)}`)
      } else {
        router.push(`/${currentSport}/odds/${categoryId}`)
      }
    } else if (categoryId === "game-lines") {
      router.push(`/${currentSport}/odds/${categoryId}?market=h2h`)
    } else {
      router.push(`/${currentSport}/odds/${categoryId}`)
    }
  }

  const currentSportData = sports.find((s) => s.id === currentSport)
  const currentCategoryData = oddsCategories.find((c) => c.id === activeCategory)

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
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                  <Target className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className={cn("text-lg font-bold", "dark:text-white text-slate-900")}>
                    {currentSport.toUpperCase()} Odds
                  </h1>
                 
                </div>
              </div>
              {totalProps && (
                <span className={cn("text-sm font-medium", "dark:text-slate-400 text-slate-600")}>
                  {totalProps.toLocaleString()}
                </span>
              )}
            </div>

            {/* Mobile Selects with Enhanced Touch Zones */}
            <div className="space-y-3">
              {/* Sports Selector */}
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
                      "focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500",
                    )}
                  >
                    <SelectValue>
                      <div className="flex items-center gap-3">
                        <div className={cn("p-1.5 rounded-lg", "dark:bg-slate-700/50 bg-slate-100")}>
                          {currentSportData?.icon}
                        </div>
                        <span className="font-semibold">{currentSportData?.name}</span>
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
                          "h-12 cursor-pointer transition-colors",
                          "dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:bg-slate-800",
                          "text-slate-900 hover:bg-slate-50 focus:bg-slate-50",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("p-1.5 rounded-lg", "dark:bg-slate-700/50 bg-slate-100")}>
                            {sport.icon}
                          </div>
                          <span className="font-medium">{sport.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Categories Selector */}
              <div>
                <label
                  className={cn(
                    "block text-xs font-semibold uppercase tracking-wide mb-2",
                    "dark:text-slate-400 text-slate-600",
                  )}
                >
                  Categories
                </label>
                <Select value={activeCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger
                    className={cn(
                      "h-12 text-sm font-medium transition-all duration-200 active:scale-[0.98]",
                      // Dark theme
                      "dark:bg-slate-800/50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800/70",
                      // Light theme - enhanced hover effects
                      "bg-white border-slate-300 text-slate-900 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 hover:shadow-md hover:border-slate-400",
                      "focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500",
                    )}
                  >
                    <SelectValue>
                      <div className="flex items-center gap-3">
                        <div className={cn("p-1.5 rounded-lg", "dark:bg-slate-700/50 bg-slate-100")}>
                          {currentCategoryData?.icon}
                        </div>
                        <span className="font-semibold">{currentCategoryData?.name}</span>
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
                    {oddsCategories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id}
                        className={cn(
                          "h-12 cursor-pointer transition-colors",
                          "dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:bg-slate-800",
                          "text-slate-900 hover:bg-slate-50 focus:bg-slate-50",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("p-1.5 rounded-lg", "dark:bg-slate-700/50 bg-slate-100")}>
                            {category.icon}
                          </div>
                          <span className="font-medium">{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Desktop version with theme support
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
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                <Target className="h-4 w-4 text-white" />
              </div>
              <h1 className={cn("text-xl font-bold", "dark:text-white text-slate-900")}>
                {currentSport.toUpperCase()} Odds
              </h1>
              
            </div>
            {totalProps && (
              <div className={cn("text-sm", "dark:text-slate-400 text-slate-600")}>
                {totalProps.toLocaleString()} props • {sports.length} leagues • {oddsCategories.length} types
              </div>
            )}
          </div>

          {/* Sports Navigation */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className={cn("text-xs font-semibold uppercase tracking-wide", "dark:text-slate-400 text-slate-600")}>
                Sports
              </h3>
              <div className={cn("text-xs", "dark:text-slate-500 text-slate-500")}>{sports.length} leagues</div>
            </div>
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-1 px-1">
                {sports.map((sport) => {
                  const isActive = currentSport === sport.id
                  return (
                    <Button
                      key={sport.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSportChange(sport.id)}
                      className={cn(
                        "relative flex items-center gap-2 whitespace-nowrap text-sm h-9 px-4 rounded-lg transition-all duration-200",
                        "hover:scale-105 active:scale-95",
                        isActive
                          ? "text-white shadow-lg"
                          : cn(
                              // Dark theme inactive - enhanced hover effects
                              "dark:text-slate-300 dark:hover:bg-gradient-to-r dark:hover:from-slate-800/70 dark:hover:to-slate-700/50 dark:border-slate-700/50 dark:hover:text-white dark:hover:shadow-md dark:hover:border-slate-600",
                              // Light theme inactive - enhanced hover effects
                              "text-slate-700 hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-200 hover:text-slate-900 hover:shadow-md hover:border-slate-300 border border-slate-200 hover:border-opacity-80",
                            ),
                      )}
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
                        <span className="font-medium">{sport.name}</span>
                      </div>
                    </Button>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Categories Navigation */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className={cn("text-xs font-semibold uppercase tracking-wide", "dark:text-slate-400 text-slate-600")}>
                Categories
              </h3>
              <div className={cn("text-xs", "dark:text-slate-500 text-slate-500")}>{oddsCategories.length} types</div>
            </div>
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-1 px-1">
                {oddsCategories.map((category) => {
                  const isActive = activeCategory === category.id
                  return (
                    <Button
                      key={category.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCategoryChange(category.id)}
                      className={cn(
                        "relative flex items-center gap-1.5 whitespace-nowrap text-sm h-8 px-3 rounded-lg transition-all duration-200",
                        "hover:scale-105 active:scale-95",
                        isActive
                          ? "text-white shadow-lg"
                          : cn(
                              // Dark theme inactive - enhanced hover effects
                              "dark:text-slate-300 dark:hover:bg-gradient-to-r dark:hover:from-slate-800/70 dark:hover:to-slate-700/50 dark:border-slate-700/50 dark:hover:text-white dark:hover:shadow-md dark:hover:border-slate-600",
                              // Light theme inactive - enhanced hover effects
                              "text-slate-700 hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-200 hover:text-slate-900 hover:shadow-md hover:border-slate-300 border border-slate-200 hover:border-opacity-80",
                            ),
                      )}
                    >
                      {isActive && (
                        <div
                          className={cn("absolute inset-0 rounded-lg bg-gradient-to-r opacity-90", category.gradient)}
                        />
                      )}
                      <div className="relative z-10 flex items-center gap-1.5">
                        <div
                          className={cn(
                            "p-0.5 rounded-sm",
                            isActive ? "bg-white/20" : cn("dark:bg-slate-700/50 bg-slate-200/50"),
                          )}
                        >
                          {category.icon}
                        </div>
                        <span className="font-medium">{category.name}</span>
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
