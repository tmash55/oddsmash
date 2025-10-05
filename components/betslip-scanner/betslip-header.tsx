"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { RefreshCw, Share2, Eye, EyeOff, Upload, Copy, Twitter, Facebook, Linkedin, Mail, MessageSquare, Scan, Clock, Edit2, Check, X, User } from "lucide-react"

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
  shareToX: () => void
  shareToReddit: () => void
  shareToFacebook: () => void
  shareToLinkedIn: () => void
  shareToWhatsApp: () => void
  shareToEmail: () => void
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
  shareToX,
  shareToReddit,
  shareToFacebook,
  shareToLinkedIn,
  shareToWhatsApp,
  shareToEmail,
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={shareToX}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Twitter className="h-4 w-4 mr-3" />
                    Share to X
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={shareToFacebook}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Facebook className="h-4 w-4 mr-3" />
                    Share to Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={shareToLinkedIn}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Linkedin className="h-4 w-4 mr-3" />
                    Share to LinkedIn
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={shareToReddit}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <MessageSquare className="h-4 w-4 mr-3" />
                    Share to Reddit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={shareToWhatsApp}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <svg className="h-4 w-4 mr-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Share to WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={shareToEmail}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Mail className="h-4 w-4 mr-3" />
                    Share via Email
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
