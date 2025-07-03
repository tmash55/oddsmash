"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useBetslip } from "@/contexts/betslip-context"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { 
  Plus, 
  Trash2, 
  ExternalLink, 
  ArrowRight,
  Edit3,
  TrendingUp,
  Calendar,
  DollarSign,
  Star,
  Pencil,
  Loader2,
  Search,
  Target,
  Info,
  Check,
  X,
  Clock,
  Receipt,
  ChevronDown
} from "lucide-react"
import { formatOdds } from "@/lib/utils"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { SPORT_MARKETS } from "@/lib/constants/markets"
import { formatDistanceToNow } from "date-fns"

// Helper function to get proper market label from markets.ts
const getMarketLabel = (marketKey: string, sport: string = "baseball_mlb"): string => {
  const markets = SPORT_MARKETS[sport] || SPORT_MARKETS["baseball_mlb"]
  const market = markets.find(m => m.value === marketKey || m.apiKey === marketKey)
  return market?.label || marketKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Helper function to format selection display
const formatSelectionDisplay = (selection: any): { mainText: string; subText: string } => {
  const marketLabel = getMarketLabel(selection.market_key || selection.market)
  const line = selection.line ? Math.ceil(selection.line) : null
  
  // Format main text (player name or selection description)
  const mainText = selection.player_name || selection.selection || "Unknown Selection"
  
  // Format sub text (market + line if available)
  let subText = marketLabel
  if (line !== null) {
    subText = `${line}+ ${marketLabel}`
  }
  
  return { mainText, subText }
}

export default function BetslipPage() {
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
    clearBetslip
  } = useBetslip()

  const [isCreating, setIsCreating] = useState(false)
  const [showNewBetslipDialog, setShowNewBetslipDialog] = useState(false)
  const [newBetslipTitle, setNewBetslipTitle] = useState("")
  const [comparingBetslips, setComparingBetslips] = useState<Set<string>>(new Set())
  const [filterMode, setFilterMode] = useState<'all' | 'ready' | 'active'>('all')
  const [currentScrollIndex, setCurrentScrollIndex] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [swipeStates, setSwipeStates] = useState<Record<string, { isOpen: boolean; direction: 'left' | 'right' | null }>>({})
  
  // Add state for confirmation dialogs
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [betslipToDelete, setBetslipToDelete] = useState<string | null>(null)
  const [betslipToClear, setBetslipToClear] = useState<string | null>(null)

  // Calculate stats
  const totalSelections = betslips.reduce((total, betslip) => total + (betslip.selections?.length || 0), 0)
  const activeBetslip = betslips.find(b => b.id === activeBetslipId)
  const activeSelectionCount = activeBetslip?.selections?.length || 0
  const betslipsWithSelections = betslips.filter(b => b.selections && b.selections.length > 0).length

  // Filter betslips based on current filter mode
  const filteredBetslips = betslips.filter(betslip => {
    if (filterMode === 'ready') {
      return betslip.selections && betslip.selections.length > 0
    }
    if (filterMode === 'active') {
      return betslip.id === activeBetslipId
    }
    return true // 'all'
  })

  const handleStatsClick = (type: 'total' | 'ready' | 'active') => {
    if (type === 'total') {
      setFilterMode('all')
    } else if (type === 'ready') {
      setFilterMode('ready')
    } else if (type === 'active') {
      setFilterMode('active')
    }
  }

  useEffect(() => {
    if (!user) {
      router.push("/sign-in")
      return
    }
  }, [user, router])

  // Reset scroll index when filter changes
  useEffect(() => {
    setCurrentScrollIndex(0)
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' })
    }
  }, [filterMode])

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
      await clearBetslip(betslipToClear)
      toast.success("Betslip cleared")
      setBetslipToClear(null)
    }
    setClearConfirmOpen(false)
  }

  const handleCompareOdds = async (betslipId: string) => {
    const betslip = betslips.find(b => b.id === betslipId)
    if (!betslip || !betslip.selections || betslip.selections.length === 0) {
      toast.error("No selections to compare")
      return
    }

    setComparingBetslips(prev => new Set([...Array.from(prev), betslipId]))

    try {
      const response = await fetch(`/api/betslip/${betslipId}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to compare odds')
      }

      const data = await response.json()
      
      toast.success(`Odds comparison ready! ${data.selectionsCount} selections analyzed.`)
      
      // Navigate to the new finalized betslip
      router.push(`/betslip/${data.finalizedBetslipId}`)
      
    } catch (error) {
      console.error('Error comparing odds:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to compare odds')
    } finally {
      setComparingBetslips(prev => {
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
      console.error('Error renaming betslip:', error)
      toast.error("Failed to rename betslip")
    }
  }

  // Handle scroll tracking for mobile carousel
  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    
    const container = scrollContainerRef.current
    const cardWidth = 320 + 16 // 320px card + 16px gap
    const scrollLeft = container.scrollLeft
    const newIndex = Math.round(scrollLeft / cardWidth)
    
    if (newIndex !== currentScrollIndex) {
      setCurrentScrollIndex(Math.max(0, Math.min(newIndex, filteredBetslips.length - 1)))
    }
  }

  // Scroll to specific betslip
  const scrollToIndex = (index: number) => {
    if (!scrollContainerRef.current) return
    
    const container = scrollContainerRef.current
    const cardWidth = 320 + 16 // 320px card + 16px gap
    const scrollLeft = index * cardWidth
    
    container.scrollTo({
      left: scrollLeft,
      behavior: 'smooth'
    })
    setCurrentScrollIndex(index)
  }

  if (!user) {
    return null
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      {/* Mobile-First Container */}
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50">
        
        {/* Mobile Header - iOS Style */}
        <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 lg:hidden">
          <div className="px-4 py-3">
            {/* Main Header Row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Receipt className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">Betslips</h1>
                  <p className="text-xs text-muted-foreground">
                    Organize and compare your bets
                  </p>
                </div>
              </div>

              {/* Mobile Action Buttons */}
              <div className="flex items-center gap-2">
                {/* In Cart Indicator - Mobile Optimized */}
                {activeBetslip && activeSelectionCount > 0 && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-950/20 rounded-full border border-green-200 dark:border-green-800">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-green-700 dark:text-green-400">
                      {activeSelectionCount}
                    </span>
                  </div>
                )}
                
                <Button 
                  size="sm"
                  onClick={() => setShowNewBetslipDialog(true)} 
                  disabled={isCreating || betslips.length >= 10}
                  className="h-8 px-3"
                >
                  <Plus className="h-3 w-3 mr-1.5" />
                  New
                </Button>
              </div>
            </div>

            {/* Condensed Stats Row - Mobile Only */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
              <button
                onClick={() => handleStatsClick('total')}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                  filterMode === 'all' 
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800" 
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                {betslips.length} Total
              </button>
              
              <button
                onClick={() => handleStatsClick('ready')}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                  filterMode === 'ready' 
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 ring-1 ring-purple-200 dark:ring-purple-800" 
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                {betslipsWithSelections} Ready
              </button>
              
              <button
                onClick={() => handleStatsClick('active')}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                  filterMode === 'active' 
                    ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 ring-1 ring-orange-200 dark:ring-orange-800" 
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                {activeSelectionCount} In Cart
              </button>
              
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400">
                <TrendingUp className="h-3 w-3" />
                {totalSelections} Picks
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Header - Restored Original */}
        <div className="hidden lg:block">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
              {/* Enhanced Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Receipt className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">My Betslips</h1>
                    <p className="text-muted-foreground">
                      Organize and compare your betting selections
                    </p>
                  </div>
                </div>

                {/* Enhanced Button Group */}
                <div className="flex items-center gap-2">
                  {/* Current Betslip Indicator */}
                  {activeBetslip && activeSelectionCount > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">
                        In Cart: {activeSelectionCount} item{activeSelectionCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  
                  <Button variant="outline" size="default" asChild className="h-10">
                    <a href="/mlb/props">
                      <Target className="h-4 w-4 mr-2" />
                      Browse Props
                    </a>
                  </Button>
                  <Button 
                    onClick={() => setShowNewBetslipDialog(true)} 
                    disabled={isCreating || betslips.length >= 10}
                    size="default"
                    className="h-10"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Betslip
                  </Button>
                </div>
              </div>

              {/* Enhanced Stats Bar with Filtering - Desktop Only */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Card 
                        className={cn(
                          "p-4 transition-all duration-200 cursor-pointer hover:shadow-lg hover:scale-[1.02]",
                          filterMode === 'all' ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20" : "hover:shadow-md"
                        )}
                        onClick={() => handleStatsClick('total')}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                            <Receipt className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{betslips.length}</p>
                            <p className="text-sm text-muted-foreground">Total Betslips</p>
                          </div>
                        </div>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to view all betslips in your collection</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Card className="p-4 hover:shadow-md transition-shadow cursor-help">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                            <Receipt className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{totalSelections}</p>
                            <p className="text-sm text-muted-foreground">Total Selections</p>
                          </div>
                        </div>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total number of bets across all betslips</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Card 
                        className={cn(
                          "p-4 transition-all duration-200 cursor-pointer hover:shadow-lg hover:scale-[1.02]",
                          filterMode === 'ready' ? "ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-950/20" : "hover:shadow-md"
                        )}
                        onClick={() => handleStatsClick('ready')}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                            <Receipt className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{betslipsWithSelections}</p>
                            <p className="text-sm text-muted-foreground">Ready to Compare</p>
                          </div>
                        </div>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to view betslips with selections ready for odds comparison</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Card 
                        className={cn(
                          "p-4 transition-all duration-200 cursor-pointer hover:shadow-lg hover:scale-[1.02]",
                          filterMode === 'active' ? "ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-950/20" : "hover:shadow-md"
                        )}
                        onClick={() => handleStatsClick('active')}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                            <Receipt className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{activeSelectionCount}</p>
                            <p className="text-sm text-muted-foreground">In Cart</p>
                          </div>
                        </div>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to view your current active betslip</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 pt-20 pb-4 lg:px-0 lg:pt-4">
          {/* Desktop Container */}
          <div className="hidden lg:block">
            <div className="container mx-auto px-4">
              <div className="max-w-7xl mx-auto">
                {betslips.length === 0 ? (
                  /* Empty State */
                  <Card className="border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center py-20 px-6 text-center">
                      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                        <Receipt className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold text-2xl mb-4">No betslips yet</h3>
                      <p className="text-muted-foreground text-lg mb-8 max-w-md">
                        Create your first betslip to start organizing your player props and bets
                      </p>
                      <div className="flex items-center gap-4">
                        <Button size="lg" onClick={() => setShowNewBetslipDialog(true)} disabled={isCreating}>
                          <Plus className="h-5 w-5 mr-2" />
                          Create First Betslip
                        </Button>
                        <Button variant="outline" size="lg" asChild>
                          <a href="/mlb/props">
                            Browse Props
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Filter Indicator */}
                    {filterMode !== 'all' && (
                      <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-sm font-medium">
                            Showing: {filterMode === 'ready' ? 'Ready to Compare' : 'Current Betslip'} 
                            ({filteredBetslips.length} of {betslips.length})
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFilterMode('all')}
                          className="text-xs"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Show All
                        </Button>
                      </div>
                    )}
                    
                    {/* Desktop: Grid Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredBetslips.map((betslip, index) => (
                        <BetslipCard
                          key={betslip.id}
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
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Content */}
          <div className="block lg:hidden">
            {betslips.length === 0 ? (
              /* Empty State - Mobile Optimized */
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
                  <Receipt className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No betslips yet</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  Create your first betslip to start organizing your player props and bets
                </p>
                <div className="flex flex-col items-center gap-3 w-full max-w-sm">
                  <Button 
                    size="lg" 
                    onClick={() => setShowNewBetslipDialog(true)} 
                    disabled={isCreating}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Betslip
                  </Button>
                  <Button variant="outline" size="lg" asChild className="w-full">
                    <a href="/mlb/props">
                      Browse Props
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Filter Indicator - Mobile Optimized */}
                {filterMode !== 'all' && (
                  <div className="flex items-center justify-between mb-4 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm font-medium">
                        {filterMode === 'ready' ? 'Ready to Compare' : 'Current Betslip'} 
                        <span className="text-muted-foreground ml-1">
                          ({filteredBetslips.length} of {betslips.length})
                        </span>
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFilterMode('all')}
                      className="text-xs h-6 px-2"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Show All
                    </Button>
                  </div>
                )}
                
                {/* Mobile: Horizontal Scroll with Centering */}
                <div className="relative">
                  {filteredBetslips.length === 1 ? (
                    /* Single card - centered */
                    <div className="flex justify-center">
                      <div 
                        className={cn(
                          "w-80 max-w-full",
                          "animate-in zoom-in-95 fade-in-0 duration-500 ease-out"
                        )}
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
                      </div>
                    </div>
                  ) : (
                    /* Multiple cards - horizontal scroll */
                    <>
                      <div 
                        ref={scrollContainerRef}
                        className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory px-4 py-1"
                        onScroll={handleScroll}
                      >
                        {filteredBetslips.map((betslip, index) => (
                          <div 
                            key={betslip.id} 
                            className={cn(
                              "flex-shrink-0 w-80 snap-center",
                              "animate-in slide-in-from-right-10 fade-in-0",
                              "duration-500 ease-out"
                            )}
                            style={{
                              animationDelay: `${index * 100}ms`,
                              animationFillMode: 'both'
                            }}
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
                          </div>
                        ))}
                      </div>
                      
                      {/* Enhanced Interactive Scroll Indicator */}
                      <div className="flex justify-center mt-4">
                        <div className="flex gap-2 p-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                          {filteredBetslips.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => scrollToIndex(index)}
                              className={cn(
                                "relative transition-all duration-300 ease-out hover:scale-110 active:scale-95",
                                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 rounded-full",
                                currentScrollIndex === index
                                  ? "w-8 h-3 bg-primary shadow-sm" // Active: wider pill shape
                                  : "w-3 h-3 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                              )}
                              aria-label={`Go to betslip ${index + 1}${currentScrollIndex === index ? ' (current)' : ''}`}
                              style={{
                                borderRadius: currentScrollIndex === index ? '12px' : '50%'
                              }}
                            >
                              {/* Subtle inner glow for active state */}
                              {currentScrollIndex === index && (
                                <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile FAB for Browse Props */}
        <div className="fixed bottom-6 right-6 lg:hidden">
          <Button size="lg" asChild className="rounded-full w-14 h-14 shadow-lg">
            <a href="/mlb/props">
              <Target className="h-6 w-6" />
            </a>
          </Button>
        </div>
      </div>

      {/* New Betslip Dialog */}
      <Dialog open={showNewBetslipDialog} onOpenChange={setShowNewBetslipDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Betslip</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="betslip-name">Betslip Name (Optional)</Label>
              <Input
                id="betslip-name"
                placeholder={`Betslip ${betslips.length + 1}`}
                value={newBetslipTitle}
                onChange={(e) => setNewBetslipTitle(e.target.value)}
                maxLength={50}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewBetslipDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBetslip} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Betslip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Betslip</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this betslip? All selections will be lost and this action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteBetslip}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Betslip
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Confirmation Dialog */}
      <AlertDialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Selections</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all selections from this betslip? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmClearBetslip}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  )
}

// Mobile-Optimized Betslip Card Component
interface MobileBetslipCardProps {
  betslip: any
  index: number
  isActive: boolean
  onView: () => void
  onDelete: () => void
  onSetDefault: () => void
  onClear: () => void
  onCompareOdds: () => void
  onInlineRename: (newTitle: string) => void
  canDelete: boolean
  calculateOdds: (betslipId: string) => number | null
  calculatePayout: (betslipId: string, wager: number) => number
  isComparing: boolean
}

function MobileBetslipCard({ 
  betslip, 
  index, 
  isActive, 
  onView, 
  onDelete, 
  onSetDefault,
  onClear,
  onCompareOdds,
  onInlineRename,
  canDelete,
  calculateOdds,
  calculatePayout,
  isComparing
}: MobileBetslipCardProps) {
  const selectionCount = betslip.selections?.length || 0
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState(betslip.title || `Betslip ${index + 1}`)

  const handleTitleSubmit = () => {
    onInlineRename(editTitle)
    setIsEditingTitle(false)
  }

  const handleTitleCancel = () => {
    setEditTitle(betslip.title || `Betslip ${index + 1}`)
    setIsEditingTitle(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit()
    } else if (e.key === 'Escape') {
      handleTitleCancel()
    }
  }

  return (
    <Card 
      className={cn(
        "h-full transition-all duration-300 touch-manipulation",
        isActive 
          ? "border-2 border-primary shadow-lg bg-gradient-to-br from-primary/5 to-primary/10 m-0.5" 
          : "bg-white dark:bg-gray-900 shadow-sm hover:shadow-md"
      )}
    >
      {/* Mobile Header */}
      <CardHeader className="pb-4 space-y-4">
        {/* Title Row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isEditingTitle ? (
              <div className="flex items-center gap-1 flex-1">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={handleKeyPress}
                  onBlur={handleTitleSubmit}
                  className="h-9 text-lg font-bold"
                  maxLength={50}
                  autoFocus
                />
                <Button size="sm" variant="ghost" onClick={handleTitleSubmit} className="h-8 w-8 p-0">
                  <Check className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleTitleCancel} className="h-8 w-8 p-0">
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <CardTitle 
                className="text-lg font-bold cursor-pointer hover:text-primary transition-colors truncate leading-tight"
                onClick={() => setIsEditingTitle(true)}
              >
                {betslip.title || `Betslip ${index + 1}`}
              </CardTitle>
            )}
          </div>
          
          {/* Status Badges */}
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
            {isActive && (
              <Badge className="text-xs bg-green-600 hover:bg-green-700 px-2.5 py-1">
                <div className="w-1 h-1 bg-white rounded-full mr-1.5 animate-pulse"></div>
                Current
              </Badge>
            )}
            {betslip.is_default && (
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            )}
          </div>
        </div>

        {/* Meta Info Row */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{formatDistanceToNow(new Date(betslip.updated_at), { addSuffix: true })}</span>
          </div>
          <Badge variant="outline" className="text-sm px-2.5 py-1">
            {selectionCount} {selectionCount === 1 ? 'pick' : 'picks'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-5 pb-5">
        {/* Selections Preview */}
        {selectionCount > 0 ? (
          <div className="space-y-2">
            {betslip.selections?.slice(0, 2).map((selection: any, idx: number) => {
              const { mainText, subText } = formatSelectionDisplay(selection)
              return (
                <div key={idx} className="p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <p className="font-medium text-sm truncate mb-0.5">
                    {mainText}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {subText}
                  </p>
                </div>
              )
            })}
            
            {selectionCount > 2 && (
              <div className="text-xs text-center py-2 text-muted-foreground">
                +{selectionCount - 2} more selections
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <TrendingUp className="h-6 w-6 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">No selections yet</p>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <a href="/mlb/props">
                Browse Props
              </a>
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-2">
          {/* Current Status / Make Current */}
          {isActive ? (
            <div className="flex items-center justify-center py-2.5 px-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm font-medium text-green-700 dark:text-green-400">Current Betslip</span>
            </div>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full h-9 hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={onView}
            >
              Make Current
            </Button>
          )}
          
          {/* Compare Odds - Primary Action */}
          {selectionCount > 0 && (
            <Button 
              size="sm"
              className="w-full h-9 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium"
              onClick={onCompareOdds}
              disabled={isComparing}
            >
              {isComparing ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Comparing...
                </>
              ) : (
                <>
                  <ArrowRight className="h-3 w-3 mr-2" />
                  Compare Odds
                </>
              )}
            </Button>
          )}
          
          {/* Secondary Actions */}
          <div className="flex items-center gap-2">
            {!betslip.is_default && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onSetDefault}
                className="flex-1 text-xs h-8"
              >
                <Star className="h-3 w-3 mr-1" />
                Default
              </Button>
            )}
            {selectionCount > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onClear}
                className={cn("text-xs h-8", betslip.is_default ? "flex-1" : "")}
              >
                Clear
              </Button>
            )}
            {canDelete && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onDelete}
                className="text-destructive hover:text-destructive h-8 px-2"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Enhanced Individual Betslip Card Component
interface BetslipCardProps {
  betslip: any
  index: number
  isActive: boolean
  onView: () => void
  onDelete: () => void
  onSetDefault: () => void
  onClear: () => void
  onCompareOdds: () => void
  onInlineRename: (newTitle: string) => void
  canDelete: boolean
  calculateOdds: (betslipId: string) => number | null
  calculatePayout: (betslipId: string, wager: number) => number
  isComparing: boolean
}

function BetslipCard({ 
  betslip, 
  index, 
  isActive, 
  onView, 
  onDelete, 
  onSetDefault,
  onClear,
  onCompareOdds,
  onInlineRename,
  canDelete,
  calculateOdds,
  calculatePayout,
  isComparing
}: BetslipCardProps) {
  const selectionCount = betslip.selections?.length || 0
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState(betslip.title || `Betslip ${index + 1}`)

  const handleTitleSubmit = () => {
    onInlineRename(editTitle)
    setIsEditingTitle(false)
  }

  const handleTitleCancel = () => {
    setEditTitle(betslip.title || `Betslip ${index + 1}`)
    setIsEditingTitle(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit()
    } else if (e.key === 'Escape') {
      handleTitleCancel()
    }
  }

  return (
    <Card className={cn(
      "h-fit transition-all duration-200 hover:shadow-lg hover:scale-[1.02]",
      isActive 
        ? "ring-2 ring-primary ring-offset-2 shadow-lg bg-primary/5" 
        : "hover:shadow-md hover:bg-muted/20"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isEditingTitle ? (
              <div className="flex items-center gap-1 flex-1">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={handleKeyPress}
                  onBlur={handleTitleSubmit}
                  className="h-7 text-lg font-semibold"
                  maxLength={50}
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleTitleSubmit}
                  className="h-7 w-7 p-0"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleTitleCancel}
                  className="h-7 w-7 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <CardTitle 
                className="text-lg cursor-pointer hover:text-primary transition-colors truncate"
                onClick={() => setIsEditingTitle(true)}
              >
                {betslip.title || `Betslip ${index + 1}`}
              </CardTitle>
            )}
            {isActive && (
              <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700">
                <div className="w-1.5 h-1.5 bg-white rounded-full mr-1.5"></div>
                Current
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {betslip.is_default && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Star className="h-4 w-4 fill-primary text-primary" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Default betslip</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Badge variant="outline" className="text-xs">
              {selectionCount} picks
            </Badge>
          </div>
        </div>
        {/* Last updated moved to header */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Updated {formatDistanceToNow(new Date(betslip.updated_at), { addSuffix: true })}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Selections Preview */}
        {selectionCount > 0 ? (
          <div className="space-y-2">
            {betslip.selections?.slice(0, 3).map((selection: any, idx: number) => {
              const { mainText, subText } = formatSelectionDisplay(selection)
              return (
                <div key={idx} className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {mainText}
                    </p>
                    <p className="text-muted-foreground text-xs truncate">
                      {subText}
                    </p>
                  </div>
                </div>
              )
            })}
            
            {selectionCount > 3 && (
              <div className="text-xs text-muted-foreground text-center py-2 bg-muted/30 rounded-lg">
                +{selectionCount - 3} more selections
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No selections yet</p>
            <Button variant="ghost" size="sm" asChild className="mt-2">
              <a href="/mlb/props">
                Browse Props
              </a>
            </Button>
          </div>
        )}

        <Separator />

        {/* Actions */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {isActive ? (
              <div className="flex-1 flex items-center justify-center py-2 px-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm font-medium text-green-700 dark:text-green-400">Current Betslip</span>
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={onView}
              >
                Make Current
              </Button>
            )}
          </div>
          
          {/* Compare Odds Button - Only show if betslip has selections */}
          {selectionCount > 0 && (
            <Button 
              variant="default" 
              size="sm"
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold"
              onClick={onCompareOdds}
              disabled={isComparing}
            >
              {isComparing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Comparing...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Compare Odds
                </>
              )}
            </Button>
          )}
          
          <div className="flex items-center gap-2">
            {!betslip.is_default && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onSetDefault}
                className="flex-1 text-xs"
              >
                <Star className="h-3 w-3 mr-1" />
                Set Default
              </Button>
            )}
            {selectionCount > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onClear}
                className={cn("text-xs", betslip.is_default ? "flex-1" : "")}
              >
                Clear All
              </Button>
            )}
            {canDelete && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onDelete}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 