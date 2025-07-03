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
  Edit3,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

interface BetslipCartMobileProps {
  isOpen: boolean
  onClose: () => void
  betslips: any[]
  totalSelections: number
}

export function BetslipCartMobile({ 
  isOpen, 
  onClose, 
  betslips, 
  totalSelections 
}: BetslipCartMobileProps) {
  const [activeBetslipIndex, setActiveBetslipIndex] = React.useState(0)

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          
          {/* Full Screen Modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-background flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur">
              <div className="flex items-center gap-3">
                <Receipt className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-semibold">Betslip Cart</h1>
                {totalSelections > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {totalSelections}
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
            <div className="flex-1 overflow-hidden">
              {betslips.length === 0 ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                    <Receipt className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h2 className="font-semibold text-2xl mb-3">Your cart is empty</h2>
                  <p className="text-muted-foreground text-lg mb-8 max-w-sm leading-relaxed">
                    Start building your betslips by adding player props and bets
                  </p>
                  <Button asChild size="lg" className="w-full max-w-sm h-12" onClick={onClose}>
                    <a href="/mlb/props">
                      Browse Player Props
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </a>
                  </Button>
                </div>
              ) : (
                /* Betslip Experience */
                <div className="h-full flex flex-col">
                  {/* Betslip Navigation */}
                  {betslips.length > 1 && (
                    <div className="flex items-center justify-between p-4 border-b bg-muted/20">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveBetslipIndex(Math.max(0, activeBetslipIndex - 1))}
                        disabled={activeBetslipIndex === 0}
                        className="flex items-center gap-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                          {betslips.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setActiveBetslipIndex(index)}
                              className={`w-3 h-3 rounded-full transition-colors ${
                                index === activeBetslipIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">
                          {activeBetslipIndex + 1} of {betslips.length}
                        </span>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveBetslipIndex(Math.min(betslips.length - 1, activeBetslipIndex + 1))}
                        disabled={activeBetslipIndex === betslips.length - 1}
                        className="flex items-center gap-2"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-4 pb-20">
                      {betslips[activeBetslipIndex] && (
                        <MobileBetslipCard 
                          betslip={betslips[activeBetslipIndex]} 
                          index={activeBetslipIndex}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Fixed Footer - Only show when we have betslips */}
            {betslips.length > 0 && (
              <div className="border-t p-4 bg-background/95 backdrop-blur">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-muted-foreground">
                    {betslips.length} betslip{betslips.length !== 1 ? 's' : ''} • {totalSelections} total selections
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" size="lg">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                  <Button className="flex-1" size="lg">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Mobile Betslip Card Component
function MobileBetslipCard({ betslip, index }: { betslip: any; index: number }) {
  const selectionCount = betslip.selections?.length || 0
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {betslip.title || `Betslip ${index + 1}`}
          </h2>
          <p className="text-muted-foreground text-lg mt-1">
            {selectionCount} pick{selectionCount !== 1 ? 's' : ''}
          </p>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          {selectionCount} picks
        </Badge>
      </div>

      {/* Selections List */}
      {selectionCount === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-xl mb-2">No picks yet</h3>
          <p className="text-muted-foreground text-base mb-6">
            Add some player props to get started
          </p>
          <Button variant="outline" size="lg">
            Add Picks
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {betslip.selections?.map((selection: any, idx: number) => (
            <Card key={idx} className="p-4 border border-border/50">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="font-semibold text-lg leading-tight mb-1">
                    {selection.player_name || selection.description}
                  </h4>
                  <p className="text-muted-foreground font-medium mb-2">
                    {selection.market} {selection.line ? `${selection.line}+` : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selection.sportsbook} • {selection.game_info}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <p className="font-bold text-xl mb-2">
                    {selection.odds > 0 ? `+${selection.odds}` : selection.odds}
                  </p>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {selectionCount > 0 && (
        <div className="pt-4">
          <Separator className="mb-6" />
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" size="lg" className="h-12">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Details
            </Button>
            <Button variant="destructive" size="lg" className="h-12">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 