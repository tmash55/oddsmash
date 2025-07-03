"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { ExternalLink, Plus, Star, ArrowDown } from "lucide-react"
import { BetslipSelection } from "@/types/betslip"
import { useBetActions } from "@/hooks/use-bet-actions"
import { DialogFooter } from "@/components/ui/dialog"

interface BetActionsProps {
  selection: Omit<BetslipSelection, "id" | "betslip_id" | "created_at" | "updated_at">
  directBetLink?: string
  className?: string
}

export function BetActions({ selection, directBetLink, className }: BetActionsProps) {
  const {
    showBetslipDialog,
    setShowBetslipDialog,
    showNewBetslipDialog,
    setShowNewBetslipDialog,
    selectedBetslipId,
    newBetslipTitle,
    setNewBetslipTitle,
    handleAddToBetslip,
    handleBetslipSelect,
    handleCreateBetslip,
    handleDirectBet,
    betslips,
    conflictingSelection,
    handleResolveConflict
  } = useBetActions()

  return (
    <>
      <div className={cn("flex items-center gap-2", className)}>
        {directBetLink && (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleDirectBet(directBetLink)}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleAddToBetslip(selection)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={showBetslipDialog} onOpenChange={setShowBetslipDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Betslip</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            {betslips.map((betslip) => (
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
                      {betslip.title || `Slip ${betslips.indexOf(betslip) + 1}`}
                    </span>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                    {betslip.selections.length} Picks
                  </span>
                </div>

                {/* Selections Preview - Always visible */}
                <div className="space-y-2">
                  {betslip.selections.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No selections yet</p>
                  ) : (
                    <>
                      {/* Show first 2 selections */}
                      {betslip.selections.slice(0, 2).map((sel) => (
                        <div key={sel.id} className="text-sm">
                          {/* Market and Line */}
                          <div className="text-xs font-medium text-foreground mb-0.5">
                            {Math.ceil(sel.line || 0)}+ {sel.market_key.split('_').map(word => 
                              word.toLowerCase() === 'mlb' ? 'MLB' : 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </div>
                          {/* Player Name */}
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
                        {betslip.title || `Slip ${betslips.indexOf(betslip) + 1}`}
                      </span>
                      </div>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                        {betslip.selections.length} Picks
                      </span>
                    </div>
                    {/* Show all selections on hover */}
                    {betslip.selections.map((sel) => (
                      <div key={sel.id} className="text-sm">
                        {/* Market and Line */}
                        <div className="text-xs font-medium text-foreground mb-0.5">
                          {Math.ceil(sel.line || 0)}+ {sel.market_key.split('_').map(word => 
                            word.toLowerCase() === 'mlb' ? 'MLB' : 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </div>
                        {/* Player Name */}
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
            {betslips.length < 5 && (
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
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowNewBetslipDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => handleCreateBetslip(selection)}>
              Create Betslip
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Conflict Resolution Modal */}
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
            
            {/* Existing Selection */}
            {conflictingSelection && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg border bg-muted/50">
                  <div className="text-xs font-medium text-foreground mb-0.5">
                    {Math.ceil(conflictingSelection.existingSelection.line || 0)}+ {
                      conflictingSelection.existingSelection.market_key.split('_')
                        .map(word => word.toLowerCase() === 'mlb' ? 'MLB' : word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')
                    }
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {conflictingSelection.existingSelection.player_name}
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                </div>

                {/* New Selection */}
                <div className="p-3 rounded-lg border bg-primary/5">
                  <div className="text-xs font-medium text-foreground mb-0.5">
                    {Math.ceil(conflictingSelection.newSelection.line || 0)}+ {
                      conflictingSelection.newSelection.market_key.split('_')
                        .map(word => word.toLowerCase() === 'mlb' ? 'MLB' : word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')
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