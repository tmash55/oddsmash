"use client"

import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface BetslipDialogsProps {
  // New Betslip Dialog
  showNewBetslipDialog: boolean
  setShowNewBetslipDialog: (show: boolean) => void
  newBetslipTitle: string
  setNewBetslipTitle: (title: string) => void
  onCreateBetslip: () => void
  isCreating: boolean
  totalBetslips: number

  // Delete Dialog
  deleteConfirmOpen: boolean
  setDeleteConfirmOpen: (open: boolean) => void
  onConfirmDelete: () => void

  // Clear Dialog
  clearConfirmOpen: boolean
  setClearConfirmOpen: (open: boolean) => void
  onConfirmClear: () => void
}

export function BetslipDialogs({
  showNewBetslipDialog,
  setShowNewBetslipDialog,
  newBetslipTitle,
  setNewBetslipTitle,
  onCreateBetslip,
  isCreating,
  totalBetslips,
  deleteConfirmOpen,
  setDeleteConfirmOpen,
  onConfirmDelete,
  clearConfirmOpen,
  setClearConfirmOpen,
  onConfirmClear,
}: BetslipDialogsProps) {
  return (
    <>
      {/* New Betslip Dialog */}
      <Dialog open={showNewBetslipDialog} onOpenChange={setShowNewBetslipDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create New Betslip</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <Label htmlFor="betslip-name" className="text-sm font-medium">
                Betslip Name (Optional)
              </Label>
              <Input
                id="betslip-name"
                placeholder={`Betslip ${totalBetslips + 1}`}
                value={newBetslipTitle}
                onChange={(e) => setNewBetslipTitle(e.target.value)}
                maxLength={50}
                className="mt-2 h-11"
              />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setShowNewBetslipDialog(false)} className="h-11 px-6">
              Cancel
            </Button>
            <Button
              onClick={onCreateBetslip}
              disabled={isCreating}
              className="h-11 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Betslip"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Delete Betslip</AlertDialogTitle>
            <AlertDialogDescription className="text-base leading-relaxed">
              Are you sure you want to delete this betslip? All selections will be lost and this action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="h-11 px-6">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete} className="h-11 px-6 bg-red-600 hover:bg-red-700 text-white">
              Delete Betslip
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Confirmation Dialog */}
      <AlertDialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Clear All Selections</AlertDialogTitle>
            <AlertDialogDescription className="text-base leading-relaxed">
              Are you sure you want to clear all selections from this betslip? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="h-11 px-6">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmClear} className="h-11 px-6 bg-red-600 hover:bg-red-700 text-white">
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
