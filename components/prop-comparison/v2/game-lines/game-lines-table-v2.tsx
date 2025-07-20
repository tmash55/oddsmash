"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { sportsbooks } from "@/data/sportsbooks"
import { useMemo, useState } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { OddsDisplay } from "@/components/shared/odds-display"
import { motion } from "framer-motion"
import { useBetActions } from "@/hooks/use-bet-actions"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BetslipDialog } from "@/components/betting/betslip-dialog"
import { SPORTSBOOK_ID_MAP, REVERSE_SPORTSBOOK_MAP, getNormalizedBookmakerId, getBookmakerLogoId } from "@/lib/constants/sportsbook-mappings"
import { getPlayerHeadshotUrl, getTeamLogoUrl } from '@/lib/constants/sport-assets'

// Helper functions for team logos and abbreviations
function getTeamLogoPath(sport: string): string {
  switch(sport) {
    case "football_nfl":
      return "nfl-teams"
    case "basketball_wnba":
      return "team-logos/wnba"
    case "baseball_mlb":
    default:
      return "mlb-teams"
  }
}

function getTeamLogoFilename(abbr: string, sport: string = "baseball_mlb"): string {
  if (!abbr) return "default"
  const teamAbbreviationMap: Record<string, string> = {
    // American League
    LAA: "LAA", // Los Angeles Angels
    BAL: "BAL", // Baltimore Orioles
    BOS: "BOS", // Boston Red Sox
    CWS: "CHW", // Chicago White Sox
    CHW: "CHW", // Chicago White Sox (alternative)
    CLE: "CLE", // Cleveland Guardians
    DET: "DET", // Detroit Tigers
    HOU: "HOU", // Houston Astros
    KC: "KC", // Kansas City Royals
    MIN: "MIN", // Minnesota Twins
    NYY: "NYY", // New York Yankees
    OAK: "OAK", // Oakland Athletics
    SEA: "SEA", // Seattle Mariners
    TB: "TB", // Tampa Bay Rays
    TEX: "TEX", // Texas Rangers
    TOR: "TOR", // Toronto Blue Jays
    // National League
    ARI: "AZ", // Arizona Diamondbacks
    ATL: "ATL", // Atlanta Braves
    CHC: "CHC", // Chicago Cubs
    CIN: "CIN", // Cincinnati Reds
    COL: "COL", // Colorado Rockies
    LAD: "LAD", // Los Angeles Dodgers
    MIA: "MIA", // Miami Marlins
    MIL: "MIL", // Milwaukee Brewers
    NYM: "NYM", // New York Mets
    PHI: "PHI", // Philadelphia Phillies
    PIT: "PIT", // Pittsburgh Pirates
    SD: "SD", // San Diego Padres
    SF: "SF", // San Francisco Giants
    STL: "STL", // St. Louis Cardinals
    WSH: "WSH", // Washington Nationals
  }
  const upperAbbr = abbr.toUpperCase()
  return teamAbbreviationMap[upperAbbr] || upperAbbr
}

// Format date and time
function formatGameDateTime(date: string) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

// Format odds to always show + for positive odds
function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : odds.toString()
}

// Convert American odds to decimal
function americanToDecimal(americanOdds: number): number {
  if (americanOdds === 0) return 1
  return americanOdds > 0 ? (americanOdds / 100) + 1 : (100 / Math.abs(americanOdds)) + 1
}

// Convert decimal odds to American
function decimalToAmerican(decimalOdds: number): number {
  if (decimalOdds === 1) return 0
  const american = decimalOdds >= 2 
    ? Math.round((decimalOdds - 1) * 100) 
    : Math.round(-100 / (decimalOdds - 1))
  return american
}

// Calculate implied probability from American odds
function calculateImpliedProbability(odds: number): number {
  return odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100)
}

// Calculate EV percentage using best odds and average odds
function calculateEVPercentage(bestOdds: number, avgOdds: number): number | null {
  if (!bestOdds || !avgOdds) return null

  const bestDecimal = americanToDecimal(bestOdds)
  const avgDecimal = americanToDecimal(avgOdds)

  if (!bestDecimal || !avgDecimal) return null

  const trueProb = 1 / avgDecimal
  const ev = (trueProb * bestDecimal - 1) * 100

  return Math.round(ev * 10) / 10 // Round to 1 decimal
}

