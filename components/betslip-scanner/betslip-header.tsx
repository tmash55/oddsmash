"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { RefreshCw, Share2, Eye, EyeOff, Upload, Copy, MessageCircle, Scan, Clock, Edit2, Check, X, User } from "lucide-react"

interface BetslipHeaderProps {
  betslip: any
  user: any
  isOwner: boolean
  isPublicState: boolean
  isRefreshing: boolean
  isUpdatingPrivacy: boolean
  canRefresh: () => boolean
  getTimeUntilNextRefresh: () => number
  formatTimeRemaining: (ms: number) => string
  handleRefreshOdds: () => void
  handleTogglePrivacy: () => void
  handleUpdateTitle: (newTitle: string) => Promise<void>
  handleCopyLink: () => void
  shareToTwitter: () => void
  shareToReddit: () => void
}

export function BetslipHeader({
  betslip,
  user,
  isOwner,
  isPublicState,
  isRefreshing,
  isUpdatingPrivacy,
  canRefresh,
  getTimeUntilNextRefresh,
  formatTimeRemaining,
  handleRefreshOdds,
  handleTogglePrivacy,
  handleUpdateTitle,
  handleCopyLink,
  shareToTwitter,
  shareToReddit,
}: BetslipHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(betslip.title || "")
  const [isUpdatingTitle, setIsUpdatingTitle] = useState(false)

  const handleSaveTitle = async () => {
    if (editedTitle.trim() === betslip.title) {
      setIsEditingTitle(false)
      return
    }

    setIsUpdatingTitle(true)
    try {
      await handleUpdateTitle(editedTitle.trim())
      setIsEditingTitle(false)
    } catch (error) {
      console.error("Error updating title:", error)
      // Reset to original title on error
      setEditedTitle(betslip.title || "")
    } finally {
      setIsUpdatingTitle(false)
    }
  }

  const handleCancelEdit = () => {
    setEditedTitle(betslip.title || "")
    setIsEditingTitle(false)
  }
  return (
    <div className="mb-6">
      <TooltipProvider>
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-0 shadow-xl rounded-3xl p-6 sm:p-8">
          {/* Header Content */}
          <div className="space-y-6">
            {/* Title Section - Modern Layout */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <Scan className="h-6 w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  {/* Editable Title */}
                  <div className="flex items-center gap-2 mb-2">
                    {isEditingTitle ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveTitle()
                            if (e.key === "Escape") handleCancelEdit()
                          }}
                          className="text-xl font-bold border-2 border-blue-500 focus:border-blue-600"
                          autoFocus
                          disabled={isUpdatingTitle}
                        />
                        <Button
                          size="sm"
                          onClick={handleSaveTitle}
                          disabled={isUpdatingTitle || !editedTitle.trim()}
                          className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={isUpdatingTitle}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-1">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                          {betslip.title || "Untitled Betslip"}
                        </h1>
                        {isOwner && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsEditingTitle(true)}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Creator Info & Timestamp */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                        Created by {isOwner ? "you" : "another user"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                        {betslip.updated_at
                          ? (() => {
                              const updateTime = new Date(betslip.updated_at)
                              const now = new Date()
                              const diffMs = now.getTime() - updateTime.getTime()
                              const diffMins = Math.floor(diffMs / 60000)
                              const diffHours = Math.floor(diffMs / 3600000)
                              const diffDays = Math.floor(diffMs / 86400000)

                              if (diffMins < 1) return "Just updated"
                              if (diffMins < 60) return `${diffMins}m ago`
                              if (diffHours < 24) return `${diffHours}h ago`
                              if (diffDays < 7) return `${diffDays}d ago`

                              return updateTime.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })
                            })()
                          : "Recently scanned"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* New Scan Button - Enhanced */}
              <Button
                onClick={() => (window.location.href = "/betslip-scanner")}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white h-12 px-6 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
              >
                <Upload className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">New Scan</span>
                <span className="sm:hidden">Scan</span>
              </Button>
            </div>

            {/* Action Buttons - Mobile Optimized */}
            <div className="flex items-center gap-3">
              {/* Owner Actions */}
              {isOwner && (
                <>
                  {/* Refresh Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={handleRefreshOdds}
                        disabled={isRefreshing || !canRefresh()}
                        className="h-11 flex-1 sm:flex-none sm:min-w-[120px] border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-transparent"
                      >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""} sm:mr-2`} />
                        <span className="hidden sm:inline font-medium">
                          {isRefreshing ? "Refreshing..." : "Refresh"}
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isRefreshing
                        ? "Refreshing odds for all selections..."
                        : canRefresh()
                          ? "Refresh odds for all selections"
                          : "Refresh cooldown active - please wait before refreshing again"}
                    </TooltipContent>
                  </Tooltip>

                  {/* Privacy Toggle */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={handleTogglePrivacy}
                        disabled={isUpdatingPrivacy}
                        className="h-11 flex-1 sm:flex-none sm:min-w-[120px] border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-transparent"
                      >
                        {isPublicState ? <Eye className="h-4 w-4 sm:mr-2" /> : <EyeOff className="h-4 w-4 sm:mr-2" />}
                        <span className="hidden sm:inline font-medium">
                          {isUpdatingPrivacy ? "Updating..." : isPublicState ? "Make Private" : "Make Public"}
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isPublicState
                        ? "Make this betslip private (only you can view)"
                        : "Make this betslip public (shareable with others)"}
                    </TooltipContent>
                  </Tooltip>
                </>
              )}

              {/* Share Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-11 flex-1 sm:flex-none sm:min-w-[100px] border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-transparent"
                  >
                    <Share2 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline font-medium">Share</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-xl"
                >
                  <DropdownMenuItem
                    onClick={handleCopyLink}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Copy className="h-4 w-4 mr-3" />
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={shareToTwitter}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <MessageCircle className="h-4 w-4 mr-3" />
                    Share to Twitter
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={shareToReddit}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <MessageCircle className="h-4 w-4 mr-3" />
                    Share to Reddit
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Status Indicators - Only show if actively processing */}
            {(isRefreshing || isUpdatingPrivacy || isUpdatingTitle) && (
              <div className="flex items-center gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                {isRefreshing && (
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">Refreshing odds...</span>
                  </div>
                )}
                {isUpdatingPrivacy && (
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">Updating privacy...</span>
                  </div>
                )}
                {isUpdatingTitle && (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">Updating title...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </TooltipProvider>
    </div>
  )
}
