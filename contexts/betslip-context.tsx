"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { Betslip, BetslipSelection } from "@/types/betslip"
import { createBetslipForUser, getBetslipsForUser, deleteBetslip as deleteBetslipFromDb, addSelectionToBetslip as addSelectionToDb, removeSelectionFromBetslip as removeSelectionFromDb, clearBetslip as clearBetslipFromDb, updateBetslipTitle as updateBetslipTitleFromDb, setBetslipAsDefault as setBetslipAsDefaultFromDb, replaceBetslipSelection as replaceBetslipSelectionFromDb } from "@/services/betslip"
import { calculateParlayOdds, americanToDecimal, decimalToAmerican, calculateSGPOdds, calculatePayout } from "@/lib/odds-utils"
import { formatOdds } from "@/lib/utils"
import { v4 as uuidv4 } from "uuid"

type BetslipContextType = {
  betslips: Betslip[]
  activeBetslipId: string | null
  isVisible: boolean
  isLoading: boolean
  addSelection: (selection: Omit<BetslipSelection, "id" | "betslip_id" | "created_at" | "updated_at">, betslipId?: string) => Promise<void>
  removeSelection: (selectionId: string) => Promise<void>
  createBetslip: (title?: string, isDefault?: boolean) => Promise<Betslip | null>
  deleteBetslip: (betslipId: string) => Promise<void>
  setActiveBetslip: (betslipId: string) => void
  clearBetslip: (betslipId: string) => Promise<void>
  toggleVisibility: () => void
  updateBetslipTitle: (betslipId: string, title: string) => Promise<void>
  setBetslipAsDefault: (betslipId: string) => Promise<void>
  calculateBetslipOdds: (betslipId: string) => number | null
  calculateBetslipPayout: (betslipId: string, wager: number) => number
  formatOdds: (odds: number) => string
  getBetslipSelections: (betslipId: string) => BetslipSelection[]
  calculateParlayOddsForSportsbook: (selections: BetslipSelection[], bookmaker: string) => number | null
  replaceBetslipSelection: (oldSelectionId: string, betslipId: string, selection: Omit<BetslipSelection, "id" | "betslip_id" | "created_at" | "updated_at">) => Promise<void>
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
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()
  const { user, loading: authLoading } = useAuth()

  // Load betslips from database when user changes
  useEffect(() => {
    if (authLoading) return

    const loadBetslips = async () => {
      if (user) {
        const userBetslips = await getBetslipsForUser(user.id)
        setBetslips(userBetslips)
        // Set first betslip as active if exists and none is active
        if (userBetslips.length > 0 && !activeBetslipId) {
          setActiveBetslipId(userBetslips[0].id)
        } else if (userBetslips.length === 0) {
          // Create initial betslip if none exists
          const newBetslip = await createBetslipForUser(user.id)
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
      setIsLoading(false)
    }

    loadBetslips()
  }, [user, authLoading])

  const addSelection = async (
    selection: Omit<BetslipSelection, "id" | "betslip_id" | "created_at" | "updated_at">,
    betslipId?: string
  ) => {
    console.log("addSelection called with:", { selection, betslipId, activeBetslipId })
    if (!user) {
      console.error("No user logged in")
      return
    }

    const targetBetslipId = betslipId || activeBetslipId
    if (!targetBetslipId) {
      console.error("No betslip ID provided")
      return
    }

    // Check if selection already exists in the betslip
    const targetBetslip = betslips.find(b => b.id === targetBetslipId)
    console.log("Found target betslip:", targetBetslip)
    if (targetBetslip) {
      const exists = targetBetslip.selections.some(s => 
        s.event_id === selection.event_id &&
        s.market_key === selection.market_key &&
        s.selection === selection.selection
      )
      if (exists) {
        console.error("Selection already exists in betslip")
        return
      }
    }

    console.log("Attempting to add selection to betslip:", targetBetslipId)
    const newSelection = await addSelectionToDb(targetBetslipId, selection)
    console.log("Selection added to database:", newSelection)
    if (newSelection) {
      setBetslips(current => {
        return current.map(betslip => {
          if (betslip.id === targetBetslipId) {
            return {
              ...betslip,
              selections: [...betslip.selections, newSelection]
            }
          }
          return betslip
        })
      })
    }
  }

  const removeSelection = async (selectionId: string) => {
    if (!activeBetslipId) return

    const success = await removeSelectionFromDb(selectionId)
    if (success) {
      setBetslips(current => {
        return current.map(betslip => {
          if (betslip.id === activeBetslipId) {
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
    const success = await clearBetslipFromDb(betslipId)
    if (success) {
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
    }
  }

  const toggleVisibility = () => {
    setIsVisible(prev => !prev)
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

  return (
    <BetslipContext.Provider
      value={{
        betslips,
        activeBetslipId,
        isVisible,
        isLoading: isLoading || authLoading,
        addSelection,
        removeSelection,
        createBetslip,
        deleteBetslip,
        setActiveBetslip: setActiveBetslipId,
        clearBetslip,
        toggleVisibility,
        updateBetslipTitle,
        setBetslipAsDefault,
        calculateBetslipOdds,
        calculateBetslipPayout,
        formatOdds,
        getBetslipSelections,
        calculateParlayOddsForSportsbook,
        replaceBetslipSelection
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