"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useBetslip } from "@/contexts/betslip-context"
import { useAuth } from "@/components/auth/auth-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

// Import our new components
import { BetslipPageHeader } from "@/components/betslip/betslip-page-header"
import { BetslipMobileStats } from "@/components/betslip/betslip-mobile-stats"
import { BetslipStatsCards } from "@/components/betslip/betslip-stats-cards"
import { BetslipEmptyState } from "@/components/betslip/betslip-empty-state"
import { BetslipFilterIndicator } from "@/components/betslip/betslip-filter-indicator"
import { BetslipScrollIndicator } from "@/components/betslip/betslip-scroll-indicator"
import { BetslipFAB } from "@/components/betslip/betslip-fab"
import { BetslipDialogs } from "@/components/betslip/betslip-dialogs"
import { BetslipCard } from "@/components/betslip/betslip-card"
import { MobileBetslipCard } from "@/components/betslip/mobile-betslip-card"

import type { FilterMode, BetslipStats } from "@/types/betslip"

export default function BetslipPageRefactored() {
  const router = useRouter()
  const { user } = useAuth()
  const { 
    betslips, 
    activeBetslipId, 
    isLoading,
    createBetslip,
    deleteBetslip,
    setActiveBetslip,
    calculateBetslipOdds,
    calculateBetslipPayout,
    updateBetslipTitle,
    setBetslipAsDefault,
    clearBetslip,
  } = useBetslip()

  // State management
  const [isCreating, setIsCreating] = useState(false)
  const [showNewBetslipDialog, setShowNewBetslipDialog] = useState(false)
  const [newBetslipTitle, setNewBetslipTitle] = useState("")
  const [comparingBetslips, setComparingBetslips] = useState<Set<string>>(new Set())
  const [filterMode, setFilterMode] = useState<FilterMode>("all")
  const [currentScrollIndex, setCurrentScrollIndex] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  // Dialog states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [betslipToDelete, setBetslipToDelete] = useState<string | null>(null)
  const [betslipToClear, setBetslipToClear] = useState<string | null>(null)

  // Calculate stats
  const stats: BetslipStats = {
    totalBetslips: betslips.length,
    totalSelections: betslips.reduce((total, betslip) => total + (betslip.selections?.length || 0), 0),
    activeSelectionCount: betslips.find((b) => b.id === activeBetslipId)?.selections?.length || 0,
    betslipsWithSelections: betslips.filter((b) => b.selections && b.selections.length > 0).length,
  }

  // Filter betslips
  const filteredBetslips = betslips.filter((betslip) => {
    if (filterMode === "ready") {
      return betslip.selections && betslip.selections.length > 0
    }
    if (filterMode === "active") {
      return betslip.id === activeBetslipId
    }
    return true
  })

  // Event handlers
  const handleStatsClick = (type: "total" | "ready" | "active") => {
    if (type === "total") {
      setFilterMode("all")
    } else if (type === "ready") {
      setFilterMode("ready")
    } else if (type === "active") {
      setFilterMode("active")
    }
  }

  const handleCreateBetslip = async () => {
    if (betslips.length >= 10) {
      toast.error("You can't have more than 10 betslips")
      return
    }
    
    setIsCreating(true)
    try {
      await createBetslip(newBetslipTitle || `Betslip ${betslips.length + 1}`, betslips.length === 0)
      setNewBetslipTitle("")
      setShowNewBetslipDialog(false)
      toast.success("Betslip created successfully")
    } catch (error) {
      console.error("Error creating betslip:", error)
      toast.error("Failed to create betslip")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteBetslip = async (betslipId: string) => {
    if (betslips.length <= 1) {
      toast.error("You must have at least one betslip")
      return
    }
    setBetslipToDelete(betslipId)
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteBetslip = async () => {
    if (betslipToDelete) {
      await deleteBetslip(betslipToDelete)
      toast.success("Betslip deleted")
      setBetslipToDelete(null)
    }
    setDeleteConfirmOpen(false)
  }

  const handleSetDefault = async (betslipId: string) => {
    await setBetslipAsDefault(betslipId)
    toast.success("Default betslip updated")
  }

  const handleViewBetslip = (betslipId: string) => {
    setActiveBetslip(betslipId)
    toast.success("Betslip activated")
  }

  const handleClearBetslip = async (betslipId: string) => {
    setBetslipToClear(betslipId)
    setClearConfirmOpen(true)
  }

  const confirmClearBetslip = async () => {
    if (betslipToClear) {
      try {
      await clearBetslip(betslipToClear)
      toast.success("Betslip cleared")
      setBetslipToClear(null)
      } catch (error) {
        console.error("Error clearing betslip:", error)
        toast.error("Failed to clear betslip")
      }
    }
    setClearConfirmOpen(false)
  }

  const handleCompareOdds = async (betslipId: string) => {
    const betslip = betslips.find((b) => b.id === betslipId)
    if (!betslip || !betslip.selections || betslip.selections.length === 0) {
      toast.error("No selections to compare")
      return
    }

    setComparingBetslips((prev) => new Set([...Array.from(prev), betslipId]))
    try {
      const response = await fetch(`/api/betslip/${betslipId}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to compare odds")
      }

      const data = await response.json()
      toast.success(`Odds comparison ready! ${data.selectionsCount} selections analyzed.`)
      router.push(`/betslip/${data.finalizedBetslipId}`)
    } catch (error) {
      console.error("Error comparing odds:", error)
      toast.error(error instanceof Error ? error.message : "Failed to compare odds")
    } finally {
      setComparingBetslips((prev) => {
        const newSet = new Set(Array.from(prev))
        newSet.delete(betslipId)
        return newSet
      })
    }
  }

  const handleInlineRename = async (betslipId: string, newTitle: string) => {
    try {
      await updateBetslipTitle(betslipId, newTitle)
      toast.success("Betslip renamed successfully")
    } catch (error) {
      console.error("Error renaming betslip:", error)
      toast.error("Failed to rename betslip")
    }
  }

  // Scroll handling for mobile
  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    const container = scrollContainerRef.current
    const cardWidth = 320 + 16
    const scrollLeft = container.scrollLeft
    const newIndex = Math.round(scrollLeft / cardWidth)
    if (newIndex !== currentScrollIndex) {
      setCurrentScrollIndex(Math.max(0, Math.min(newIndex, filteredBetslips.length - 1)))
    }
  }

  const scrollToIndex = (index: number) => {
    if (!scrollContainerRef.current) return
    const container = scrollContainerRef.current
    const cardWidth = 320 + 16
    const scrollLeft = index * cardWidth
    container.scrollTo({ left: scrollLeft, behavior: "smooth" })
    setCurrentScrollIndex(index)
  }

  // Effects
  useEffect(() => {
  if (!user) {
      router.push("/sign-in")
      return
    }
  }, [user, router])

  useEffect(() => {
    setCurrentScrollIndex(0)
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: "smooth" })
    }
  }, [filterMode])

  // Loading state
  if (!user) return null

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-950 dark:to-gray-900/50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-8">
              <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-80 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
              ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100/50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800/50">
        {/* Header */}
        <BetslipPageHeader
          stats={stats}
          isCreating={isCreating}
          onCreateBetslip={() => setShowNewBetslipDialog(true)}
          canCreateBetslip={betslips.length < 10}
        />

        {/* Mobile Stats */}
        <div className="lg:hidden">
          <BetslipMobileStats stats={stats} filterMode={filterMode} onStatsClick={handleStatsClick} />
              </div>

        {/* Desktop Stats */}
        <div className="hidden lg:block">
          <div className="container mx-auto px-6">
            <div className="max-w-7xl mx-auto">
              <BetslipStatsCards stats={stats} filterMode={filterMode} onStatsClick={handleStatsClick} />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 pt-20 pb-8 lg:px-0 lg:pt-0">
          {/* Desktop Container */}
          <div className="hidden lg:block">
            <div className="container mx-auto px-6">
              <div className="max-w-7xl mx-auto">
                {betslips.length === 0 ? (
                  <BetslipEmptyState onCreateBetslip={() => setShowNewBetslipDialog(true)} isCreating={isCreating} />
                ) : (
                  <>
                    <BetslipFilterIndicator
                      filterMode={filterMode}
                      filteredCount={filteredBetslips.length}
                      totalCount={betslips.length}
                      onClearFilter={() => setFilterMode("all")}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr gap-6">
                      <AnimatePresence>
                      {filteredBetslips.map((betslip, index) => (
                          <motion.div
                          key={betslip.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            <BetslipCard
                          betslip={betslip}
                          index={index}
                          isActive={betslip.id === activeBetslipId}
                          onView={() => handleViewBetslip(betslip.id)}
                          onDelete={() => handleDeleteBetslip(betslip.id)}
                          onSetDefault={() => handleSetDefault(betslip.id)}
                          onClear={() => handleClearBetslip(betslip.id)}
                          onCompareOdds={() => handleCompareOdds(betslip.id)}
                          onInlineRename={(newTitle: string) => handleInlineRename(betslip.id, newTitle)}
                          canDelete={betslips.length > 1}
                          calculateOdds={calculateBetslipOdds}
                          calculatePayout={calculateBetslipPayout}
                          isComparing={comparingBetslips.has(betslip.id)}
                        />
                          </motion.div>
                      ))}
                      </AnimatePresence>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Content */}
          <div className="block lg:hidden">
            {betslips.length === 0 ? (
              <BetslipEmptyState
                onCreateBetslip={() => setShowNewBetslipDialog(true)}
                isCreating={isCreating}
                isMobile
              />
            ) : (
              <>
                <BetslipFilterIndicator
                  filterMode={filterMode}
                  filteredCount={filteredBetslips.length}
                  totalCount={betslips.length}
                  onClearFilter={() => setFilterMode("all")}
                  isMobile
                />

                <div className="relative">
                  {filteredBetslips.length === 1 ? (
                    <div className="flex justify-center px-4">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="w-full max-w-sm"
                      >
                        <MobileBetslipCard
                          betslip={filteredBetslips[0]}
                          index={0}
                          isActive={filteredBetslips[0].id === activeBetslipId}
                          onView={() => handleViewBetslip(filteredBetslips[0].id)}
                          onDelete={() => handleDeleteBetslip(filteredBetslips[0].id)}
                          onSetDefault={() => handleSetDefault(filteredBetslips[0].id)}
                          onClear={() => handleClearBetslip(filteredBetslips[0].id)}
                          onCompareOdds={() => handleCompareOdds(filteredBetslips[0].id)}
                          onInlineRename={(newTitle: string) => handleInlineRename(filteredBetslips[0].id, newTitle)}
                          canDelete={betslips.length > 1}
                          calculateOdds={calculateBetslipOdds}
                          calculatePayout={calculateBetslipPayout}
                          isComparing={comparingBetslips.has(filteredBetslips[0].id)}
                        />
                      </motion.div>
                    </div>
                  ) : (
                    <>
                      <div 
                        ref={scrollContainerRef}
                        className="flex gap-4 overflow-x-auto pb-6 hide-scrollbar snap-x snap-mandatory px-4 py-2"
                        onScroll={handleScroll}
                      >
                        <AnimatePresence>
                        {filteredBetslips.map((betslip, index) => (
                            <motion.div
                            key={betslip.id} 
                              initial={{ opacity: 0, x: 50 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -50 }}
                              transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                              className="flex-shrink-0 w-80 snap-center"
                          >
                            <MobileBetslipCard
                              betslip={betslip}
                              index={index}
                              isActive={betslip.id === activeBetslipId}
                              onView={() => handleViewBetslip(betslip.id)}
                              onDelete={() => handleDeleteBetslip(betslip.id)}
                              onSetDefault={() => handleSetDefault(betslip.id)}
                              onClear={() => handleClearBetslip(betslip.id)}
                              onCompareOdds={() => handleCompareOdds(betslip.id)}
                              onInlineRename={(newTitle: string) => handleInlineRename(betslip.id, newTitle)}
                              canDelete={betslips.length > 1}
                              calculateOdds={calculateBetslipOdds}
                              calculatePayout={calculateBetslipPayout}
                              isComparing={comparingBetslips.has(betslip.id)}
                            />
                            </motion.div>
                        ))}
                        </AnimatePresence>
                      </div>
                      
                      <BetslipScrollIndicator
                        totalItems={filteredBetslips.length}
                        currentIndex={currentScrollIndex}
                        onScrollToIndex={scrollToIndex}
                      />
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <BetslipFAB />

        <BetslipDialogs
          showNewBetslipDialog={showNewBetslipDialog}
          setShowNewBetslipDialog={setShowNewBetslipDialog}
          newBetslipTitle={newBetslipTitle}
          setNewBetslipTitle={setNewBetslipTitle}
          onCreateBetslip={handleCreateBetslip}
          isCreating={isCreating}
          totalBetslips={betslips.length}
          deleteConfirmOpen={deleteConfirmOpen}
          setDeleteConfirmOpen={setDeleteConfirmOpen}
          onConfirmDelete={confirmDeleteBetslip}
          clearConfirmOpen={clearConfirmOpen}
          setClearConfirmOpen={setClearConfirmOpen}
          onConfirmClear={confirmClearBetslip}
              />
            </div>
    </TooltipProvider>
  )
}
