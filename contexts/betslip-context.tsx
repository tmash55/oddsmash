"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { Betslip, BetslipSelection } from "@/types/betslip"
import { createBetslipForUser, getBetslipsForUser, deleteBetslip as deleteBetslipFromDb, addSelectionToBetslip as addSelectionToDb, removeSelectionFromBetslip as removeSelectionFromDb, clearBetslip as clearBetslipFromDb, updateBetslipTitle as updateBetslipTitleFromDb, setBetslipAsDefault as setBetslipAsDefaultFromDb, replaceBetslipSelection as replaceBetslipSelectionFromDb } from "@/services/betslip"
import { getExpiredSelections, ExpiredSelectionInfo } from "@/lib/betslip-cleanup-utils"
import { calculateParlayOdds, americanToDecimal, decimalToAmerican, calculateSGPOdds, calculatePayout } from "@/lib/odds-utils"
import { formatOdds } from "@/lib/utils"
import { v4 as uuidv4 } from "uuid"
import { SPORT_MARKETS, SportMarket } from "@/lib/constants/markets"
import { toast } from "react-hot-toast"

interface BetslipContextType {
  betslips: Betslip[]
  activeBetslipId: string | null
  isLoading: boolean
  setActiveBetslip: (id: string) => void
  addSelection: (
    selection: Omit<BetslipSelection, "id" | "betslip_id" | "created_at" | "updated_at">,
    betslipId: string
  ) => Promise<BetslipSelection | null>
  removeSelection: (selectionId: string, betslipId: string) => Promise<void>
  createBetslip: (title?: string, isDefault?: boolean) => Promise<Betslip | null>
  deleteBetslip: (id: string) => Promise<void>
  clearBetslip: (id: string) => Promise<void>
  updateBetslipTitle: (betslipId: string, title: string) => Promise<void>
  setBetslipAsDefault: (betslipId: string) => Promise<void>
  replaceBetslipSelection: (
    oldSelectionId: string,
    betslipId: string,
    selection: Omit<BetslipSelection, "id" | "betslip_id" | "created_at" | "updated_at">
  ) => Promise<BetslipSelection | null>
  calculateBetslipOdds: (betslipId: string) => number | null
  calculateBetslipPayout: (betslipId: string, wager: number) => number
  getBetslipSelections: (betslipId: string) => BetslipSelection[]
  calculateParlayOddsForSportsbook: (selections: BetslipSelection[], sportsbook: string) => number | null
  formatOdds: (odds: number | null) => string
  getExpiredSelections: (betslipId: string) => ExpiredSelectionInfo[]
  removeExpiredSelections: (betslipId: string, selectionIds: string[]) => Promise<void>
  removeAllExpiredSelections: (betslipId: string) => Promise<void>
}

// Routes where betslip should be visible
const BETSLIP_ENABLED_ROUTES = [
  "/hit-rates",
  "/hit-sheets",
  "/player",
  // Add more routes as needed
]

// Context
const BetslipContext = createContext<BetslipContextType | undefined>(undefined)