// Function to format total line with odds
function formatTotalLine(point: number | undefined, price: number, isOver: boolean): string {
  if (!point) return formatOdds(price)
  return `${isOver ? 'o' : 'u'}${point} ${formatOdds(price)}`
}

interface GameOdds {
  event_id: string
  sport_key: string
  commence_time: string
  home_team: {
    name: string
    abbreviation: string
  }
  away_team: {
    name: string
    abbreviation: string
  }
  bookmakers: {
    key: string
    title: string
    last_update: string
    markets: {
      key: string
      outcomes: {
        name: string
        price: number
        point?: number
        link?: string
        sid?: string
        line?: string
      }[]
      line?: string
      is_standard?: boolean
      lines?: {
        [key: string]: {
          point: number
          sportsbooks: {
            [key: string]: {
              is_standard: boolean
              over?: {
                price: number
                link?: string
                sid?: string
              }
              under?: {
                price: number
                link?: string
                sid?: string
              }
            }
          }
        }
      }
    }[]
  }[]
  last_update: string
  primary_line?: string
}

interface GameLinesTableV2Props {
  data: GameOdds[]
  sport: string
  sortField: "time" | "home" | "away" | "odds"
  sortDirection: "asc" | "desc"
  onSortChange: (field: "time" | "home" | "away" | "odds", direction: "asc" | "desc") => void
  evMethod?: "market-average" | "no-vig"
  selectedLine?: string | null
  selectedMarket: string  // Add this line
}

// Add function to calculate average odds for a team
function calculateAverageOdds(game: GameOdds, teamName: string): number | null {
  let totalOdds = 0
  let count = 0

  game.bookmakers.forEach((bookmaker) => {
    const h2hMarket = bookmaker.markets.find((m) => m.key === "h2h")
    if (h2hMarket) {
      const teamOutcome = h2hMarket.outcomes.find((o) => o.name === teamName)
      if (teamOutcome) {
        totalOdds += teamOutcome.price
        count++
      }
    }
  })

  return count > 0 ? Math.round(totalOdds / count) : null
}

