"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  X, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Receipt,
  ArrowRight,
  Edit3
} from "lucide-react"
import Image from "next/image"
import { useBetslip } from "@/contexts/betslip-context"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import type { Betslip } from "@/types/betslip"

interface BetslipCartDropdownProps {
  isOpen: boolean
  onClose: () => void
  totalSelections: number
}

export function BetslipCartDropdown({ 
  isOpen, 
  onClose, 
  totalSelections 
}: BetslipCartDropdownProps) {
  const {
    betslips: contextBetslips,
    activeBetslipId,
    isLoading,
    createBetslip,
    deleteBetslip,
    setActiveBetslip,
    clearBetslip,
    updateBetslipTitle,
    setBetslipAsDefault,
  } = useBetslip()

  // Sort betslips: ones with selections first, then by updated_at
  const sortedBetslips = [...contextBetslips].sort((a: Betslip, b: Betslip) => {
    // First sort by whether they have selections
    const aHasSelections = (a.selections?.length || 0) > 0
    const bHasSelections = (b.selections?.length || 0) > 0
    if (aHasSelections !== bHasSelections) {
      return aHasSelections ? -1 : 1
    }
    // Then sort by updated_at date (most recent first)
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })

  // Click outside is now handled by the backdrop
  if (!isOpen) return null

  return (
    <AnimatePresence>
      {/* Full-screen backdrop blur - covers entire viewport like Apple's design */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xl"
        style={{ 
          backdropFilter: 'blur(16px) saturate(1.8) brightness(0.7)',
          WebkitBackdropFilter: 'blur(16px) saturate(1.8) brightness(0.7)'
        }}
      />
      
      {/* Dropdown with solid background */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="betslip-cart-dropdown fixed left-0 right-0 top-16 z-50 bg-background border-b border-border shadow-2xl"
        style={{ maxHeight: '70vh' }}
      >
        {/* Header with solid background */}
        <div className="flex items-center justify-between p-6 border-b bg-background">
          <div className="flex items-center gap-3">
            <Receipt className="h-6 w-6 text-primary" />
            <h3 className="font-semibold text-xl">
              Betslip Cart
            </h3>
            {totalSelections > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalSelections} selections
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-hidden" style={{ maxHeight: 'calc(70vh - 80px)' }}>
          {sortedBetslips.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                <Receipt className="h-10 w-10 text-muted-foreground" />
              </div>
              <h4 className="font-medium text-xl mb-3">Your cart is empty</h4>
              <p className="text-muted-foreground text-base mb-8 max-w-md">
                Start building your betslips by adding player props and bets
              </p>
              <Button asChild size="lg">
                <a href="/mlb/props" onClick={onClose}>
                  Browse Player Props
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
          ) : (
            /* Betslips Grid - Full width Apple style */
            <div className="px-6 py-6">
              <ScrollArea className="h-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                  {sortedBetslips.map((betslip, index) => (
                    <div key={betslip.id} className="h-full">
                      <BetslipCartColumn 
                        betslip={betslip} 
                        index={index}
                      />
                    </div>
                  ))}
                  
                  {/* Add New Betslip Card */}
                  {contextBetslips.length < 5 && (
                    <Card className="h-full border-dashed border-2 border-muted-foreground/25 hover:border-primary/50 transition-colors">
                      <CardContent className="flex flex-col items-center justify-center py-12 px-4 h-full">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                          <Plus className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h4 className="font-medium text-center mb-2">Add New Betslip</h4>
                        <p className="text-muted-foreground text-sm text-center mb-4">
                          Create another betslip to organize your bets
                        </p>
                        <Button variant="outline" size="sm">
                          Create Betslip
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Footer */}
        {contextBetslips.length > 0 && (
          <div className="border-t p-6 bg-muted/50">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="text-base text-muted-foreground">
                {contextBetslips.length} betslip{contextBetslips.length !== 1 ? 's' : ''} • {totalSelections} total selections
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="default">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Manage Slips
                </Button>
                <Button size="default">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

// Individual Betslip Column Component
function BetslipCartColumn({ betslip, index }: { betslip: Betslip; index: number }) {
  const selectionCount = betslip.selections?.length || 0
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {betslip.title || `Betslip ${index + 1}`}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {selectionCount} picks
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {/* Selections Preview */}
        <div className="flex-1 space-y-2 min-h-[200px]">
          {betslip.selections?.slice(0, 3).map((selection: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {selection.player_name || selection.description}
                </p>
                <p className="text-muted-foreground text-xs truncate">
                  {selection.market_display || selection.market_key} {selection.line ? `${selection.line}+` : ''}
                </p>
              </div>
              <div className="text-right ml-2">
                <p className="font-medium text-xs">
                  {selection.odds > 0 ? `+${selection.odds}` : selection.odds}
                </p>
              </div>
            </div>
          ))}
          
          {selectionCount > 3 && (
            <div className="text-xs text-muted-foreground text-center py-1">
              +{selectionCount - 3} more selections
            </div>
          )}

          {selectionCount === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-6">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No selections yet</p>
              <Button variant="link" size="sm" asChild className="mt-2">
                <a href="/mlb/props">Browse Props</a>
              </Button>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            View Details
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            Compare Odds
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 