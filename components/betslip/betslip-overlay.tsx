"use client"

import { useBetslip } from "@/contexts/betslip-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Icons } from "@/components/shared/icons"
import { BetslipSelection } from "@/components/betslip/betslip-selection"
import { BetslipFooter } from "@/components/betslip/betslip-footer"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, Pencil, Star, Trash2 } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface BetslipOverlayProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function BetslipOverlay({ isOpen = false, onClose }: BetslipOverlayProps) {
  const {
    betslips,
    activeBetslipId,
    isLoading,
    createBetslip,
    deleteBetslip,
    setActiveBetslip,
    clearBetslip,
    updateBetslipTitle,
    setBetslipAsDefault,
  } = useBetslip()

  const { user, setShowAuthModal } = useAuth()
  const [showNewBetslipDialog, setShowNewBetslipDialog] = useState(false)
  const [showEditTitleDialog, setShowEditTitleDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [newBetslipTitle, setNewBetslipTitle] = useState("")
  const [editingBetslipId, setEditingBetslipId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")

  const handleCreateBetslip = () => {
    if (betslips.length >= 5) {
      toast.error("You can't have more than 5 betslips")
      return
    }
    createBetslip(newBetslipTitle, betslips.length === 0) // Make first betslip default
    setNewBetslipTitle("")
    setShowNewBetslipDialog(false)
  }

  const handleEditTitle = (betslipId: string) => {
    const betslip = betslips.find(b => b.id === betslipId)
    if (betslip) {
      setEditingBetslipId(betslipId)
      setEditingTitle(betslip.title || "")
      setShowEditTitleDialog(true)
    }
  }

  const handleSaveTitle = async () => {
    if (editingBetslipId) {
      await updateBetslipTitle(editingBetslipId, editingTitle)
      setShowEditTitleDialog(false)
      setEditingBetslipId(null)
      setEditingTitle("")
    }
  }

  const handleSetDefault = async (betslipId: string) => {
    await setBetslipAsDefault(betslipId)
    toast.success("Default betslip updated")
  }

  if (!isOpen) return null

  // Show loading state
  if (isLoading) {
    return (
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "fixed right-0 top-0 z-50 flex h-screen w-96 flex-col",
          "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
          "border-l shadow-xl"
        )}
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold">Betslip</h2>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Icons.spinner className="h-8 w-8 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading your betslips...</p>
          </div>
        </div>
      </motion.div>
    )
  }

  const activeBetslip = betslips.find(b => b.id === activeBetslipId)

  return (
    <>
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "fixed right-0 top-0 z-50 flex h-screen w-96 flex-col",
              "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
              "border-l shadow-xl"
            )}
          >
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-semibold">Betslip</h2>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowNewBetslipDialog(true)}
                disabled={betslips.length >= 5}
              >
                <Icons.plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="border-b px-6 py-4">
              <div className="flex items-center gap-2">
                <Select 
                  value={activeBetslipId || undefined} 
                  onValueChange={setActiveBetslip}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue>
                      {activeBetslip ? (
                        <div className="flex items-center gap-2">
                          <span>
                            {activeBetslip.title || `Slip ${betslips.indexOf(activeBetslip) + 1}`}
                          </span>
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                            {activeBetslip.selections.length}
                          </span>
                        </div>
                      ) : (
                        "Select a betslip"
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {betslips.map((betslip) => (
                      <SelectItem 
                        key={betslip.id} 
                        value={betslip.id}
                      >
                        <div className="flex items-center gap-2">
                          <Star 
                            className={cn(
                              "h-3 w-3",
                              betslip.is_default ? "fill-primary text-primary" : "text-muted-foreground"
                            )}
                          />
                          <span>
                            {betslip.title || `Slip ${betslips.indexOf(betslip) + 1}`}
                          </span>
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                            {betslip.selections.length}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {activeBetslip && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleSetDefault(activeBetslip.id)}
                    >
                      <Star 
                        className={cn(
                          "h-4 w-4 transition-all",
                          activeBetslip.is_default ? "fill-primary text-primary" : "text-muted-foreground hover:text-primary"
                        )}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => activeBetslip && handleEditTitle(activeBetslip.id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {betslips.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {activeBetslip && (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearBetslip(activeBetslip.id)}
                    disabled={activeBetslip.selections.length === 0}
                  >
                    Clear All
                  </Button>
                </div>

                {activeBetslip.selections.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
                    <div className="space-y-4">
                      <Icons.empty className="mx-auto h-12 w-12 opacity-50" />
                      {!user ? (
                        <>
                          <p className="font-medium">Sign in to use Betslip</p>
                          <p className="max-w-[24ch] mx-auto">
                            Create an account or sign in to save your selections and compare odds across sportsbooks
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => setShowAuthModal(true)}
                            className="mt-2"
                          >
                            Sign In
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="font-medium">Your betslip is empty</p>
                          <p className="max-w-[24ch] mx-auto">
                            Add bets to your betslip to compare odds across popular sportsbooks
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-hidden px-6">
                      <ScrollArea className="h-full pr-4">
                        <div className="space-y-4 pb-4">
                          {activeBetslip.selections.map((selection) => (
                            <BetslipSelection
                              key={selection.id}
                              selection={selection}
                              betslipId={activeBetslip.id}
                            />
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                    
                    <div className="border-t px-6 py-4">
                      <BetslipFooter 
                        betslipId={activeBetslip.id}
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showNewBetslipDialog} onOpenChange={setShowNewBetslipDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Betslip</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Betslip Title</Label>
              <Input
                id="title"
                placeholder="Enter a title for your betslip"
                value={newBetslipTitle}
                onChange={(e) => setNewBetslipTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewBetslipDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBetslip}>
              Create Betslip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditTitleDialog} onOpenChange={setShowEditTitleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Betslip Title</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Betslip Title</Label>
              <Input
                id="edit-title"
                placeholder="Enter a new title"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditTitleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTitle}>
              Save Title
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Betslip</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this betslip? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (activeBetslip) {
                  deleteBetslip(activeBetslip.id)
                  setShowDeleteDialog(false)
                }
              }}
            >
              Delete Betslip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 