export function GameLinesTableV2({
  data,
  sport,
  sortField,
  sortDirection,
  onSortChange,
  evMethod = "market-average",
  selectedLine,
  selectedMarket,  // Add this line
}: GameLinesTableV2Props) {
  const activeSportsbooks = sportsbooks.filter((book) => book.isActive)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [showBetslipDialog, setShowBetslipDialog] = useState(false)
  const [pendingSelection, setPendingSelection] = useState<any>(null)

  // Log active sportsbooks and check which ones are missing from the data
  console.log('[Component] Active vs Available Sportsbooks:', {
    active: activeSportsbooks.map(b => ({
      id: b.id,
      name: b.name
    })),
    available: data?.[0]?.bookmakers.map(b => ({
      key: b.key,
      title: b.title
    })) || [],
    missing: activeSportsbooks
      .filter(active => !data?.[0]?.bookmakers.some(b => b.key === active.id.toLowerCase()))
      .map(b => ({
        id: b.id,
        name: b.name
      }))
  })

  console.log('[Component] Received game data:', {
    count: data?.length || 0,
    firstGame: data?.[0] ? {
      event_id: data[0].event_id,
      teams: `${data[0].away_team.name} @ ${data[0].home_team.name}`,
      bookmakerCount: data[0].bookmakers?.length || 0,
      bookmakerKeys: data[0].bookmakers?.map(b => b.key) || []
    } : null
  })

  const { betslips, handleBetslipSelect, handleCreateBetslip, conflictingSelection, handleResolveConflict } =
    useBetActions()

  // Toggle row expansion
  const toggleRow = (gameId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(Array.from(prev))
      if (newSet.has(gameId)) {
        newSet.delete(gameId)
      } else {
        newSet.add(gameId)
      }
      return newSet
    })
  }

  // Function to get best odds for a team from bookmakers
  const getBestOdds = (game: GameOdds, teamName: string, line?: string | null): { price: number; bookmaker: string; link?: string } | null => {
    let bestOdds: number | null = null
    let bestBook: string | null = null
    let bestLink: string | undefined

    console.log(`[Component] Getting best odds for ${teamName}:`, {
      gameId: game.event_id,
      bookmakerCount: game.bookmakers?.length || 0,
      line
    })

    game.bookmakers.forEach((bookmaker) => {
      // For moneyline, we just need to find the h2h market
      const market = bookmaker.markets.find(m => m.key === "h2h")

      if (market) {
        const teamOutcome = market.outcomes.find(o => o.name.toLowerCase() === teamName.toLowerCase())
        // Only consider standard lines unless a specific line is requested
        const isStandardLine = line ? line === market.line : market.is_standard
        
        console.log(`[Component] Checking ${bookmaker.key}:`, {
          hasMarket: !!market,
          outcomeFound: !!teamOutcome,
          price: teamOutcome?.price,
          isStandardLine
        })
        
        if (teamOutcome && isStandardLine && (!bestOdds || teamOutcome.price > bestOdds)) {
          bestOdds = teamOutcome.price
          bestBook = bookmaker.key
          bestLink = teamOutcome.link
        }
      }
    })

    const result = bestOdds && bestBook ? { price: bestOdds, bookmaker: bestBook, link: bestLink } : null
    console.log(`[Component] Best odds result for ${teamName}:`, result)
    return result
  }

  // Function to get average odds for a team
  const getAverageOdds = (game: GameOdds, teamName: string, line?: string | null) => {
    let totalDecimalOdds = 0
    let count = 0

    game.bookmakers.forEach((bookmaker) => {
      const h2hMarket = bookmaker.markets.find((m) => m.key === "h2h")
      if (h2hMarket) {
        const teamOutcome = h2hMarket.outcomes.find((o) => o.name.toLowerCase() === teamName.toLowerCase())
        // Only consider standard lines unless a specific line is requested
        const isStandardLine = line ? line === h2hMarket.line : h2hMarket.is_standard
        
        if (teamOutcome && isStandardLine) {
          // Convert to decimal odds for averaging
          totalDecimalOdds += americanToDecimal(teamOutcome.price)
          count++
        }
      }
    })

    if (count === 0) return null

    // Calculate average decimal odds
    const averageDecimalOdds = totalDecimalOdds / count
    
    // Convert back to American odds
    const averageAmericanOdds = decimalToAmerican(averageDecimalOdds)

    console.log(`[Component] Average odds for ${teamName}:`, {
      totalDecimalOdds,
      count,
      averageDecimalOdds,
      averageAmericanOdds,
      line,
      isStandardOnly: !line
    })

    return averageAmericanOdds
  }

  // Function to create betslip selection
  const createBetslipSelection = (game: GameOdds, team: "home" | "away") => {
    const teamData = team === "home" ? game.home_team : game.away_team
    const bestOdds = getBestOdds(game, teamData.name)

    if (!bestOdds) return null

    return {
      event_id: game.event_id,
      sport_key: game.sport_key,
      market_key: "h2h",
      market_type: "game_lines",
      bet_type: "moneyline",
      team_name: teamData.name,
      team_abbreviation: teamData.abbreviation,
      commence_time: game.commence_time,
      home_team: game.home_team.name,
      away_team: game.away_team.name,
      odds_data: game.bookmakers.reduce((acc, bookmaker) => {
        const h2hMarket = bookmaker.markets.find((m) => m.key === "h2h")
        if (h2hMarket) {
          const teamOutcome = h2hMarket.outcomes.find((o) => o.name === teamData.name)
          if (teamOutcome) {
            acc[bookmaker.key] = {
              price: teamOutcome.price,
              link: teamOutcome.link,
              sid: teamOutcome.sid,
              last_update: bookmaker.last_update,
            }
          }
        }
        return acc
      }, {} as Record<string, any>),
      market_display: "Moneyline",
      selection: teamData.name,
    }
  }

  // Function to handle adding to betslip
  const handleAddToBetslip = (game: GameOdds, team: "home" | "away") => {
    const selection = createBetslipSelection(game, team)
    if (selection) {
      setPendingSelection(selection)
      setShowBetslipDialog(true)
    }
  }

  // Sort the data
  const sortedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    
    return [...data].sort((a, b) => {
      try {
        if (sortField === "time") {
          const aTime = new Date(a.commence_time).getTime();
          const bTime = new Date(b.commence_time).getTime();
          return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
        }

        if (sortField === "home") {
          const aName = a.home_team?.name || '';
          const bName = b.home_team?.name || '';
          return sortDirection === "asc" ? aName.localeCompare(bName) : bName.localeCompare(aName);
        }

        if (sortField === "away") {
          const aName = a.away_team?.name || '';
          const bName = b.away_team?.name || '';
          return sortDirection === "asc" ? aName.localeCompare(bName) : bName.localeCompare(aName);
        }

        if (sortField === "odds") {
          const aOdds = getBestOdds(a, a.home_team?.name || '', a.primary_line || "standard")?.price || 0;
          const bOdds = getBestOdds(b, b.home_team?.name || '', b.primary_line || "standard")?.price || 0;
          return sortDirection === "asc" ? aOdds - bOdds : bOdds - aOdds;
        }

        return 0;
      } catch (error) {
        console.error('Error sorting data:', error);
        return 0;
      }
    });
  }, [data, sortField, sortDirection, getBestOdds]);

  return (
    <>
      <div className={cn(
        "rounded-md border bg-slate-950/50 backdrop-blur-sm",
        isMobile && "-mx-4 border-x-0 rounded-none",
      )}>
        <div className="relative h-[70vh] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-30 bg-slate-950 border-b border-slate-800 shadow-lg">
              <TableRow className="hover:bg-transparent border-slate-800">
                <TableHead className="w-[300px] bg-slate-950 text-slate-200 font-semibold sticky top-0">
                  <div className="flex items-center justify-between gap-1">
                    <span>Game</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      onClick={() =>
                        onSortChange(
                          "time",
                          sortField === "time" ? (sortDirection === "asc" ? "desc" : "asc") : "asc",
                        )
                      }
                    >
                      {sortField === "time" ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </TableHead>
                <TableHead className="w-[120px] bg-slate-950 text-slate-200 font-semibold sticky top-0">Best Odds</TableHead>
                <TableHead className="w-[120px] bg-slate-950 text-slate-200 font-semibold sticky top-0">Average</TableHead>
                <TableHead className="w-[100px] bg-slate-950 text-slate-200 font-semibold sticky top-0 text-center">EV%</TableHead>
                {activeSportsbooks.map((book) => (
                  <TableHead key={book.id} className="text-center w-[80px] bg-slate-950 sticky top-0">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex justify-center">
                            <Image
                              src={book.logo}
                              alt={book.name}
                              width={32}
                              height={32}
                              className="object-contain"
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{book.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                ))}
                <TableHead className="w-[60px] text-center bg-slate-950 text-slate-200 font-semibold sticky top-0">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((game) => {
                const isExpanded = expandedRows.has(game.event_id)
                const homeTeamAbbr = game.home_team.abbreviation
                const awayTeamAbbr = game.away_team.abbreviation
                const currentLine = game.primary_line || "standard"

                // Get best odds for both teams at the current line
                const homeBestOdds = getBestOdds(game, game.home_team.name, currentLine)
                const awayBestOdds = getBestOdds(game, game.away_team.name, currentLine)

                // Get average odds for both teams at the current line
                const homeAvgOdds = getAverageOdds(game, game.home_team.name, currentLine)
                const awayAvgOdds = getAverageOdds(game, game.away_team.name, currentLine)

                // Calculate EV for both teams
                const homeEV = homeAvgOdds && homeBestOdds ? calculateEVPercentage(homeBestOdds.price, homeAvgOdds) : null
                const awayEV = awayAvgOdds && awayBestOdds ? calculateEVPercentage(awayBestOdds.price, awayAvgOdds) : null

                return (
                  <TableRow key={game.event_id} className="border-slate-800 hover:bg-slate-900/50">
                    <TableCell className="text-slate-200">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="w-full">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <Image
                                  src={getTeamLogoUrl(awayTeamAbbr, sport)}
                                  alt={awayTeamAbbr}
                                  width={16}
                                  height={16}
                                  className="h-4 w-4"
                                />
                                <span className="font-medium text-slate-200">{game.away_team.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Image
                                  src={getTeamLogoUrl(homeTeamAbbr, sport)}
                                  alt={homeTeamAbbr}
                                  width={16}
                                  height={16}
                                  className="h-4 w-4"
                                />
                                <span className="font-medium text-slate-200">{game.home_team.name}</span>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Game Time: {formatGameDateTime(game.commence_time)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-1 px-2 py-1 rounded bg-slate-800/50">
                          {awayBestOdds ? (
                            <div className="flex items-center justify-between w-full">
                              <OddsDisplay odds={awayBestOdds.price} link={awayBestOdds.link} className="text-sm text-slate-200 hover:underline" />
                              {awayBestOdds.bookmaker && (
                                <Image
                                  src={sportsbooks.find((b) => b.id === awayBestOdds.bookmaker)?.logo || ""}
                                  alt={awayBestOdds.bookmaker}
                                  width={20}
                                  height={20}
                                  className="h-5 w-5"
                                />
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-1 px-2 py-1 rounded bg-slate-800/50">
                          {homeBestOdds ? (
                            <div className="flex items-center justify-between w-full">
                              <OddsDisplay odds={homeBestOdds.price} link={homeBestOdds.link} className="text-sm text-slate-200 hover:underline" />
                              {homeBestOdds.bookmaker && (
                                <Image
                                  src={sportsbooks.find((b) => b.id === homeBestOdds.bookmaker)?.logo || ""}
                                  alt={homeBestOdds.bookmaker}
                                  width={20}
                                  height={20}
                                  className="h-5 w-5"
                                />
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-center px-2 py-1 rounded bg-slate-800/50">
                          {awayAvgOdds ? (
                            <OddsDisplay odds={awayAvgOdds} className="text-sm text-slate-400" />
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </div>
                        <div className="flex items-center justify-center px-2 py-1 rounded bg-slate-800/50">
                          {homeAvgOdds ? (
                            <OddsDisplay odds={homeAvgOdds} className="text-sm text-slate-400" />
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-center px-2 py-1 rounded bg-slate-800/50">
                          {awayEV ? (
                            <span className="text-sm text-green-500">+{awayEV.toFixed(1)}%</span>
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </div>
                        <div className="flex items-center justify-center px-2 py-1 rounded bg-slate-800/50">
                          {homeEV ? (
                            <span className="text-sm text-green-500">+{homeEV.toFixed(1)}%</span>
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    {activeSportsbooks.map((book) => {
                      const bookId = book.id.toLowerCase()
                      
                      console.log(`[Component] Processing sportsbook ${book.name}:`, {
                        bookId,
                        availableBookmakers: game.bookmakers.map(b => b.key),
                        market: selectedMarket
                      })
                      
                      const bookmaker = game.bookmakers.find((b) => b.key === bookId)
                      console.log(`[Component] Found bookmaker:`, {
                        found: !!bookmaker,
                        markets: bookmaker?.markets.map(m => m.key)
                      })

                      if (selectedMarket === "total") {
                        // Handle totals market
                        const totalsMarket = bookmaker?.markets.find((m) => m.key === "totals")
                        console.log(`[Component] Totals market for ${book.name}:`, {
                          found: !!totalsMarket,
                          lines: totalsMarket?.lines,
                        })
                        
                        // Find the standard line for this sportsbook
                        let standardLine = null
                        let standardOverOdds = null
                        let standardUnderOdds = null
                        
                        if (totalsMarket?.lines) {
                          // Look through all lines to find the standard one for this sportsbook
                          Object.entries(totalsMarket.lines).forEach(([line, lineData]) => {
                            if (lineData.sportsbooks[bookId]?.is_standard) {
                              standardLine = lineData.point
                              standardOverOdds = lineData.sportsbooks[bookId].over?.price
                              standardUnderOdds = lineData.sportsbooks[bookId].under?.price
                            }
                          })
                        }

                        console.log(`[Component] Standard line for ${book.name}:`, {
                          standardLine,
                          standardOverOdds,
                          standardUnderOdds
                        })

                        return (
                          <TableCell key={book.id} className="text-center">
                            <div className="flex flex-col gap-2">
                              {standardLine ? (
                                <>
                                  <div className="flex items-center justify-center px-2 py-1 rounded bg-slate-800/50">
                                    <span className="text-sm text-slate-200">o{standardLine}</span>
                                    {standardOverOdds && (
                                      <OddsDisplay 
                                        odds={standardOverOdds}
                                        className="text-sm text-slate-200 ml-1"
                                      />
                                    )}
                                  </div>
                                  <div className="flex items-center justify-center px-2 py-1 rounded bg-slate-800/50">
                                    <span className="text-sm text-slate-200">u{standardLine}</span>
                                    {standardUnderOdds && (
                                      <OddsDisplay 
                                        odds={standardUnderOdds}
                                        className="text-sm text-slate-200 ml-1"
                                      />
                                    )}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center justify-center px-2 py-1 rounded bg-slate-800/50">
                                    <span className="text-sm text-slate-400">-</span>
                                  </div>
                                  <div className="flex items-center justify-center px-2 py-1 rounded bg-slate-800/50">
                                    <span className="text-sm text-slate-400">-</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </TableCell>
                        )
                      } else {
                        // Handle moneyline (h2h) market
                        const h2hMarket = bookmaker?.markets.find((m) => m.key === "h2h")
                        console.log(`[Component] Moneyline market for ${book.name}:`, {
                          found: !!h2hMarket,
                          outcomes: h2hMarket?.outcomes
                        })

                        const awayOutcome = h2hMarket?.outcomes.find((o) => o.name.toLowerCase() === game.away_team.name.toLowerCase())
                        const homeOutcome = h2hMarket?.outcomes.find((o) => o.name.toLowerCase() === game.home_team.name.toLowerCase())

                        // Check if this sportsbook has the best odds
                        const isAwayBest = awayOutcome && awayBestOdds && awayOutcome.price === awayBestOdds.price
                        const isHomeBest = homeOutcome && homeBestOdds && homeOutcome.price === homeBestOdds.price

                        return (
                          <TableCell key={book.id} className="text-center">
                            <div className="flex flex-col gap-2">
                              <div className={cn(
                                "flex items-center justify-center px-2 py-1 rounded",
                                isAwayBest ? "bg-emerald-500/20" : "bg-slate-800/50"
                              )}>
                                {awayOutcome ? (
                                  <OddsDisplay 
                                    odds={awayOutcome.price}
                                    link={awayOutcome.link} 
                                    className={cn(
                                      "text-sm",
                                      isAwayBest ? "text-emerald-400" : "text-slate-200"
                                    )} 
                                  />
                                ) : (
                                  <span className="text-sm text-slate-400">-</span>
                                )}
                              </div>
                              <div className={cn(
                                "flex items-center justify-center px-2 py-1 rounded",
                                isHomeBest ? "bg-emerald-500/20" : "bg-slate-800/50"
                              )}>
                                {homeOutcome ? (
                                  <OddsDisplay 
                                    odds={homeOutcome.price}
                                    link={homeOutcome.link} 
                                    className={cn(
                                      "text-sm",
                                      isHomeBest ? "text-emerald-400" : "text-slate-200"
                                    )} 
                                  />
                                ) : (
                                  <span className="text-sm text-slate-400">-</span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        )
                      }
                    })}
                    <TableCell className="p-1">
                      <div className="flex flex-col gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "w-full min-w-[40px] px-2",
                                  "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-400",
                                  "dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30 dark:hover:text-emerald-300",
                                  "border-emerald-500/20",
                                  !awayBestOdds && "opacity-50 cursor-not-allowed",
                                )}
                                onClick={() => handleAddToBetslip(game, "away")}
                                disabled={!awayBestOdds}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                {awayTeamAbbr}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {awayBestOdds
                                ? "Add to betslip to compare across sportsbooks"
                                : "No odds available"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "w-full min-w-[40px] px-2",
                                  "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-400",
                                  "dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30 dark:hover:text-emerald-300",
                                  "border-emerald-500/20",
                                  !homeBestOdds && "opacity-50 cursor-not-allowed",
                                )}
                                onClick={() => handleAddToBetslip(game, "home")}
                                disabled={!homeBestOdds}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                {homeTeamAbbr}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {homeBestOdds
                                ? "Add to betslip to compare across sportsbooks"
                                : "No odds available"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <BetslipDialog 
        open={showBetslipDialog} 
        onOpenChange={setShowBetslipDialog}
        selection={pendingSelection}
      />

      {/* Conflict Resolution Dialog */}
      <Dialog 
        open={conflictingSelection !== null} 
        onOpenChange={() => handleResolveConflict(false)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Replace Existing Selection?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              You already have a selection for this game. Would you like to replace it?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleResolveConflict(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleResolveConflict(true)}>
              Replace Selection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 