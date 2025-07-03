"use client"

import { useState } from "react"
import { useBetslip } from "@/contexts/betslip-context"
import { useAuth } from "@/components/auth/auth-provider"
import { BetslipSelection } from "@/types/betslip"
import { toast } from "sonner"

export type BetslipSelectionInput = Omit<BetslipSelection, "id" | "betslip_id" | "created_at" | "updated_at">

interface ConflictingSelection {
  existingSelection: BetslipSelection
  newSelection: BetslipSelectionInput
  betslipId: string
}

export function useBetActions() {
  const { betslips, addSelection, createBetslip, setActiveBetslip, activeBetslipId, removeSelection, replaceBetslipSelection } = useBetslip()
  const { user, setShowAuthModal } = useAuth()
  const [showBetslipDialog, setShowBetslipDialog] = useState(false)
  const [showNewBetslipDialog, setShowNewBetslipDialog] = useState(false)
  const [selectedBetslipId, setSelectedBetslipId] = useState<string>()
  const [newBetslipTitle, setNewBetslipTitle] = useState("")
  const [conflictingSelection, setConflictingSelection] = useState<ConflictingSelection | null>(null)

  // Helper function to check if a selection already exists in a betslip
  const selectionExists = (betslipId: string, selection: BetslipSelectionInput) => {
    console.log("Checking if selection exists in betslip:", { betslipId, selection })
    const betslip = betslips.find(b => b.id === betslipId)
    if (!betslip) {
      console.log("Betslip not found:", betslipId)
      return false
    }

    const exists = betslip.selections.some(s => 
      s.event_id === selection.event_id &&
      s.market_key === selection.market_key &&
      s.selection === selection.selection &&
      s.line === selection.line
    )
    console.log("Selection exists:", exists)
    return exists
  }

  // Helper function to find conflicting selections (same player/market, different line)
  const findConflictingSelection = (betslipId: string, selection: BetslipSelectionInput) => {
    const betslip = betslips.find(b => b.id === betslipId)
    if (!betslip) return null

    return betslip.selections.find(s => 
      s.player_name === selection.player_name && 
      s.market_key === selection.market_key &&
      s.line !== selection.line
    )
  }

  const handleAddToBetslip = async (selection: BetslipSelectionInput) => {
    console.log("handleAddToBetslip called with selection:", selection)
    if (!user) {
      setShowAuthModal(true)
      return
    }

    if (betslips.length === 0) {
      console.log("No betslips exist, creating default betslip")
      // Create default betslip if none exists
      await createBetslip("My Betslip", true)
      const defaultBetslipId = betslips[0]?.id
      if (defaultBetslipId) {
        await addSelection(selection, defaultBetslipId)
        toast.success("Added to new betslip")
      }
      return
    }

    setShowBetslipDialog(true)
  }

  const handleBetslipSelect = async (betslipId: string, selection: BetslipSelectionInput) => {
    console.log("handleBetslipSelect called with:", { betslipId, selection })
    
    try {
      // First check for exact match (same line)
      if (selectionExists(betslipId, selection)) {
        toast.error("This selection already exists in the betslip")
        setShowBetslipDialog(false)
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

      // If no conflicts, add the selection
      await addSelection(selection, betslipId)
      setSelectedBetslipId(betslipId)
      setActiveBetslip(betslipId)
      setShowBetslipDialog(false)
      toast.success("Added to betslip")
    } catch (error) {
      console.error("Error adding selection to betslip:", error)
      toast.error("Failed to add selection to betslip")
    }
  }

  const handleResolveConflict = async (shouldReplace: boolean) => {
    if (!conflictingSelection) return

    try {
      if (shouldReplace) {
        // Use the atomic replace operation instead of separate remove/add
        await replaceBetslipSelection(
          conflictingSelection.existingSelection.id,
          conflictingSelection.betslipId,
          conflictingSelection.newSelection
        )
        toast.success("Selection replaced successfully")
      }
      setConflictingSelection(null)
      setShowBetslipDialog(false)
    } catch (error) {
      console.error("Error resolving selection conflict:", error)
      toast.error("Failed to resolve selection conflict")
    }
  }

  const handleCreateBetslip = async (selection: BetslipSelectionInput) => {
    console.log("handleCreateBetslip called with selection:", selection)
    if (betslips.length >= 5) {
      toast.error("You can't have more than 5 betslips")
      return
    }

    try {
      // Create the betslip and get its ID from the response
      const newBetslip = await createBetslip(newBetslipTitle || undefined)
      console.log("Created new betslip:", newBetslip)
      
      if (!newBetslip) {
        console.error("Failed to create betslip")
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

  const handleDirectBet = (link: string) => {
    window.open(link, "_blank")
  }

  return {
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
  }
} 