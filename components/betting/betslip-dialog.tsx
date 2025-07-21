"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Star, Plus, ArrowDown, Zap, Target, Trash2, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import type { BetslipSelection } from "@/types/betslip"
import { useBetslip } from "@/contexts/betslip-context"
import { useAuth } from "@/components/auth/auth-provider"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { SPORT_MARKETS, type SportMarket } from "@/lib/constants/markets"
import { getMarketsForSport } from "@/lib/constants/markets"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { sportsbooks } from "@/data/sportsbooks"

interface BetslipDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selection: Omit<BetslipSelection, "id" | "betslip_id" | "created_at" | "updated_at"> | null
}

interface ConflictingSelection {
  existingSelection: BetslipSelection
  newSelection: BetslipSelectionInput
  betslipId: string
}

type BetslipSelectionInput = Omit<BetslipSelection, "id" | "betslip_id" | "created_at" | "updated_at">

export function BetslipDialog({ open, onOpenChange, selection }: BetslipDialogProps) {
  const { betslips, addSelection, createBetslip, setActiveBetslip, replaceBetslipSelection, removeSelection } =
    useBetslip()
  const { user, setShowAuthModal } = useAuth()
  const [showNewBetslipDialog, setShowNewBetslipDialog] = useState(false)
  const [newBetslipTitle, setNewBetslipTitle] = useState("")
  const [conflictingSelection, setConflictingSelection] = useState<ConflictingSelection | null>(null)
  const [expandedBetslip, setExpandedBetslip] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isCreatingBetslip, setIsCreatingBetslip] = useState(false)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Helper function to check if a selection already exists in a betslip
  const selectionExists = (betslipId: string, selection: BetslipSelectionInput) => {
    console.log("[BetslipDialog] Checking if selection exists:", { betslipId, selection })
    const betslip = betslips.find((b) => b.id === betslipId)
    if (!betslip) {
      console.log("[BetslipDialog] Betslip not found:", betslipId)
      return false
    }
    const exists = betslip.selections.some(
      (s) =>
      s.event_id === selection.event_id &&
      s.market_key === selection.market_key &&
      s.selection === selection.selection &&
      s.line === selection.line &&
        s.player_name === selection.player_name,
    )
    console.log("[BetslipDialog] Selection exists:", exists)
    return exists
  }

  // Helper function to find conflicting selections (same player/market, different line)
  const findConflictingSelection = (betslipId: string, selection: BetslipSelectionInput) => {
    console.log("[BetslipDialog] Checking for conflicting selection:", { betslipId, selection })
    const betslip = betslips.find((b) => b.id === betslipId)
    if (!betslip) return null
    const conflict = betslip.selections.find(
      (s) =>
        s.player_name === selection.player_name && s.market_key === selection.market_key && s.line !== selection.line,
    )
    console.log("[BetslipDialog] Found conflicting selection:", conflict)
    return conflict
  }

  // Helper function to ensure we have all available odds data
  const prepareSelectionWithOdds = (selection: BetslipSelectionInput): BetslipSelectionInput => {
    console.log("[BetslipDialog] Preparing selection with odds. Original selection:", selection)
    
    // Add null check
    if (!selection) {
      throw new Error("Selection cannot be null")
    }
    
    // Map sport key to API format with proper type checking
    const getSportApiKey = (sportKey: string): string => {
      if (!sportKey) return "baseball_mlb" // Default to MLB if no sport key provided
      
      const sportKeyMap: Record<string, string> = {
        mlb: "baseball_mlb",
        nba: "basketball_nba",
        nfl: "football_nfl",
        ncaab: "basketball_ncaab",
        // Add more sports mappings as needed
      }
      
      return sportKeyMap[sportKey.toLowerCase()] || sportKey
    }

    const sportApiKey = getSportApiKey(selection.sport_key || "baseball_mlb")

    // Get market config from our constants
    const marketConfig = SPORT_MARKETS[sportApiKey]?.find(
      (m: SportMarket) => m.value === selection.market_key || m.label === selection.market_key,
    )

    if (!marketConfig) {
      console.warn("[BetslipDialog] Market config not found:", selection.market_key)
      // If no config found, use the original market key as display name
      return {
        ...selection,
        sport_key: sportApiKey,
        market_display: selection.market_key,
      }
    }

    // Get API keys (including alternate if available)
    const marketApiKeys = marketConfig.hasAlternates 
      ? `${marketConfig.apiKey},${marketConfig.alternateKey}`
      : marketConfig.apiKey

    console.log("[BetslipDialog] Found market config:", { 
      marketConfig, 
      marketApiKeys,
      originalMarketKey: selection.market_key,
      displayName: marketConfig.label,
    })

    // Create a new selection object with all the same properties
    const preparedSelection = { 
      ...selection,
      sport_key: sportApiKey,
      market_key: marketApiKeys,
      market_display: marketConfig.label || selection.market_key, // Fallback to original if no label
    }

    // Ensure odds_data exists
    if (!preparedSelection.odds_data) {
      console.log("[BetslipDialog] No odds_data found, initializing empty object")
      preparedSelection.odds_data = {}
    }

    // Add timestamp to any odds data that doesn't have it
    Object.keys(preparedSelection.odds_data).forEach((bookmaker) => {
      if (!preparedSelection.odds_data[bookmaker].last_update) {
        console.log(`[BetslipDialog] Adding timestamp to ${bookmaker} odds`)
        preparedSelection.odds_data[bookmaker].last_update = new Date().toISOString()
      }
    })

    console.log("[BetslipDialog] Prepared selection:", preparedSelection)
    return preparedSelection
  }

  // Helper function to get proper market label
  const getMarketLabel = (marketKey: string, sport = "baseball_mlb"): string => {
    // Handle comma-separated market keys by taking the first part (base market)
    const baseMarketKey = marketKey.split(",")[0].trim()

    // Get markets for the specific sport
    const markets = getMarketsForSport(sport)

    // Find market config using the base market key - try multiple approaches
    let marketConfig = markets.find((m) => m.apiKey === baseMarketKey)

    // If not found by apiKey, try by value (in case marketKey is actually a value)
    if (!marketConfig) {
      marketConfig = markets.find((m) => m.value === baseMarketKey)
    }

    // If not found, try by label (in case marketKey is actually a label)
    if (!marketConfig) {
      marketConfig = markets.find((m) => m.label === baseMarketKey)
    }

    // Return the proper label, or fallback to formatted base market key
    return marketConfig?.label || baseMarketKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const handleRemoveSelection = async (selectionId: string, betslipId: string) => {
    try {
      await removeSelection(selectionId, betslipId)
      toast.success("Selection removed")
    } catch (error) {
      console.error("Error removing selection:", error)
      toast.error("Failed to remove selection")
    }
  }

  const toggleExpandBetslip = (betslipId: string) => {
    setExpandedBetslip(expandedBetslip === betslipId ? null : betslipId)
  }

  // Helper function to get best odds for a selection
  const getBestOdds = (selection: any): { odds: string; hasOdds: boolean; sportsbook: string; logo?: string } => {
    if (!selection.odds_data) {
      return { odds: "N/A", hasOdds: false, sportsbook: "", logo: undefined }
    }

    try {
      const oddsData = typeof selection.odds_data === "string" ? JSON.parse(selection.odds_data) : selection.odds_data
      const isOver = selection.selection?.toLowerCase().includes("over")
      
      let bestOdds = -Infinity
      let bestSportsbook = ""
      let bestLogo = ""

      // Iterate through all sportsbooks to find the best odds
      Object.entries(oddsData).forEach(([sportsbookKey, bookOdds]: [string, any]) => {
        if (!bookOdds) return

        let currentOdds: number | null = null

        // Handle new format (with over/under structure)
        if (bookOdds.over || bookOdds.under) {
          const relevantOdds = isOver ? bookOdds.over?.price : bookOdds.under?.price
          if (relevantOdds !== undefined) {
            currentOdds = relevantOdds
          }
        }
        // Handle old format (with direct odds field)
        else if (bookOdds.odds !== undefined) {
          currentOdds = bookOdds.odds
        }

        // Compare odds (higher is better for positive odds, closer to 0 is better for negative odds)
        if (currentOdds !== null) {
          if (currentOdds > bestOdds) {
            bestOdds = currentOdds
            bestSportsbook = sportsbookKey
            
            // Find the sportsbook logo
            const sportsbookData = sportsbooks.find((book) => 
              book.id === sportsbookKey || 
              book.name.toLowerCase().replace(/\s+/g, '') === sportsbookKey.toLowerCase().replace(/\s+/g, '')
            )
            bestLogo = sportsbookData?.logo || ""
          }
        }
      })

      if (bestOdds !== -Infinity && bestSportsbook) {
        return {
          odds: bestOdds > 0 ? `+${bestOdds}` : `${bestOdds}`,
          hasOdds: true,
          sportsbook: bestSportsbook,
          logo: bestLogo
        }
      }
    } catch (e) {
      console.error("Error parsing odds data:", e)
    }

    return { odds: "N/A", hasOdds: false, sportsbook: "", logo: undefined }
  }

  // Update the display of market keys in the UI with proper formatting
  const formatMarketDisplay = (selection: Partial<BetslipSelection>) => {
    const sportKey = selection.sport_key || "baseball_mlb"
    const line = selection.line

    // Always use getMarketLabel to ensure proper display, even if market_display exists
    // because market_display might contain API keys instead of proper labels
    const marketToUse = selection.market_key || selection.market_display || ""
    const marketLabel = getMarketLabel(marketToUse, sportKey)

    // Handle over/under display with lines
    if (line !== null && line !== undefined) {
      const isUnder = selection.selection?.toLowerCase().includes("under")
      if (isUnder) {
        return `U ${line} ${marketLabel}` // Exact line for unders
      } else {
        const roundedLine = Math.ceil(line)
        return `${roundedLine}+ ${marketLabel}` // Rounded up for overs
      }
    }

    return marketLabel
  }

  const handleBetslipSelect = async (betslipId: string, selection: BetslipSelectionInput) => {
    console.log("[BetslipDialog] handleBetslipSelect called with:", { betslipId, selection })
    try {
      // First check for exact match (same line)
      if (selectionExists(betslipId, selection)) {
        toast.error("This selection already exists in the betslip")
        onOpenChange(false)
        return
      }

      // Then check for conflicting selection (different line)
      const existingSelection = findConflictingSelection(betslipId, selection)
      if (existingSelection) {
        // Show conflict resolution modal
        setConflictingSelection({
          existingSelection,
          newSelection: selection,
          betslipId,
        })
        return
      }

      // Prepare selection with all odds data
      const preparedSelection = prepareSelectionWithOdds(selection)
      console.log("[BetslipDialog] Adding prepared selection to betslip:", preparedSelection)

      // If no conflicts, add the selection
      const result = await addSelection(preparedSelection, betslipId)
      console.log("[BetslipDialog] Result from addSelection:", result)
      
      setActiveBetslip(betslipId)
      onOpenChange(false)
      toast.success("Added to betslip")
    } catch (error) {
      console.error("[BetslipDialog] Error adding selection to betslip:", error)
      toast.error("Failed to add selection to betslip")
    }
  }

  const handleCreateBetslip = async (selection: BetslipSelectionInput) => {
    if ((betslips?.length || 0) >= 5) {
      toast.error("You can't have more than 5 betslips")
      return
    }

    setIsCreatingBetslip(true)
    try {
      console.log("[BetslipDialog] Creating new betslip with title:", newBetslipTitle || undefined)
      
      // Create the betslip and get its ID from the response
      const newBetslip = await createBetslip(newBetslipTitle || undefined)
      
      if (!newBetslip) {
        console.error("[BetslipDialog] Failed to create betslip - newBetslip is null")
        toast.error("Failed to create betslip")
        return
      }

      console.log("[BetslipDialog] Successfully created betslip:", newBetslip)

      // Clear the form and close the dialog
      setNewBetslipTitle("")
      setShowNewBetslipDialog(false)

      // Prepare selection with all odds data
      const preparedSelection = prepareSelectionWithOdds(selection)
      console.log("[BetslipDialog] Adding selection to new betslip:", { 
        betslipId: newBetslip.id, 
        preparedSelection 
      })

      // Add the selection directly to the new betslip (skip conflict checks for new betslip)
      const result = await addSelection(preparedSelection, newBetslip.id)
      console.log("[BetslipDialog] Result from addSelection to new betslip:", result)
      
      if (result) {
        // Set the new betslip as active
        setActiveBetslip(newBetslip.id)
        toast.success(`Created "${newBetslip.title || 'New Betslip'}" and added selection`)
      } else {
        toast.error("Created betslip but failed to add selection")
      }
      
      // Always close the main dialog after creation attempt
      onOpenChange(false)
    } catch (error) {
      console.error("Error in handleCreateBetslip:", error)
      toast.error("Failed to create betslip")
    } finally {
      setIsCreatingBetslip(false)
    }
  }

  const handleResolveConflict = async (shouldReplace: boolean) => {
    if (!conflictingSelection) return

    try {
      if (shouldReplace) {
        // Prepare selection with all odds data
        const preparedSelection = prepareSelectionWithOdds(conflictingSelection.newSelection)
        await replaceBetslipSelection(
          conflictingSelection.existingSelection.id,
          conflictingSelection.betslipId,
          preparedSelection,
        )
        toast.success("Selection replaced successfully")
      }

      setConflictingSelection(null)
      onOpenChange(false)
    } catch (error) {
      console.error("Error resolving selection conflict:", error)
      toast.error("Failed to resolve selection conflict")
    }
  }

  // Check for authentication before showing dialog
  if (!user) {
    setShowAuthModal(true)
    return null
  }

  // Check if selection is null
  if (!selection) {
    return null
  }

  // Create default betslip if none exists
  if (!betslips || betslips.length === 0) {
    createBetslip("My Betslip", true).then((newBetslip) => {
      if (newBetslip) {
        // Prepare selection with all odds data
        const preparedSelection = prepareSelectionWithOdds(selection)
        addSelection(preparedSelection, newBetslip.id)
        toast.success("Added to new betslip")
      }
    })
    return null
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            "sm:max-w-2xl overflow-hidden flex flex-col",
            // Mobile-specific height and positioning
            isMobile ? "h-[85vh] max-h-[85vh] w-[95vw] max-w-[95vw]" : "max-h-[90vh]",
          )}
        >
          <DialogHeader className="pb-4 flex-shrink-0">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Add to Betslip
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">Choose which betslip to add your selection to</p>
          </DialogHeader>

          <div
            className={cn(
              "flex-1 overflow-y-auto overflow-x-hidden",
              // Mobile-specific scrolling improvements
              isMobile && "overscroll-behavior-y-contain",
            )}
          >
            <div
              className={cn(
                "grid gap-3 pb-4",
                // Mobile: single column, Desktop: 2 columns
                isMobile ? "grid-cols-1 px-1" : "grid-cols-1 sm:grid-cols-2 pr-1",
              )}
            >
              <AnimatePresence>
                {betslips?.map((betslip, index) => (
                  <motion.div
                    key={betslip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "relative rounded-xl border-2 transition-all duration-300 overflow-hidden",
                      "hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10",
                      "bg-card/50 backdrop-blur-sm",
                      // Dynamic height based on expansion and mobile
                      expandedBetslip === betslip.id
                        ? isMobile
                          ? "min-h-[300px]"
                          : "min-h-[250px]"
                        : isMobile
                          ? "min-h-[180px]"
                          : "min-h-[160px]",
                    )}
                  >
                    {/* Clickable Card Body - Add to Betslip */}
              <button
                onClick={() => handleBetslipSelect(betslip.id, selection)}
                className={cn(
                        "w-full p-4 pb-2 text-left group relative",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-t-xl",
                        // iOS-style touch feedback
                        "active:bg-blue-500/5 transition-all duration-150",
                        // Minimum touch target size (44px iOS standard)
                        "min-h-[44px]",
                      )}
                      style={{
                        WebkitTapHighlightColor: "transparent", // Remove default iOS tap highlight
                      }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                    {betslip.is_default && (
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex-shrink-0">
                              <Star className="h-3 w-3 fill-white text-white" />
                            </div>
                    )}
                          <span className="font-semibold text-foreground truncate">
                      {betslip.title || `Slip ${(betslips?.indexOf(betslip) || 0) + 1}`}
                    </span>
                  </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <span className="text-xs font-bold">{betslip.selections.length}</span>
                          </div>
                        </div>
                </div>

                {/* Selections Preview */}
                      <div className={cn("space-y-3 relative z-10", isMobile ? "min-h-[100px]" : "min-h-[80px]")}>
                  {betslip.selections.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-4 text-center">
                            <Target className="h-8 w-8 text-muted-foreground/50 mb-2" />
                            <p className="text-sm text-muted-foreground">Empty betslip</p>
                            <p className="text-xs text-muted-foreground/70">Ready for your first pick</p>
                          </div>
                        ) : (
                          <>
                            {/* Show first 2 selections or all if expanded */}
                            {(expandedBetslip === betslip.id ? betslip.selections : betslip.selections.slice(0, 2)).map(
                              (sel, selIndex) => (
                                <motion.div
                                  key={sel.id}
                                  className={cn(
                                    "rounded-lg bg-muted/30 relative group/selection",
                                    // Mobile: more padding for better touch experience
                                    isMobile ? "p-4" : "p-3",
                                  )}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: index * 0.05 + selIndex * 0.02 }}
                                >
                                  {/* Main content area with proper spacing for remove button */}
                                  <div className={cn("pr-12", isMobile && "pr-16")}>
                                    {/* Player Name - Top Line */}
                                    <div className="font-medium text-foreground mb-1 text-sm truncate">
                            {sel.player_name || `${sel.home_team} vs ${sel.away_team}`}
                          </div>

                                    {/* Market and Line - Second Line */}
                                    <div className="text-xs text-blue-600 dark:text-blue-400 mb-2 truncate">
                                      {formatMarketDisplay(sel)}
                                    </div>

                                    {/* DraftKings Odds Display - Third Line */}
                                    {(() => {
                                      const { odds, hasOdds, sportsbook, logo } = getBestOdds(sel)

                                      if (hasOdds && logo) {
                                        return (
                                          <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 relative flex-shrink-0">
                                              <Image
                                                src={logo || "/placeholder.svg"}
                                                alt={sportsbook}
                                                fill
                                                className="object-contain"
                                              />
                        </div>
                                            <div
                                              className={cn(
                                                "px-2 py-1 rounded-md text-xs font-mono font-bold border inline-flex items-center",
                                                odds.startsWith("+")
                                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                                  : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
                                              )}
                                            >
                                              {odds}
                                            </div>
                                          </div>
                                        )
                                      }
                                      return null
                                    })()}
                </div>

                                  {/* Remove button - Always visible on mobile, hover on desktop */}
                                  {(expandedBetslip === betslip.id || isMobile) && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleRemoveSelection(sel.id, betslip.id)
                                      }}
                                      className={cn(
                                        "absolute flex items-center justify-center rounded-full transition-all duration-200",
                                        // iOS-style touch target (44px minimum) - positioned to not overlap with content
                                        isMobile
                                          ? "top-2 right-2 w-10 h-10 min-w-[44px] min-h-[44px]"
                                          : "top-2 right-2 w-6 h-6 min-w-[24px] min-h-[24px]",
                                        // Mobile: always visible with iOS-style background
                                        isMobile
                                          ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                                          : "opacity-0 group-hover/selection:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30",
                                        // iOS-style active state
                                        "active:scale-95 active:bg-red-500/20",
                                      )}
                                      style={{
                                        WebkitTapHighlightColor: "transparent",
                                      }}
                                    >
                                      <Trash2
                                        className={cn("transition-all duration-200", isMobile ? "h-4 w-4" : "h-3 w-3")}
                                      />
                                    </button>
                                  )}
                                </motion.div>
                              ),
                            )}
                          </>
                        )}
                      </div>

                      {/* Add button overlay on hover - only for body and not on mobile */}
                      {expandedBetslip !== betslip.id && !isMobile && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-t-xl backdrop-blur-sm pointer-events-none">
                          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Add Here
                    </div>
                        </div>
                      )}
                    </button>

                    {/* Card Footer - Controls */}
                    {betslip.selections.length > 0 && (
                      <div className="px-4 pb-4 border-t border-border/50">
                        {betslip.selections.length > 2 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleExpandBetslip(betslip.id)
                            }}
                            className={cn(
                              "w-full text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors flex items-center justify-center gap-1 mt-2",
                              // iOS-style touch target with mobile-specific sizing
                              isMobile ? "py-4 px-2 min-h-[44px] text-sm" : "py-3 px-2 min-h-[44px]",
                              "active:bg-blue-500/10",
                            )}
                            style={{
                              WebkitTapHighlightColor: "transparent",
                            }}
                          >
                            {expandedBetslip === betslip.id ? (
                              <>
                                <ChevronUp className="h-3 w-3" />
                                Show Less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3" />
                                View All ({betslip.selections.length})
                              </>
                            )}
                          </button>
                        )}

                        {/* Show count if not expanded and more selections */}
                        {expandedBetslip !== betslip.id && betslip.selections.length > 2 && (
                          <div className="text-xs text-muted-foreground text-center py-1">
                            +{betslip.selections.length - 2} more selections
                  </div>
                )}
                  </div>
                )}
                  </motion.div>
            ))}
              </AnimatePresence>

            {/* Create New Betslip Button */}
            {(betslips?.length || 0) < 5 && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (betslips?.length || 0) * 0.05 }}
                onClick={() => setShowNewBetslipDialog(true)}
                className={cn(
                    "p-4 rounded-xl border-2 border-dashed border-muted-foreground/30",
                    "hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                    "flex flex-col items-center justify-center gap-3 text-center",
                    "bg-card/30 backdrop-blur-sm transition-all duration-300",
                    // Mobile-specific sizing
                    isMobile ? "min-h-[160px]" : "min-h-[140px]",
                    // iOS-style touch feedback
                    "active:scale-[0.98] active:bg-blue-500/5",
                  )}
                  style={{
                    WebkitTapHighlightColor: "transparent",
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                    <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground block">Create New Betslip</span>
                    <span className="text-xs text-muted-foreground">Start fresh with a new slip</span>
                  </div>
                </motion.button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create New Betslip Dialog */}
      <Dialog open={showNewBetslipDialog} onOpenChange={setShowNewBetslipDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create New Betslip</DialogTitle>
            <p className="text-sm text-muted-foreground">Give your betslip a memorable name</p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Betslip Name (Optional)
              </Label>
              <Input
                id="title"
                placeholder={`Betslip ${(betslips?.length || 0) + 1}`}
                value={newBetslipTitle}
                onChange={(e) => setNewBetslipTitle(e.target.value)}
                className="h-12" // iOS-style height
                maxLength={50}
                style={{
                  WebkitTapHighlightColor: "transparent",
                }}
              />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setShowNewBetslipDialog(false)}
              className="h-12 px-6 min-h-[44px]" // iOS touch target
              style={{
                WebkitTapHighlightColor: "transparent",
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleCreateBetslip(selection)}
              disabled={isCreatingBetslip}
              className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 min-h-[44px]"
              style={{
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {isCreatingBetslip ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create & Add"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conflict Resolution Dialog */}
      <Dialog open={conflictingSelection !== null} onOpenChange={() => handleResolveConflict(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-amber-600 dark:text-amber-400">
              Replace Existing Selection?
            </DialogTitle>
            <p className="text-sm text-muted-foreground">You already have a different line for this player</p>
          </DialogHeader>
          <div className="py-4">
            {conflictingSelection && (
              <div className="space-y-4">
                {/* Current Selection */}
                <div className="p-4 rounded-xl border bg-muted/30">
                  <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                    Current Selection
                  </div>
                  <div className="text-sm font-semibold text-foreground mb-1">
                    {conflictingSelection.existingSelection.player_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatMarketDisplay(conflictingSelection.existingSelection)}
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                    <ArrowDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>

                {/* New Selection */}
                <div className="p-4 rounded-xl border bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-blue-500/20">
                  <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wide">
                    New Selection
                  </div>
                  <div className="text-sm font-semibold text-foreground mb-1">
                    {conflictingSelection.newSelection.player_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatMarketDisplay(conflictingSelection.newSelection)}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => handleResolveConflict(false)}
              className="h-12 px-6 min-h-[44px]"
              style={{
                WebkitTapHighlightColor: "transparent",
              }}
            >
              Keep Current
            </Button>
            <Button 
              onClick={() => handleResolveConflict(true)}
              className="h-12 px-6 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 min-h-[44px]"
              style={{
                WebkitTapHighlightColor: "transparent",
              }}
            >
              Replace Selection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 
