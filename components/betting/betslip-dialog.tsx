"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Star, Plus, ArrowDown } from "lucide-react"
import { BetslipSelection } from "@/types/betslip"
import { useBetslip } from "@/contexts/betslip-context"
import { useAuth } from "@/components/auth/auth-provider"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { SPORT_MARKETS, SportMarket } from "@/lib/constants/markets"

interface BetslipDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selection: Omit<BetslipSelection, "id" | "betslip_id" | "created_at" | "updated_at">
}

interface ConflictingSelection {
  existingSelection: BetslipSelection
  newSelection: BetslipSelectionInput
  betslipId: string
}

type BetslipSelectionInput = Omit<BetslipSelection, "id" | "betslip_id" | "created_at" | "updated_at">

export function BetslipDialog({ open, onOpenChange, selection }: BetslipDialogProps) {
  const { betslips, addSelection, createBetslip, setActiveBetslip, replaceBetslipSelection } = useBetslip()
  const { user, setShowAuthModal } = useAuth()
  const [showNewBetslipDialog, setShowNewBetslipDialog] = useState(false)
  const [newBetslipTitle, setNewBetslipTitle] = useState("")
  const [conflictingSelection, setConflictingSelection] = useState<ConflictingSelection | null>(null)

  // Helper function to check if a selection already exists in a betslip
  const selectionExists = (betslipId: string, selection: BetslipSelectionInput) => {
    console.log("[BetslipDialog] Checking if selection exists:", { betslipId, selection })
    const betslip = betslips.find(b => b.id === betslipId)
    if (!betslip) {
      console.log("[BetslipDialog] Betslip not found:", betslipId)
      return false
    }

    const exists = betslip.selections.some(s => 
      s.event_id === selection.event_id &&
      s.market_key === selection.market_key &&
      s.selection === selection.selection &&
      s.line === selection.line &&
      s.player_name === selection.player_name
    )
    console.log("[BetslipDialog] Selection exists:", exists)
    return exists
  }

  // Helper function to find conflicting selections (same player/market, different line)
  const findConflictingSelection = (betslipId: string, selection: BetslipSelectionInput) => {
    console.log("[BetslipDialog] Checking for conflicting selection:", { betslipId, selection })
    const betslip = betslips.find(b => b.id === betslipId)
    if (!betslip) return null

    const conflict = betslip.selections.find(s => 
      s.player_name === selection.player_name && 
      s.market_key === selection.market_key &&
      s.line !== selection.line
    )
    console.log("[BetslipDialog] Found conflicting selection:", conflict)
    return conflict
  }

  // Helper function to ensure we have all available odds data
  const prepareSelectionWithOdds = (selection: BetslipSelectionInput): BetslipSelectionInput => {
    console.log("[BetslipDialog] Preparing selection with odds. Original selection:", selection)

    // Map sport key to API format
    const sportApiKey = selection.sport_key === 'mlb' ? 'baseball_mlb' : selection.sport_key

    // Get market config from our constants
    const marketConfig = SPORT_MARKETS[sportApiKey]?.find((m: SportMarket) => 
      m.value === selection.market_key || 
      m.label === selection.market_key
    )

    if (!marketConfig) {
      console.warn("[BetslipDialog] Market config not found:", selection.market_key)
      // If no config found, use the original market key as display name
      return {
        ...selection,
        sport_key: sportApiKey,
        market_display: selection.market_key
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
      displayName: marketConfig.label 
    })

    // Create a new selection object with all the same properties
    const preparedSelection = { 
      ...selection,
      sport_key: sportApiKey,
      market_key: marketApiKeys,
      market_display: marketConfig.label || selection.market_key // Fallback to original if no label
    }

    // Ensure odds_data exists
    if (!preparedSelection.odds_data) {
      console.log("[BetslipDialog] No odds_data found, initializing empty object")
      preparedSelection.odds_data = {}
    }

    // Add timestamp to any odds data that doesn't have it
    Object.keys(preparedSelection.odds_data).forEach(bookmaker => {
      if (!preparedSelection.odds_data[bookmaker].last_update) {
        console.log(`[BetslipDialog] Adding timestamp to ${bookmaker} odds`)
        preparedSelection.odds_data[bookmaker].last_update = new Date().toISOString()
      }
    })

    console.log("[BetslipDialog] Prepared selection:", preparedSelection)
    return preparedSelection
  }

  // Update the display of market keys in the UI
  const formatMarketDisplay = (selection: Partial<BetslipSelection>) => {
    return selection.market_display || selection.market_key?.split('_')
      .map(word => word.toLowerCase() === 'mlb' ? 'MLB' : word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
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
          betslipId
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
    if (betslips.length >= 5) {
      toast.error("You can't have more than 5 betslips")
      return
    }

    try {
      // Create the betslip and get its ID from the response
      const newBetslip = await createBetslip(newBetslipTitle || undefined)
      
      if (!newBetslip) {
        toast.error("Failed to create betslip")
        return
      }

      setNewBetslipTitle("")
      setShowNewBetslipDialog(false)

      // Add the selection to the new betslip
      await handleBetslipSelect(newBetslip.id, selection)
    } catch (error) {
      console.error("Error in handleCreateBetslip:", error)
      toast.error("Failed to create betslip")
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
          preparedSelection
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

  // Create default betslip if none exists
  if (betslips.length === 0) {
    createBetslip("My Betslip", true).then(newBetslip => {
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Betslip</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            {betslips?.map((betslip) => (
              <button
                key={betslip.id}
                onClick={() => handleBetslipSelect(betslip.id, selection)}
                className={cn(
                  "relative p-4 rounded-lg border transition-all duration-200",
                  "hover:border-primary/50 hover:shadow-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20",
                  "group text-left"
                )}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {betslip.is_default && (
                      <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                    )}
                    <span className="font-medium">
                      {betslip.title || `Slip ${(betslips?.indexOf(betslip) || 0) + 1}`}
                    </span>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                    {betslip.selections.length} Picks
                  </span>
                </div>

                {/* Selections Preview */}
                <div className="space-y-2">
                  {betslip.selections.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No selections yet</p>
                  ) : (
                    <>
                      {/* Show first 2 selections */}
                      {betslip.selections.slice(0, 2).map((sel) => (
                        <div key={sel.id} className="text-sm">
                          <div className="text-xs font-medium text-foreground mb-0.5">
                            {Math.ceil(sel.line || 0)}+ {formatMarketDisplay(sel)}
                          </div>
                          <div className="text-muted-foreground truncate">
                            {sel.player_name || `${sel.home_team} vs ${sel.away_team}`}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* Hover Preview - Additional selections */}
                {betslip.selections.length > 2 && (
                  <div className="absolute inset-0 rounded-lg bg-background/95 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-200 p-4 overflow-y-auto max-h-[300px] space-y-2">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {betslip.is_default && (
                          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                        )}
                        <span className="font-medium">
                          {betslip.title || `Slip ${(betslips?.indexOf(betslip) || 0) + 1}`}
                        </span>
                      </div>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                        {betslip.selections.length} Picks
                      </span>
                    </div>
                    {betslip.selections.map((sel) => (
                      <div key={sel.id} className="text-sm">
                        <div className="text-xs font-medium text-foreground mb-0.5">
                          {Math.ceil(sel.line || 0)}+ {formatMarketDisplay(sel)}
                        </div>
                        <div className="text-muted-foreground truncate">
                          {sel.player_name || `${sel.home_team} vs ${sel.away_team}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add button overlay on hover - Only show if no selections to preview */}
                {betslip.selections.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                    <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                      Add to this slip
                    </span>
                  </div>
                )}
              </button>
            ))}

            {/* Create New Betslip Button */}
            {(betslips?.length || 0) < 5 && (
              <button
                onClick={() => setShowNewBetslipDialog(true)}
                className={cn(
                  "p-4 rounded-lg border border-dashed",
                  "hover:border-primary/50 hover:shadow-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20",
                  "flex flex-col items-center justify-center gap-2 text-center"
                )}
              >
                <Plus className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Create New Betslip</span>
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create New Betslip Dialog */}
      <Dialog open={showNewBetslipDialog} onOpenChange={setShowNewBetslipDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Betslip</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Betslip Title
              </label>
              <input
                id="title"
                className="w-full rounded-md border px-3 py-2"
                placeholder="Enter a title for your betslip"
                value={newBetslipTitle}
                onChange={(e) => setNewBetslipTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewBetslipDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => handleCreateBetslip(selection)}>
              Create Betslip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <p className="text-sm text-muted-foreground mb-4">
              You already have a selection for this player:
            </p>
            
            {conflictingSelection && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg border bg-muted/50">
                  <div className="text-xs font-medium text-foreground mb-0.5">
                    {Math.ceil(conflictingSelection.existingSelection.line || 0)}+ {
                      formatMarketDisplay(conflictingSelection.existingSelection)
                    }
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {conflictingSelection.existingSelection.player_name}
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="p-3 rounded-lg border bg-primary/5">
                  <div className="text-xs font-medium text-foreground mb-0.5">
                    {Math.ceil(conflictingSelection.newSelection.line || 0)}+ {
                      formatMarketDisplay(conflictingSelection.newSelection)
                    }
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {conflictingSelection.newSelection.player_name}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleResolveConflict(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => handleResolveConflict(true)}
              className="bg-primary"
            >
              Replace Selection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 