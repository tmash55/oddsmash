"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useBetslip } from "@/contexts/betslip-context"
import { sportsbooks } from "@/data/sportsbooks"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { ArrowUpRight, Scale } from "lucide-react"
import { generateSportsbookUrl } from "@/lib/sportsbook-links"

interface OddsComparisonModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  betslipId: string
}

interface SportsbookOdds {
  bookmaker: string
  odds: number | null
  logo: string
  name: string
  legs?: any[]
}

export function OddsComparisonModal({ open, onOpenChange, betslipId }: OddsComparisonModalProps) {
  const { getBetslipSelections, calculateParlayOddsForSportsbook, formatOdds } = useBetslip()
  const [sportsbookOdds, setSportsbookOdds] = useState<SportsbookOdds[]>([])
  const [bestOdds, setBestOdds] = useState<number | null>(null)

  useEffect(() => {
    if (open) {
      // Get all selections for this betslip
      const selections = getBetslipSelections(betslipId)
      console.log("[OddsComparisonModal] Selections:", selections)
      
      // Calculate odds for each sportsbook
      const odds = sportsbooks.map(book => {
        console.log(`[OddsComparisonModal] Calculating odds for ${book.name}...`)
        const parlayOdds = calculateParlayOddsForSportsbook(selections, book.id)
        console.log(`[OddsComparisonModal] ${book.name} odds:`, parlayOdds)
        return {
          bookmaker: book.id,
          odds: parlayOdds,
          logo: book.logo,
          name: book.name,
          legs: selections
        }
      })

      // Sort by odds (highest to lowest)
      odds.sort((a, b) => {
        if (a.odds === null) return 1
        if (b.odds === null) return -1
        return b.odds - a.odds
      })

      // Find best odds
      const validOdds = odds.filter(o => o.odds !== null)
      const bestOddsValue = validOdds.length > 0 ? validOdds[0].odds : null
      console.log("[OddsComparisonModal] Best odds:", bestOddsValue)
      console.log("[OddsComparisonModal] All sportsbook odds:", odds)

      setBestOdds(bestOddsValue)
      setSportsbookOdds(odds)
    }
  }, [open, betslipId])

  const handleBetNowClick = (book: SportsbookOdds) => {
    // For DraftKings, we need to use the event ID from the first selection's DraftKings link
    if (book.bookmaker === "draftkings" && book.legs && book.legs.length > 0) {
      const firstLeg = book.legs[0]
      const dkData = firstLeg.odds_data?.draftkings
      const eventId = dkData?.link?.match(/event\/(\d+)/)?.[1]
      
      if (eventId) {
        // Construct URL with the correct event ID and all selection SIDs
        const sids = book.legs
          .map(leg => leg.odds_data?.draftkings?.sid)
          .filter(Boolean)
          .join("+")
        
        const url = `https://sportsbook.draftkings.com/event/${eventId}?outcomes=${sids}`
        window.open(url, "_blank")
        return
      }
    }

    // For FanDuel, we need to extract marketId and selectionId from their link data
    if (book.bookmaker === "fanduel" && book.legs && book.legs.length > 0) {
      const params: string[] = []
      
      book.legs.forEach((leg, index) => {
        const fdData = leg.odds_data?.fanduel
        if (fdData?.link) {
          // Extract marketId and selectionId from the link
          const url = new URL(fdData.link)
          const marketId = url.searchParams.get("marketId")
          const selectionId = url.searchParams.get("selectionId")
          
          if (marketId && selectionId) {
            params.push(`marketId[${index}]=${marketId}`)
            params.push(`selectionId[${index}]=${selectionId}`)
          }
        }
      })

      if (params.length > 0) {
        const url = `https://ia.sportsbook.fanduel.com/addToBetslip?${params.join("&")}`
        window.open(url, "_blank")
        return
      }
    }

    // For other sportsbooks, use the default URL generation
    const url = generateSportsbookUrl(book.bookmaker, {
      legs: book.legs?.map(leg => ({
        eventId: leg.event_id,
        marketId: leg.market_key,
        selectionId: leg.selection,
        sid: leg.odds_data[book.bookmaker]?.sid,
        link: leg.odds_data[book.bookmaker]?.link
      }))
    })
    window.open(url, "_blank")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Parlay Odds Comparison
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {sportsbookOdds.map((book) => (
            <div
              key={book.bookmaker}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                book.odds === bestOdds && book.odds !== null && "border-primary bg-primary/5"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 relative">
                  <Image
                    src={book.logo}
                    alt={book.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="font-medium">{book.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn(
                  "text-lg font-bold",
                  book.odds === bestOdds && book.odds !== null ? "text-primary" : "text-foreground"
                )}>
                  {book.odds !== null ? formatOdds(book.odds) : "N/A"}
                </span>
                {book.odds !== null && (
                  <button
                    onClick={() => handleBetNowClick(book)}
                    className="p-1.5 rounded-md hover:bg-primary/10 transition-colors"
                    title="Bet Now"
                  >
                    <ArrowUpRight className="h-5 w-5 text-primary" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
} 