// Provider
export function BetslipProvider({ children }: { children: React.ReactNode }) {
  const [betslips, setBetslips] = useState<Betslip[]>([])
  const [activeBetslipId, setActiveBetslipId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()
  const { user, loading: authLoading } = useAuth()

  // Load betslips from database when user changes
  useEffect(() => {
    if (authLoading) return

    const loadBetslips = async () => {
      setIsLoading(true)
      try {
        if (user) {
          const userBetslips = await getBetslipsForUser(user.id)
          setBetslips(userBetslips)
          
          // Set first betslip as active if exists and none is active
          if (userBetslips.length > 0 && !activeBetslipId) {
            setActiveBetslipId(userBetslips[0].id)
          } else if (userBetslips.length === 0) {
            // Create initial betslip if none exists
            const newBetslip = await createBetslipForUser(user.id, undefined, true)
            if (newBetslip) {
              setBetslips([{ ...newBetslip, selections: [] }])
              setActiveBetslipId(newBetslip.id)
            }
          }
        } else {
          // Clear betslips when user logs out
          setBetslips([])
          setActiveBetslipId(null)
        }
      } catch (error) {
        console.error("Error loading betslips:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadBetslips()
  }, [user, authLoading])

  const addSelection = async (
    selection: Omit<BetslipSelection, "id" | "betslip_id" | "created_at" | "updated_at">,
    betslipId: string
  ) => {
    console.log("[BetslipContext] addSelection called with:", { selection, betslipId, activeBetslipId })
    try {
      // Find target betslip
      const targetBetslip = betslips.find(b => b.id === betslipId)
      console.log("[BetslipContext] Found target betslip:", targetBetslip)

      if (!targetBetslip) {
        console.error("[BetslipContext] Target betslip not found:", betslipId)
        return null
      }

      // Log odds data before adding selection
      console.log("[BetslipContext] Selection odds_data before adding:", selection.odds_data)

      // Attempt to add selection to betslip
      console.log("[BetslipContext] Attempting to add selection to betslip:", betslipId)
      const newSelection = await addSelectionToDb(betslipId, selection)
      console.log("[BetslipContext] Selection added to database:", newSelection)

      if (!newSelection) {
        console.error("[BetslipContext] Failed to add selection to database")
        return null
      }

      // Update local state
      setBetslips(prev => {
        const updated = prev.map(betslip => {
          if (betslip.id === betslipId) {
            return {
              ...betslip,
              selections: [...betslip.selections, newSelection]
            }
          }
          return betslip
        })
        console.log("[BetslipContext] Updated betslips state:", updated)
        return updated
      })

      return newSelection
    } catch (error) {
      console.error("[BetslipContext] Error in addSelection:", error)
      return null
    }
  }

  const removeSelection = async (selectionId: string, betslipId: string) => {
    const success = await removeSelectionFromDb(selectionId)
    if (success) {
      setBetslips(current => {
        return current.map(betslip => {
          if (betslip.id === betslipId) {
            return {
              ...betslip,
              selections: betslip.selections.filter(s => s.id !== selectionId)
            }
          }
          return betslip
        })
      })
    }
  }

  const createBetslip = async (title?: string, isDefault: boolean = false) => {
    if (!user) {
      console.error("No user logged in")
      return null
    }

    // Check if we've hit the limit
    if (betslips.length >= 5) {
      toast.error("You can't have more than 5 betslips")
      return null
    }

    const newBetslip = await createBetslipForUser(user.id, title, isDefault)
    if (newBetslip) {
      setBetslips(current => [...current, { ...newBetslip, selections: [] }])
      setActiveBetslipId(newBetslip.id)
      return newBetslip
    }
    return null
  }

  const deleteBetslip = async (betslipId: string) => {
    const success = await deleteBetslipFromDb(betslipId)
    if (success) {
      setBetslips(current => current.filter(b => b.id !== betslipId))
      if (activeBetslipId === betslipId) {
        setActiveBetslipId(betslips[0]?.id || null)
      }
    }
  }

  const clearBetslip = async (betslipId: string) => {
    try {
      await clearBetslipFromDb(betslipId)
      setBetslips(current => {
        return current.map(betslip => {
          if (betslip.id === betslipId) {
            return {
              ...betslip,
              selections: []
            }
          }
          return betslip
        })
      })
    } catch (error) {
      console.error("Error clearing betslip:", error)
      throw error
    }
  }

  const updateBetslipTitle = async (betslipId: string, title: string) => {
    const updatedBetslip = await updateBetslipTitleFromDb(betslipId, title)
    if (updatedBetslip) {
      setBetslips(current => {
        return current.map(betslip => {
          if (betslip.id === betslipId) {
            return {
              ...betslip,
              title: updatedBetslip.title
            }
          }
          return betslip
        })
      })
    }
  }

  const setBetslipAsDefault = async (betslipId: string) => {
    const updatedBetslip = await setBetslipAsDefaultFromDb(betslipId)
    if (updatedBetslip) {
      setBetslips(current => {
        return current.map(betslip => ({
          ...betslip,
          is_default: betslip.id === betslipId
        }))
      })
    }
  }

  // Calculate odds for a betslip
  const calculateBetslipOdds = (betslipId: string): number | null => {
    const betslip = betslips.find(b => b.id === betslipId)
    if (!betslip || betslip.selections.length === 0) return null

    // Group selections by event_id to handle SGPs
    const selectionsByEvent = betslip.selections.reduce((acc, selection) => {
      if (!acc[selection.event_id]) {
        acc[selection.event_id] = [];
      }
      acc[selection.event_id].push(selection);
      return acc;
    }, {} as Record<string, BetslipSelection[]>);

    // Calculate odds for each event group
    const eventOdds = Object.values(selectionsByEvent).map(selections => {
      // For single selections or selections from different events
      if (selections.length === 1) {
        // Get the first available odds from odds_data
        const oddsData = selections[0].odds_data;
        const firstSportsbook = Object.keys(oddsData)[0];
        return oddsData[firstSportsbook]?.odds || 0;
      }

      // For Same Game Parlays (multiple selections from same event)
      const odds = selections.map(selection => {
        const oddsData = selection.odds_data;
        const firstSportsbook = Object.keys(oddsData)[0];
        return oddsData[firstSportsbook]?.odds || 0;
      });

      return calculateSGPOdds(odds, selections.length);
    });

    // If any event has no odds, return null
    if (eventOdds.some(odds => odds === 0)) return null;

    // Calculate final parlay odds
    return calculateParlayOdds(eventOdds);
  }

  // Calculate payout for a betslip
  const calculateBetslipPayout = (betslipId: string, wager: number): number => {
    const odds = calculateBetslipOdds(betslipId);
    return calculatePayout(odds, wager);
  }

  // Get all selections for a betslip
  const getBetslipSelections = (betslipId: string): BetslipSelection[] => {
    const betslip = betslips.find(slip => slip.id === betslipId)
    return betslip?.selections || []
  }

  // Calculate parlay odds for a specific sportsbook
  const calculateParlayOddsForSportsbook = (selections: BetslipSelection[], bookmaker: string): number | null => {
    console.log(`[calculateParlayOddsForSportsbook] Starting calculation for ${bookmaker}`)
    console.log("[calculateParlayOddsForSportsbook] Selections:", selections)
    
    if (selections.length === 0) {
      console.log("[calculateParlayOddsForSportsbook] No selections provided")
      return null
    }

    // Group selections by event_id to handle SGPs
    const selectionsByEvent = selections.reduce((acc, selection) => {
      if (!acc[selection.event_id]) {
        acc[selection.event_id] = [];
      }
      acc[selection.event_id].push(selection);
      return acc;
    }, {} as Record<string, BetslipSelection[]>);

    // Calculate odds for each event group
    const eventOdds = Object.values(selectionsByEvent).map(eventSelections => {
      // For single selections or selections from different events
      if (eventSelections.length === 1) {
        const bookmakerData = eventSelections[0].odds_data[bookmaker]
        if (!bookmakerData) {
          console.log(`[calculateParlayOddsForSportsbook] No odds data for ${bookmaker}`)
          return 0
        }
        return bookmakerData.odds
      }

      // For Same Game Parlays (multiple selections from same event)
      const odds = eventSelections.map(selection => {
        const bookmakerData = selection.odds_data[bookmaker]
        if (!bookmakerData) {
          console.log(`[calculateParlayOddsForSportsbook] No odds data for ${bookmaker} for SGP leg`)
          return 0
        }
        return bookmakerData.odds
      })

      if (odds.some(odd => odd === 0)) {
        return 0
      }

      // Calculate SGP odds with correlation factor
      return calculateSGPOdds(odds, eventSelections.length)
    })

    // If any event has no odds, return null
    if (eventOdds.some(odds => odds === 0)) {
      console.log(`[calculateParlayOddsForSportsbook] Missing odds for some selections`)
      return null
    }

    // Calculate final parlay odds
    console.log(`[calculateParlayOddsForSportsbook] Event odds for calculation:`, eventOdds)
    return calculateParlayOdds(eventOdds)
  }

  const replaceBetslipSelection = async (
    oldSelectionId: string,
    betslipId: string,
    selection: Omit<BetslipSelection, "id" | "betslip_id" | "created_at" | "updated_at">
  ) => {
    console.log('[BetslipContext] Replacing selection:', {
      oldSelectionId,
      betslipId,
      selection: {
        ...selection,
        odds_data: JSON.stringify(selection.odds_data, null, 2)
      }
    });

    try {
      const result = await replaceBetslipSelectionFromDb(oldSelectionId, betslipId, selection);
      console.log('[BetslipContext] Replacement result:', result);

      if (result) {
        // Update local state
        setBetslips(prev => {
          const updatedBetslips = prev.map(betslip => {
            if (betslip.id === betslipId) {
              // Replace the old selection with the new one
              const updatedSelections = betslip.selections.map(s => 
                s.id === oldSelectionId ? result : s
              );
              return { ...betslip, selections: updatedSelections };
            }
            return betslip;
          });
          console.log('[BetslipContext] Updated betslips:', updatedBetslips);
          return updatedBetslips;
        });
        return result;
      }
    } catch (error) {
      console.error('[BetslipContext] Error replacing selection:', error);
    }
    return null;
  }

  const createBetslipSelection = async (betslipId: string, selection: Partial<BetslipSelection>): Promise<BetslipSelection | null> => {
    try {
      // Map sport key to API format
      const sportApiKey = selection.sport_key === 'mlb' ? 'baseball_mlb' : selection.sport_key

      // Get market config from our constants
      const marketConfig = SPORT_MARKETS[sportApiKey || '']?.find((m: SportMarket) => 
        m.value === selection.market_key || 
        m.label === selection.market_key
      )

      if (!marketConfig) {
        console.error('[BetslipContext] Market config not found:', selection.market_key)
        return null
      }

      // Get API keys (including alternate if available)
      const marketApiKeys = marketConfig.hasAlternates 
        ? `${marketConfig.apiKey},${marketConfig.alternateKey}`
        : marketConfig.apiKey

      // Format selection to include line
      const formattedSelection = `${selection.selection} ${selection.line}`

      const response = await fetch('/api/betslip/selections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          betslip_id: betslipId,
          event_id: selection.event_id,
          sport_key: sportApiKey,
          market_key: marketApiKeys,
          market_display: marketConfig.label,
          market_type: selection.market_type,
          bet_type: selection.bet_type,
          selection: formattedSelection,
          player_name: selection.player_name,
          player_id: selection.player_id,
          player_team: selection.player_team,
          line: selection.line,
          commence_time: selection.commence_time,
          home_team: selection.home_team,
          away_team: selection.away_team,
          odds_data: selection.odds_data,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create betslip selection')
      }

      const data = await response.json()
      console.log('[BetslipService] Successfully added selection. Response data:', data)
      return data
    } catch (error) {
      console.error('[BetslipService] Error adding selection:', error)
      return null
    }
  }

  const getExpiredSelectionsForBetslip = (betslipId: string): ExpiredSelectionInfo[] => {
    const betslip = betslips.find(b => b.id === betslipId)
    if (!betslip || !betslip.selections) return []
    
    return getExpiredSelections(betslip.selections, 30) // 30-minute grace period
  }

  const removeExpiredSelections = async (betslipId: string, selectionIds: string[]): Promise<void> => {
    try {
      // Remove selections from database
      for (const selectionId of selectionIds) {
        await removeSelectionFromDb(selectionId)
      }

      // Update local state
      setBetslips(prev => prev.map(betslip => {
        if (betslip.id === betslipId) {
          return {
            ...betslip,
            selections: betslip.selections.filter(s => !selectionIds.includes(s.id))
          }
        }
        return betslip
      }))

      toast.success(`Removed ${selectionIds.length} expired selection${selectionIds.length > 1 ? 's' : ''}`)
    } catch (error) {
      console.error('[BetslipContext] Error removing expired selections:', error)
      toast.error('Failed to remove expired selections')
      throw error
    }
  }

  const removeAllExpiredSelections = async (betslipId: string): Promise<void> => {
    const expiredSelections = getExpiredSelectionsForBetslip(betslipId)
    const expiredIds = expiredSelections.map(info => info.selection.id)
    
    if (expiredIds.length > 0) {
      await removeExpiredSelections(betslipId, expiredIds)
    }
  }

  return (
    <BetslipContext.Provider
      value={{
        betslips,
        activeBetslipId,
        isLoading,
        setActiveBetslip: setActiveBetslipId,
        addSelection,
        removeSelection,
        createBetslip,
        deleteBetslip,
        clearBetslip,
        updateBetslipTitle,
        setBetslipAsDefault,
        replaceBetslipSelection,
        calculateBetslipOdds,
        calculateBetslipPayout,
        getBetslipSelections,
        calculateParlayOddsForSportsbook,
        formatOdds,
        getExpiredSelections: getExpiredSelectionsForBetslip,
        removeExpiredSelections,
        removeAllExpiredSelections
      }}
    >
      {children}
    </BetslipContext.Provider>
  )
}

// Hook
export function useBetslip() {
  const context = useContext(BetslipContext)
  if (context === undefined) {
    throw new Error("useBetslip must be used within a BetslipProvider")
  }
  return context
} 